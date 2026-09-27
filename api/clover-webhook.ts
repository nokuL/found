import { createHmac, timingSafeEqual } from 'node:crypto'
import { money } from '../src/pricing.js'
import { takeFromStock } from '../server/catalog.js'
import { cloverConfig, inventoryConfig, json } from '../server/config.js'
import { emailShop } from '../server/email.js'
import { orders, sold, type Order } from '../server/store.js'

/** Clover-Signature: "t=<unix>,v1=<hex HMAC-SHA256 of `${t}.${rawBody}`>" */
function verify(raw: string, header: string | null, secret: string) {
  const parts = Object.fromEntries((header ?? '').split(',').map((kv) => kv.split('=', 2) as [string, string]))
  if (!parts.t || !parts.v1) return false
  const expected = createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest()
  const given = Buffer.from(parts.v1, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Emails the paid order to the shop, with anything that needs doing by hand at the top. */
async function notify(o: Order, stockFailed: string[]) {
  const lines = [
    `Order ${o.ref}: ${money(o.total)}`,
    `Fulfillment: ${o.fulfillment === 'ship' ? 'Ship' : 'Pickup in Apex'}`,
    `Name: ${o.customer.firstName} ${o.customer.lastName}`,
    `Email: ${o.customer.email}`,
    `Phone: ${o.customer.phone}`,
    `Address: ${o.address ? `${o.address.line1} ${o.address.line2}, ${o.address.city}, ${o.address.state} ${o.address.zip}` : 'Pickup'}`,
    '',
    'Items:',
    ...o.items.map((i) => `- ${i.name} (${money(i.price)})`),
  ]
  if (stockFailed.length) {
    const names = o.items.filter((i) => stockFailed.includes(i.id)).map((i) => i.name)
    lines.unshift(`ACTION NEEDED: set stock to 0 in Clover for: ${names.join(', ')}`, '')
  }
  await emailShop({ subject: `New order ${o.ref} (${money(o.total)})`, text: lines.join('\n'), replyTo: o.customer.email })
}

export async function POST(req: Request) {
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
