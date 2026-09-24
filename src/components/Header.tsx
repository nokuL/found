import { useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../cart-context'
import { Logo } from './Logo'

const LINKS = [
  { href: '/#shop', label: 'Shop' },
  { href: '/#warranty', label: 'Warranty' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#contact', label: 'Contact' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const cart = useCart()
  const count = cart.ids.length
  const cartButton = (
    <button
      onClick={() => { setOpen(false); cart.setOpen(true) }}
      className="relative rounded-full p-2.5 text-ink hover:bg-sage"
      aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <ShoppingBag className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-xs font-bold text-white">{count}</span>
      )}
    </button>
  )
  return (
    <header className="sticky top-0 z-40 border-b border-sage bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-medium text-ink-soft hover:text-forest">
              {l.label}
            </a>
          ))}
          {cartButton}
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          {cartButton}
          <button
            className="rounded-lg p-2"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-sage px-5 pb-5 md:hidden" aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-lg font-medium">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
