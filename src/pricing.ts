import { SHOP, type Product } from './data'

export type Fulfillment = 'ship' | 'pickup'

export type Quote = {
  items: Product[]
  /** All amounts are in cents. */
  subtotal: number
  shipping: number
  tax: number
  total: number
}

const cents = (usd: number) => Math.round(usd * 100)
const taxOn = (amount: number) => Math.round(amount * SHOP.taxRate)

/** Shared by the cart UI and the checkout function. Ids not in `catalog` are dropped. */
export function quote(ids: string[], fulfillment: Fulfillment, catalog: Product[]): Quote {
  const items = [...new Set(ids)].map((id) => catalog.find((p) => p.id === id)).filter((p): p is Product => !!p)
  const subtotal = items.reduce((sum, p) => sum + cents(p.price), 0)
  const shipping = fulfillment === 'ship' && items.length ? cents(SHOP.shippingFlat) : 0
  // Tax per line, the same way Clover applies line-item tax rates. NC taxes delivery charges too.
  const tax = items.reduce((sum, p) => sum + taxOn(cents(p.price)), 0) + taxOn(shipping)
  return { items, subtotal, shipping, tax, total: subtotal + shipping + tax }
}

export const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
