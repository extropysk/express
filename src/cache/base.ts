import { Obj } from '@/types'

export abstract class BaseCache {
  abstract set<T extends Obj = Obj>(key: string, value: T): Promise<void>
  abstract get<T extends Obj = Obj>(key: string): Promise<T | undefined>
  abstract has(key: string): Promise<boolean>
}
