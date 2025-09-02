import type { Request } from 'express'

export type TypeWithID = {
  id: number | string
}

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
  data?: T
  id?: number | string
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
  [key: string]: Where[] | WhereField
  // @ts-expect-error payload
  and?: Where[]
  // @ts-expect-error payload
  or?: Where[]
}

export type AccessResult = Where | boolean

export type Access<T = any, U = any> = (
  args: AccessArgs<T, U>,
) => AccessResult | Promise<AccessResult>

export type FieldAccess<T extends TypeWithID = any, P = any, U = any> = (args: {
  data?: Partial<T>
  doc?: T
  id?: number | string
  req: PayloadRequest<U>
  siblingData?: Partial<P>
}) => Promise<boolean> | boolean
