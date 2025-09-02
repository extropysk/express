import { AccessArgs, AccessResult, FieldAccess, User } from '../types'
import { getIdFromObject } from '../utils'

export enum Action {
  NONE = 0,
  READ = 1 << 0,
  CREATE = 1 << 1,
  UPDATE = 1 << 2,
  DELETE = 1 << 3,
  WRITE = CREATE | UPDATE | DELETE,
  READ_WRITE = READ | WRITE,
}

interface Group {
  permissions?: Permission[] | null
  roles?: null | unknown[]
  [key: string]: unknown
}

export interface Permission {
  action: Action | string
  subject: string
}

interface Args {
  adminRole: string
  getCurrentTenant?: (user?: User, cookie?: string) => null | string
  getRolePermissions: (role: unknown) => Permission[]
  tenants?: {
    arrayField: string
    arrayGroupField: string
    groupField: string
  }
}

type Options = {
  allowGet?: boolean
  defaultAccess?: ({ user }: { user: User | null }) => AccessResult
  groupField?: string
}

export class Guard {
  constructor(protected args: Args) {}

  protected checkGroup = (group: Group, subject: string, requiredAction?: Action) => {
    let action = 0

    const permission = group.permissions?.find(permission => permission.subject === subject)
    if (permission) {
      action = Number(permission.action)
    } else {
      const rolePermissions: Permission[] = (group.roles ?? []).flatMap(role => {
        return this.args.getRolePermissions(role)
      })
      rolePermissions.forEach(permission => {
        if (permission.subject === subject) {
          action |= Number(permission.action)
        }
      })
    }

    if (requiredAction) {
      action &= requiredAction
    }
    return action > 0
  }

  checkAdmin = (user: User | null) => {
    return this.checkRole([this.args.adminRole], user)
  }

  checkFieldPermission =
    (subject: string, action: Action, groupField?: string): FieldAccess<any, any, User> =>
    ({ doc, req: { user, headers } }): boolean => {
      if (this.checkAdmin(user)) {
        return true
      }

      if (!user) {
        return false
      }

      if (!this.args.tenants) {
        return this.checkGroup(user, subject, action)
      }

      let groups = this.getUserGroups(user, subject, action)

      if (!doc) {
        return groups.length > 0
      }

      const selectedUserTenantId = this.args.getCurrentTenant?.(user, headers.cookie)
      if (selectedUserTenantId && groups.includes(selectedUserTenantId)) {
        groups = [selectedUserTenantId]
      }

      return groups.includes(
        getIdFromObject(doc[groupField ?? this.args.tenants.groupField] ?? doc.id),
      )
    }

  checkPermission =
    (
      subject: string,
      action: Action,
      { groupField, defaultAccess = () => false, allowGet = false }: Options = {},
    ) =>
    ({ req: { user, headers }, id }: AccessArgs<unknown, User>): AccessResult => {
      const isAdmin = this.checkAdmin(user)

      if ((allowGet || isAdmin) && id && action === Action.READ) {
        return true
      }

      if (!user) {
        return defaultAccess({ user })
      }

      if (!this.args.tenants) {
        if (isAdmin || this.checkGroup(user, subject, action)) {
          return true
        } else {
          return defaultAccess({ user })
        }
      }

      const selectedUserTenantId = this.args.getCurrentTenant?.(user, headers.cookie)
      if (isAdmin) {
        if (selectedUserTenantId) {
          return {
            [groupField ?? this.args.tenants.groupField]: { in: [selectedUserTenantId] },
          }
        }
        return true
      }

      let groups = this.getUserGroups(user, subject, action)

      if (!groups.length) {
        return defaultAccess({ user })
      }

      if (selectedUserTenantId && groups.includes(selectedUserTenantId)) {
        groups = [selectedUserTenantId]
      }

      return {
        [groupField ?? this.args.tenants.groupField]: { in: groups },
      }
    }

  protected checkRole = (roles: string[], user: User | null) => {
    if (!user) {
      return false
    }

    return roles.some(role => {
      const userRoles = (user?.roles ?? []) as string[]
      return userRoles.some(individualRole => {
        return individualRole === role
      })
    })
  }

  getUserGroups = (user: User, subject: string, requiredAction?: Action) => {
    if (!this.args.tenants) {
      return []
    }

    const userGroups = (user?.[this.args.tenants.arrayField] ?? []) as Group[]
    const groups = userGroups.filter(group => this.checkGroup(group, subject, requiredAction))

    const arrayGroupField = this.args.tenants.arrayGroupField
    return groups.map(group => {
      const groupId = group[arrayGroupField] as string
      return getIdFromObject(groupId)
    })
  }

  isHidden =
    (subject: string) =>
    ({ user }: { user: User }) => {
      if (!user) {
        return true
      }

      if (this.checkAdmin(user)) {
        return false
      }

      if (!this.args.tenants) {
        return this.checkGroup(user, subject) === false
      }

      return this.getUserGroups(user, subject).length === 0
    }
}
