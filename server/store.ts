import { Redis } from '@upstash/redis'
import { demoMode } from './config.js'
import { invalidateCatalog } from './catalog.js'
import type { Product } from '../src/data.js'
import type { Fulfillment } from '../src/pricing.js'

export type Order = {
  ref: string
  sessionId: string
  status: 'pending' | 'paid' | 'declined'
  demo: boolean
  createdAt: string
  paidAt?: string
  paymentId?: string
  customer: { firstName: string; lastName: string; email: string; phone: string }
  fulfillment: Fulfillment
  address?: { line1: string; line2: string; city: string; state: string; zip: string }
  items: { id: string; name: string; price: number }[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

type KV = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  keys: () => Promise<string[]>
  del: (key: string) => Promise<void>
}

// Demo mode and `npm run dev` keep everything in memory, so test orders never touch the live site's records
// (Redis is only connected on Vercel).
const memory = new Map<string, Map<string, unknown>>()
function memoryStore(name: string): KV {
  const m = memory.get(name) ?? memory.set(name, new Map()).get(name)!
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => void m.set(k, v),
    keys: async () => [...m.keys()],
    del: async (k) => void m.delete(k),
  }
}

// Upstash Redis, connected in Vercel > Storage. Each store is one Redis hash (fa:orders, fa:sold, fa:items, fa:photos).
let redis: Redis | undefined
function redisStore(name: string): KV {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('No Redis connected: add Upstash Redis in Vercel > Storage')
  const r = (redis ??= new Redis({ url, token }))
  const key = `fa:${name}`
  return {
    get: (k) => r.hget(key, k),
    set: async (k, v) => void (await r.hset(key, { [k]: v })),
    keys: () => r.hkeys(key),
    del: async (k) => void (await r.hdel(key, k)),
  }
}

const store = (name: string) => (demoMode() || process.env.FA_LOCAL_DEV ? memoryStore(name) : redisStore(name))

export const orders = {
  get: (sessionId: string) => store('orders').get(sessionId) as Promise<Order | null>,
  save: (o: Order) => store('orders').set(o.sessionId, o),
}

export const sold = {
  ids: () => store('sold').keys(),
  mark: async (ids: string[], ref: string) => {
    await Promise.all(ids.map((id) => store('sold').set(id, { ref, at: new Date().toISOString() })))
    invalidateCatalog()
  },
}

/** Items added on /admin, when Clover inventory isn't connected (with Clover, new items go into Clover instead). */
export const items = {
  all: async () => {
    const s = store('items')
    const list = await Promise.all((await s.keys()).map((k) => s.get(k) as Promise<{ product: Product; addedAt: string } | null>))
    return list
      .filter((r) => !!r)
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .map((r) => r.product)
  },
  save: async (p: Product) => {
    await store('items').set(p.id, { product: p, addedAt: new Date().toISOString() })
    invalidateCatalog()
  },
  remove: async (id: string) => {
    await store('items').del(id)
    invalidateCatalog()
  },
}

/** Product photo URLs by product id. Clover items have no photo field, so photos live here for both sources. */
export const photos = {
  get: (id: string) => store('photos').get(id) as Promise<string | null>,
  all: async () => {
    const s = store('photos')
    const ids = await s.keys()
    const urls = await Promise.all(ids.map((id) => s.get(id) as Promise<string | null>))
    return new Map(ids.map((id, i) => [id, urls[i]]).filter((e): e is [string, string] => !!e[1]))
  },
  set: async (id: string, url: string) => {
    await store('photos').set(id, url)
    invalidateCatalog()
  },
  remove: async (id: string) => {
    await store('photos').del(id)
    invalidateCatalog()
  },
}

/** Where /admin saves items: 'memory' means they vanish when the server restarts (local dev and demo mode). */
export const storageKind = () => (demoMode() || process.env.FA_LOCAL_DEV ? 'memory' : 'redis')
