import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type Cart } from './cart-context'
import type { Product } from './data'
import { CART_KEY, read, write } from './storage'

export function CartProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => read(CART_KEY, []))
  const [sold, setSold] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<Cart['status']>('loading')

  useEffect(() => write(CART_KEY, ids), [ids])

  // Stable callbacks, so pages can list them as effect dependencies without re-running.
  const add = useCallback((id: string) => setIds((c) => (c.includes(id) ? c : [...c, id])), [])
  const remove = useCallback((id: string) => setIds((c) => c.filter((x) => x !== id)), [])
  const clear = useCallback(() => setIds([]), [])
  const markSold = useCallback((soldIds: string[]) => {
    if (!soldIds.length) return
    setSold((s) => new Set([...s, ...soldIds]))
    setIds((c) => c.filter((id) => !soldIds.includes(id)))
  }, [])

  useEffect(() => {
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { products: Product[]; soldIds: string[] }) => {
        setProducts(d.products)
        // Drop saved cart items that are no longer listed.
        setIds((c) => c.filter((id) => d.products.some((p) => p.id === id)))
        markSold(d.soldIds)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [markSold])

  const value = useMemo<Cart>(
    () => ({ products, status, ids, sold, add, remove, clear, markSold, open, setOpen }),
    [products, status, ids, sold, add, remove, clear, markSold, open],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
