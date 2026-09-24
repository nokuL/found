import { useEffect, useRef } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { useCart } from '../cart-context'
import { money, quote } from '../pricing'
import { navigate } from '../router'
import { Thumb } from './ProductTile'

export default function CartDrawer() {
  const cart = useCart()
  const { open, setOpen } = cart
  const closeRef = useRef<HTMLButtonElement>(null)
  const { items, subtotal } = quote(cart.ids, 'pickup', cart.products)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  if (!cart.open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={() => cart.setOpen(false)} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-sage px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl font-bold">Your cart</h2>
          <button ref={closeRef} onClick={() => cart.setOpen(false)} className="rounded-lg p-2 hover:bg-sage" aria-label="Close cart">
            <X />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-forest/50" strokeWidth={1.4} />
            <p className="text-lg text-ink-soft">Your cart is empty.</p>
            <a href="/#shop" onClick={() => cart.setOpen(false)} className="rounded-full bg-forest px-6 py-3 font-semibold text-white hover:bg-ink">
              Browse the shop
            </a>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-sage overflow-y-auto px-5">
              {items.map((p) => (
                <li key={p.id} className="flex gap-4 py-4">
                  <Thumb category={p.category} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{p.name}</p>
                    <p className="text-sm text-ink-soft">{p.grade ? `${p.grade} · ` : ''}one of a kind</p>
                    <button onClick={() => cart.remove(p.id)} className="mt-1 text-sm font-medium text-forest underline underline-offset-4">
                      Remove
                    </button>
                  </div>
                  <p className="font-semibold tabular-nums">${p.price.toLocaleString()}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-sage px-5 py-5">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Subtotal</span>
                <span className="font-display font-bold tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">Shipping or free pickup, and tax, are added at checkout.</p>
              <button
                onClick={() => { cart.setOpen(false); navigate('/checkout') }}
                className="mt-4 w-full rounded-full bg-leaf py-3.5 font-semibold text-white hover:bg-forest"
              >
                Checkout
              </button>
              <button onClick={() => cart.setOpen(false)} className="mt-2 w-full py-2 font-semibold text-forest">
                Keep shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
