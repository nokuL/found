import { useEffect, useState } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import { useCart } from '../cart-context'
import { readLastOrder } from '../storage'
import { CONTACT } from '../data'
import { money } from '../pricing'

/** Clover redirects here after payment. Set these URLs in the Clover dashboard's Hosted Checkout settings. */
export function OrderSuccess() {
  const { clear } = useCart()
  const [order] = useState(readLastOrder)

  useEffect(() => clear(), [clear])

  return (
    <section className="mx-auto max-w-2xl px-5 py-20">
      {order?.demo && (
        <p className="mb-8 rounded-xl bg-[#F1E1CF] p-4 font-medium text-ink" role="note">
          Demo mode: no payment was taken. Add your Clover keys to take real payments.
        </p>
      )}
      <CircleCheck className="h-14 w-14 text-leaf" />
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Thank you for your order</h1>
      {order ? (
        <>
          <p className="mt-3 text-lg text-ink-soft">
            Order <strong className="text-ink">{order.ref}</strong>. Keep this number for reference. We'll contact you at {order.email}.{' '}
            {order.fulfillment === 'pickup'
              ? 'We will email you within one business day to arrange your pickup time in Apex.'
              : 'We will email tracking details as soon as it ships.'}
          </p>
          <div className="mt-8 rounded-3xl border border-sage bg-white p-6">
            <ul className="divide-y divide-sage">
              {order.items.map((i) => (
                <li key={i.name} className="flex justify-between gap-4 py-2"><span>{i.name}</span><span className="tabular-nums">{money(i.price)}</span></li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-sage pt-3 tabular-nums">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">{order.fulfillment === 'ship' ? 'Shipping' : 'Pickup'}</dt><dd>{order.shipping ? money(order.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd>{money(order.tax)}</dd></div>
              <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </div>
        </>
      ) : (
        <p className="mt-3 text-lg text-ink-soft">Your payment went through. We'll be in touch by email about delivery or pickup.</p>
      )}
      <a href="/#shop" className="mt-10 inline-block rounded-full bg-forest px-7 py-3.5 font-semibold text-white hover:bg-ink">Back to the shop</a>
    </section>
  )
}

/** Clover's failure and cancel redirect. The cart is kept so the customer can try again. */
export function OrderCancelled() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-20">
      <CircleX className="h-14 w-14 text-ochre" />
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Payment not completed</h1>
      <p className="mt-3 text-lg text-ink-soft">
        You were not charged, and your cart is saved. You can try again, or call us on{' '}
        <a href={CONTACT.phoneHref} className="font-semibold text-forest underline underline-offset-4">{CONTACT.phone}</a>.
      </p>
      <a href="/checkout" className="mt-10 inline-block rounded-full bg-forest px-7 py-3.5 font-semibold text-white hover:bg-ink">Back to checkout</a>
    </section>
  )
}
