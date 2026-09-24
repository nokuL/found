import { useState, type FormEvent } from 'react'
import { ArrowLeft, Lock, Store, Truck } from 'lucide-react'
import { useCart } from '../cart-context'
import { saveLastOrder } from '../storage'
import { SHOP } from '../data'
import { money, quote, type Fulfillment } from '../pricing'
import { navigate } from '../router'
import { Thumb } from './ProductTile'

const STATES = 'AL AZ AR CA CO CT DE DC FL GA ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ')

export default function Checkout() {
  const cart = useCart()
  const [fulfillment, setFulfillment] = useState<Fulfillment>('ship')
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')
  const q = quote(cart.ids, fulfillment, cart.products)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: q.items.map((p) => p.id),
          fulfillment,
          customer: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
          address: fulfillment === 'ship' ? { line1: f.line1, line2: f.line2, city: f.city, state: f.state, zip: f.zip } : undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { href?: string; ref?: string; demo?: boolean; error?: string; soldIds?: string[] }
      if (data.soldIds) cart.markSold(data.soldIds)
      if (!res.ok || !data.href || !data.ref) throw new Error(data.error || 'Something went wrong. Please try again, or call us.')

      saveLastOrder({
        ref: data.ref,
        demo: !!data.demo,
        fulfillment,
        email: f.email,
        items: q.items.map((p) => ({ name: p.name, price: p.price * 100 })),
        subtotal: q.subtotal,
        shipping: q.shipping,
        tax: q.tax,
        total: q.total,
      })
      if (data.href.startsWith('/')) navigate(data.href)
      else location.assign(data.href) // Clover's secure payment page
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('idle')
    }
  }

  if (cart.status === 'loading') {
    return <section className="mx-auto max-w-xl px-5 py-24 text-center text-lg text-ink-soft" role="status">Loading your cart…</section>
  }

  if (!q.items.length) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-lg text-ink-soft">Add something from the shop to check out.</p>
        <a href="/#shop" className="mt-8 inline-block rounded-full bg-forest px-7 py-3.5 font-semibold text-white hover:bg-ink">Browse the shop</a>
      </section>
    )
  }

  const option = (value: Fulfillment, Icon: typeof Truck, title: string, detail: string, price: string) => (
    <label className={`flex cursor-pointer gap-4 rounded-2xl border-[1.5px] p-4 ${fulfillment === value ? 'border-forest bg-mist' : 'border-sage bg-white hover:border-leaf'}`}>
      <input type="radio" name="fulfillment" value={value} checked={fulfillment === value} onChange={() => setFulfillment(value)} className="mt-1 accent-forest" />
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-soft">{detail}</span>
      </span>
      <span className="font-semibold">{price}</span>
    </label>
  )

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 lg:py-16">
      <a href="/#shop" className="inline-flex items-center gap-2 font-semibold text-forest"><ArrowLeft className="h-4 w-4" />Keep shopping</a>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Checkout</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="space-y-10">
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-4 font-display text-2xl font-bold">Contact</legend>
            <div><label className="label" htmlFor="k-first">First name</label><input id="k-first" name="firstName" required className="field" autoComplete="given-name" /></div>
            <div><label className="label" htmlFor="k-last">Last name</label><input id="k-last" name="lastName" required className="field" autoComplete="family-name" /></div>
            <div><label className="label" htmlFor="k-email">Email</label><input id="k-email" name="email" type="email" required className="field" autoComplete="email" /></div>
            <div><label className="label" htmlFor="k-phone">Phone</label><input id="k-phone" name="phone" type="tel" required minLength={10} className="field" autoComplete="tel" /></div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 font-display text-2xl font-bold">Delivery</legend>
            <div className="grid gap-3">
              {option('ship', Truck, 'Ship to me', 'Insured delivery anywhere in the continental US', money(SHOP.shippingFlat * 100))}
              {option('pickup', Store, SHOP.pickupLabel, 'We email you to arrange a pickup time', 'Free')}
            </div>
          </fieldset>

          {fulfillment === 'ship' && (
            <fieldset className="grid gap-5 sm:grid-cols-6">
              <legend className="mb-4 font-display text-2xl font-bold">Shipping address</legend>
              <div className="sm:col-span-6"><label className="label" htmlFor="k-line1">Street address</label><input id="k-line1" name="line1" required className="field" autoComplete="address-line1" /></div>
              <div className="sm:col-span-6"><label className="label" htmlFor="k-line2">Apartment, suite (optional)</label><input id="k-line2" name="line2" className="field" autoComplete="address-line2" /></div>
              <div className="sm:col-span-3"><label className="label" htmlFor="k-city">City</label><input id="k-city" name="city" required className="field" autoComplete="address-level2" /></div>
              <div className="sm:col-span-1">
                <label className="label" htmlFor="k-state">State</label>
                <select id="k-state" name="state" required className="field" defaultValue="NC" autoComplete="address-level1">
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label" htmlFor="k-zip">ZIP code</label><input id="k-zip" name="zip" required inputMode="numeric" pattern="[0-9]{5}" title="5-digit US ZIP code" className="field" autoComplete="postal-code" /></div>
            </fieldset>
          )}

          <div>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
            <button disabled={status === 'sending'} className="flex w-full items-center justify-center gap-2 rounded-full bg-leaf py-4 text-lg font-semibold text-white hover:bg-forest disabled:opacity-60">
              <Lock className="h-5 w-5" />
              {status === 'sending' ? 'Starting secure payment…' : `Pay ${money(q.total)}`}
            </button>
            <p className="mt-3 text-center text-sm text-ink-soft">
              You'll pay on Clover's secure checkout page. Your card details never touch our site.
            </p>
            <p className="mt-2 text-center text-sm text-ink-soft">
              By paying, you agree to our <a href="/terms" className="underline underline-offset-4 hover:text-forest">Terms of sale</a> and{' '}
              <a href="/returns" className="underline underline-offset-4 hover:text-forest">Returns policy</a>. See how we handle your details in our{' '}
              <a href="/privacy" className="underline underline-offset-4 hover:text-forest">Privacy policy</a>.
            </p>
          </div>
        </form>

        <aside className="h-fit rounded-3xl border border-sage bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl font-bold">Order summary</h2>
          <ul className="mt-5 divide-y divide-sage">
            {q.items.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <Thumb category={p.category} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{p.name}</p>
                  <button type="button" onClick={() => cart.remove(p.id)} className="text-sm font-medium text-forest underline underline-offset-4">Remove</button>
                </div>
                <p className="font-semibold tabular-nums">${p.price.toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-sage pt-4 tabular-nums">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{money(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">{fulfillment === 'ship' ? 'Shipping' : 'Pickup'}</dt><dd>{q.shipping ? money(q.shipping) : 'Free'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Tax ({(SHOP.taxRate * 100).toFixed(2)}%)</dt><dd>{money(q.tax)}</dd></div>
            <div className="flex justify-between border-t border-sage pt-3 text-lg font-semibold"><dt>Total</dt><dd className="font-display text-2xl font-bold">{money(q.total)}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-ink-soft">Every item includes our 30-day warranty.</p>
        </aside>
      </div>
    </section>
  )
}
