import { getStore } from '@netlify/blobs'
import { demoMode } from './config'
import { invalidateCatalog } from './catalog'
import type { Fulfillment } from '../../src/pricing'

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
// (Netlify Blobs only exists on Netlify).
const memory = new Map<string, Map<string, unknown>>()
function memoryStore(name: string): KV {
  const m = memory.get(name) ?? memory.set(name, new Map()).get(name)!
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => void m.set(k, v),
    keys: async () => [...m.keys()],
  }
}

function blobStore(name: string): KV {
  const s = getStore({ name, consistency: 'strong' })
  return {
    get: (k) => s.get(k, { type: 'json' }),
    set: async (k, v) => void (await s.setJSON(k, v)),
    keys: async () => (await s.list()).blobs.map((b) => b.key),
  }
}

const store = (name: string) => (demoMode() || process.env.FA_LOCAL_DEV ? memoryStore(name) : blobStore(name))

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
