import { TypeWithID } from '../types'

type ExtractIdType<T> = T extends TypeWithID
  ? T['id']
  : T extends string
    ? string
    : T extends number
      ? number
      : T extends undefined
        ? undefined
        : T extends null
          ? null
          : never

export function getIdFromObject<T extends TypeWithID | null | number | string | undefined>(
  objectOrId: T,
): ExtractIdType<T> {
  if (objectOrId === undefined || objectOrId === null) {
    return objectOrId as unknown as ExtractIdType<T>
  }

  if (typeof objectOrId === 'string' || typeof objectOrId === 'number') {
    return objectOrId as unknown as ExtractIdType<T>
  }

  return objectOrId.id as ExtractIdType<T>
}
