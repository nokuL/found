import { useState } from 'react'
import { useCart } from '../cart-context'
import { CATEGORIES, type CategoryKey, type Grade } from '../data'
import AddToCart from './AddToCart'
import { ICONS, TILE } from './tiles'
const GRADE_DOTS: Record<Grade, number> = { 'Like new': 3, Excellent: 2, Good: 1 }

export default function Shop() {
  const [filter, setFilter] = useState<CategoryKey | 'all'>('all')
  const { products, status } = useCart()
  const items = products.filter((p) => filter === 'all' || p.category === filter)

  return (
    <section id="shop" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Four collections, one standard</h2>
            <p className="mt-3 text-lg text-ink-soft">
              Every listing shows real photos, exact dimensions, and an honest condition grade.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.key]
            const active = filter === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(active ? 'all' : c.key)}
                aria-pressed={active}
                className={`group flex flex-col rounded-3xl p-6 text-left transition-shadow ${TILE[c.key]} ${
                  active ? 'ring-[3px] ring-ink' : 'ring-0 hover:ring-2 hover:ring-ink/20'
                }`}
              >
                <Icon className="h-9 w-9" strokeWidth={1.6} />
                <h3 className="mt-8 font-display text-2xl font-bold text-ink">{c.name}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{c.blurb}</p>
                <p className="mt-4 text-sm text-ink/70">{c.items.join(', ')}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">
            {filter === 'all' ? 'Just restored' : `Just restored in ${CATEGORIES.find((c) => c.key === filter)!.name.toLowerCase()}`}
          </h3>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="font-semibold text-forest underline underline-offset-4">
              Show all
            </button>
          )}
        </div>

        {status === 'loading' && (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading products">
            {[0, 1, 2].map((i) => <li key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-mist" />)}
          </ul>
        )}
        {status === 'error' && (
          <p className="mt-6 rounded-2xl bg-mist p-6 text-lg text-ink-soft" role="alert">
            We couldn't load the shop just now. Please refresh the page, or call us.
          </p>
        )}
        {status === 'ready' && !items.length && (
          <p className="mt-6 rounded-2xl bg-mist p-6 text-lg text-ink-soft">New pieces are on the way. Check back soon.</p>
        )}

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const Icon = ICONS[p.category]
            const off = p.retail ? Math.round((1 - p.price / p.retail) * 100) : 0
            return (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-sage bg-paper">
                {/* Swap this tile for a product photo: <img src="..." alt={p.name} className="aspect-[4/3] w-full object-cover" /> */}
                <div className={`relative grid aspect-[4/3] place-items-center ${TILE[p.category]}`}>
                  <Icon className="h-20 w-20 opacity-80" strokeWidth={1.1} />
                  {off > 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-forest">
                      {off}% below retail
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h4 className="text-lg font-semibold leading-snug">{p.name}</h4>
                  <p className="mt-1 text-sm text-ink-soft">{p.note}</p>
                  {p.grade && (
                    <div className="mt-3 flex items-center gap-2 text-sm" title="Condition grade">
                      <span className="flex gap-1" aria-hidden="true">
                        {[1, 2, 3].map((i) => (
                          <span key={i} className={`h-2 w-5 rounded-full ${i <= GRADE_DOTS[p.grade!] ? 'bg-leaf' : 'bg-sage'}`} />
                        ))}
                      </span>
                      <span className="font-medium">{p.grade}</span>
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-5">
                    <p>
                      <span className="font-display text-2xl font-bold">${p.price.toLocaleString()}</span>
                      {p.retail && <span className="ml-2 text-sm text-ink-soft line-through">${p.retail.toLocaleString()}</span>}
                    </p>
                    <AddToCart id={p.id} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
