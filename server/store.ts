import { Redis } from '@upstash/redis'
import { demoMode } from './config.js'
import { invalidateCatalog } from './catalog.js'
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
  }
}

// Upstash Redis, connected in Vercel > Storage. Each store is one Redis hash (fa:orders, fa:sold).
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
