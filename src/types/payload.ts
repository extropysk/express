import type { Request } from 'express'

export type User = {
  [key: string]: unknown
  collection: string
  email: string
  id: string
}

export type PayloadRequest<U = any> = Request & {
  user: (U & User) | null
  locale?: string
  context: Record<string, unknown>
}

export type AccessArgs<T = any, U = any> = {
  /**
   * The relevant resource that is being accessed.
   *
   * `data` is null when a list is requested
   */
  data?: T
  /** ID of the resource being accessed */
  id?: number | string
  /** The original request that requires an access check */
  req: PayloadRequest<U>
}

export const Operators = [
  'equals',
  'contains',
  'not_equals',
  'in',
  'all',
  'not_in',
  'exists',
  'greater_than',
  'greater_than_equal',
  'less_than',
  'less_than_equal',
  'like',
  'within',
  'intersects',
  'near',
] as const

export type Operator = (typeof Operators)[number]

export type WhereField = {
  [key in Operator]?: unknown
}

export type Where = {
  [key: string]: Where[] | WhereField | undefined
  and?: Where[]
  or?: Where[]
}

export type AccessResult = Where | boolean

export type Access<T = any, U = any> = (
  args: AccessArgs<T, U>,
) => AccessResult | Promise<AccessResult>
