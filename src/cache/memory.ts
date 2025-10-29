import { BaseCache } from '@/cache/base'
import { Obj } from '@/types'
import { LRUCache } from 'lru-cache'

type Options = {
  max: number
  ttl: number
}

export class MemoryCache extends BaseCache {
  private cache: LRUCache<string, Obj>

  constructor(options: Options) {
    super()
    this.cache = new LRUCache(options)
  }

  async set<T extends Obj = Obj>(key: string, value: T): Promise<void> {
    this.cache.set(key, value)
  }

  async get<T extends Obj = Obj>(key: string): Promise<T | undefined> {
    return this.cache.get(key) as T
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }
}
