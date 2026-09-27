import { randomUUID } from 'node:crypto'
import { SHOP } from '../src/data.js'
import { quote, type Fulfillment } from '../src/pricing.js'
import { getCatalog } from '../server/catalog.js'
import { cloverConfig, demoBlocked, json, str, USER_AGENT } from '../server/config.js'
import { orders, sold, type Order } from '../server/store.js'

// Continental US only (see the FAQ), so no AK or HI.
const STATES = new Set('AL AZ AR CA CO CT DE DC FL GA ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '))

type Body = {
  ids?: unknown
  fulfillment?: unknown
  customer?: Record<string, unknown>
  address?: Record<string, unknown>
}

export async function POST(req: Request) {
  if (demoBlocked()) return json({ error: 'Checkout is not set up yet. Please call us to place an order.' }, 503)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }

  const fulfillment: Fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'ship'
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : []
  // Fresh read, not the cached list: stock must be current at the moment of sale.
  let catalog
  try {
    catalog = await getCatalog({ fresh: true })
  } catch (err) {
    console.error(err)
    return json({ error: 'We could not check stock just now. Please try again in a minute, or call us.' }, 502)
  }
  const q = quote(ids, fulfillment, catalog.products)
  if (!q.items.length) return json({ error: 'Your cart is empty.' }, 400)

  const soldNow = new Set(catalog.soldIds)
  const gone = q.items.filter((p) => soldNow.has(p.id)).map((p) => p.id)
  if (gone.length) return json({ error: 'Some items in your cart have just sold.', soldIds: gone }, 409)

  const customer = {
    firstName: str(body.customer?.firstName, 60),
    lastName: str(body.customer?.lastName, 60),
    email: str(body.customer?.email, 120),
    phone: str(body.customer?.phone, 30).replace(/[^\d+]/g, ''),
  }
  if (!customer.firstName || !customer.lastName || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.length < 10) {
    return json({ error: 'Please check your name, email, and phone number.' }, 400)
  }

  let address: Order['address']
  if (fulfillment === 'ship') {
    address = {
      line1: str(body.address?.line1),
      line2: str(body.address?.line2),
      city: str(body.address?.city, 60),
      state: str(body.address?.state, 2).toUpperCase(),
      zip: str(body.address?.zip, 10),
    }
    if (!address.line1 || !address.city || !STATES.has(address.state) || !/^\d{5}(-\d{4})?$/.test(address.zip)) {
      return json({ error: 'Please check your shipping address. We ship within the continental US.' }, 400)
    }
    if (/\bp\.?\s*o\.?\s*box\b|\bpost\s+office\s+box\b/i.test(`${address.line1} ${address.line2}`)) {
      return json({ error: "We can't ship to PO boxes. Please use a street address, or choose pickup." }, 400)
    }
  }

  const ref = 'FA-' + randomUUID().slice(0, 8).toUpperCase()
  const order: Omit<Order, 'sessionId' | 'status' | 'demo'> = {
    ref,
    createdAt: new Date().toISOString(),
    customer,
    fulfillment,
    address,
    items: q.items.map((p) => ({ id: p.id, name: p.name, price: Math.round(p.price * 100) })),
    subtotal: q.subtotal,
    shipping: q.shipping,
    tax: q.tax,
    total: q.total,
  }

  const clover = cloverConfig()
  if (!clover) {
    // Demo mode: skip payment and confirm straight away.
    const sessionId = 'demo-' + randomUUID()
    await orders.save({ ...order, sessionId, status: 'paid', demo: true, paidAt: new Date().toISOString() })
    await sold.mark(q.items.map((p) => p.id), ref)
    return json({ ref, demo: true, href: `/order/success?ref=${ref}` })
  }

  // Clover tax rates are integers where 10,000,000 = 100%.
  const taxRates = [{ name: SHOP.taxName, rate: Math.round(SHOP.taxRate * 10_000_000) }]
  const lineItems: Record<string, unknown>[] = q.items.map((p) => ({
    name: p.name,
    price: Math.round(p.price * 100),
    unitQty: 1,
    note: `Ref ${ref} · item ${p.id}`,
    taxRates,
  }))
  if (address) {
    lineItems.push({
      name: 'Shipping (insured, flat rate)',
      price: q.shipping,
      unitQty: 1,
      note: `Ship to: ${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.zip}`,
      taxRates,
    })
  } else {
    lineItems.push({ name: SHOP.pickupLabel, price: 0, unitQty: 1, note: `Ref ${ref} · pickup, we will email a time` })
  }

  const res = await fetch(`${clover.apiBase}/invoicingcheckoutservice/v1/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clover.token}`,
      'X-Clover-Merchant-Id': clover.merchantId,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      ...(clover.pageConfigUuid && { pageConfigUuid: clover.pageConfigUuid }),
      customer: { firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phoneNumber: customer.phone },
      shoppingCart: { lineItems },
    }),
  })
  if (!res.ok) {
    console.error('Clover checkout failed', res.status, await res.text())
    return json({ error: 'We could not start the payment. Please try again in a minute, or call us.' }, 502)
  }
  const session = (await res.json()) as { href: string; checkoutSessionId: string }
  await orders.save({ ...order, sessionId: session.checkoutSessionId, status: 'pending', demo: false })
  return json({ ref, demo: false, href: session.href })
}
