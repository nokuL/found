export const CART_KEY = 'fa:cart'
const LAST_ORDER = 'fa:lastOrder'

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or storage blocked: the cart still works for this visit.
  }
}

export type LastOrder = {
  ref: string
  demo: boolean
  fulfillment: 'ship' | 'pickup'
  email: string
  items: { name: string; price: number }[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}
export const saveLastOrder = (o: LastOrder) => write(LAST_ORDER, o)
export const readLastOrder = () => read<LastOrder | null>(LAST_ORDER, null)
