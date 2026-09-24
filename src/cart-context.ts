import { createContext, useContext } from 'react'
import type { Product } from './data'

export type Cart = {
  /** The shop's products, loaded from /api/products (Clover inventory, or the fallback list). */
  products: Product[]
  status: 'loading' | 'ready' | 'error'
  /** Product ids. Every item is one of a kind, so there are no quantities. */
  ids: string[]
  /** Ids the server reports as already sold. */
  sold: Set<string>
  add: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  markSold: (ids: string[]) => void
  open: boolean
  setOpen: (open: boolean) => void
}

export const CartContext = createContext<Cart | null>(null)

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used inside <CartProvider>')
  return cart
}
