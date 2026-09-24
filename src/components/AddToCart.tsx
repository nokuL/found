import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '../cart-context'

export default function AddToCart({ id, className = '' }: { id: string; className?: string }) {
  const cart = useCart()
  const base = `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${className}`

  if (cart.sold.has(id)) {
    return <button disabled className={`${base} cursor-not-allowed bg-sage text-ink-soft`}>Sold</button>
  }
  if (cart.ids.includes(id)) {
    return (
      <button onClick={() => cart.setOpen(true)} className={`${base} border-2 border-forest text-forest hover:bg-mist`}>
        <Check className="h-4 w-4" />In cart
      </button>
    )
  }
  return (
    <button onClick={() => { cart.add(id); cart.setOpen(true) }} className={`${base} bg-ink text-white hover:bg-forest`}>
      <ShoppingBag className="h-4 w-4" />Add to cart
    </button>
  )
}
