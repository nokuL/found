import { createHmac, timingSafeEqual } from 'node:crypto'
import { money } from '../../src/pricing'
import { takeFromStock } from '../lib/catalog'
import { cloverConfig, inventoryConfig, json } from '../lib/config'
import { orders, sold, type Order } from '../lib/store'

/** Clover-Signature: "t=<unix>,v1=<hex HMAC-SHA256 of `${t}.${rawBody}`>" */
function verify(raw: string, header: string | null, secret: string) {
  const parts = Object.fromEntries((header ?? '').split(',').map((kv) => kv.split('=', 2) as [string, string]))
  if (!parts.t || !parts.v1) return false
  const expected = createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest()
  const given = Buffer.from(parts.v1, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Sends the paid order to the "order" Netlify Form, so it lands in your inbox like the contact form does. */
async function notify(o: Order, stockFailed: string[]) {
  const site = process.env.URL
  if (!site) return
  const fields: Record<string, string> = {
    'form-name': 'order',
    ref: o.ref,
    total: money(o.total),
    fulfillment: o.fulfillment === 'ship' ? 'Ship' : 'Pickup in Apex',
    name: `${o.customer.firstName} ${o.customer.lastName}`,
    email: o.customer.email,
    phone: o.customer.phone,
    address: o.address ? `${o.address.line1} ${o.address.line2}, ${o.address.city}, ${o.address.state} ${o.address.zip}` : 'Pickup',
    items: o.items.map((i) => `${i.name} (${money(i.price)})`).join('; '),
  }
  if (stockFailed.length) {
    const names = o.items.filter((i) => stockFailed.includes(i.id)).map((i) => i.name)
    fields.items += ` | ACTION NEEDED: set stock to 0 in Clover for: ${names.join(', ')}`
  }
  const res = await fetch(`${site}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  })
  if (!res.ok) console.error('Order notification failed', res.status)
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const clover = cloverConfig()
  if (!clover?.webhookSecret) return json({ error: 'Webhook not configured' }, 503)

  const raw = await req.text()
  if (!verify(raw, req.headers.get('clover-signature'), clover.webhookSecret)) return json({ error: 'Bad signature' }, 401)

  const event = JSON.parse(raw) as { type?: string; status?: string; id?: string; data?: string }
  if (event.type !== 'PAYMENT' || !event.data) return json({ ok: true })

  const order = await orders.get(event.data)
  if (!order) {
    console.warn('Webhook for unknown checkout session', event.data)
    return json({ ok: true })
  }
  if (order.status === 'paid') return json({ ok: true }) // Clover retried; already handled.

  if (event.status === 'APPROVED') {
    await orders.save({ ...order, status: 'paid', paidAt: new Date().toISOString(), paymentId: event.id })
    const ids = order.items.map((i) => i.id)
    // With Clover inventory connected, Clover's stock count is the record of what's sold.
    const stockFailed = inventoryConfig() ? await takeFromStock(ids) : (await sold.mark(ids, order.ref), [])
    await notify(order, stockFailed)
  } else if (event.status === 'DECLINED') {
    await orders.save({ ...order, status: 'declined', paymentId: event.id })
  }
  return json({ ok: true })
}

export const config = { path: '/api/clover-webhook' }
