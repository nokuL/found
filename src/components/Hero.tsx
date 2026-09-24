import { ShieldCheck, Truck, Recycle } from 'lucide-react'
import { useCart } from '../cart-context'
import AddToCart from './AddToCart'
import { ICONS, TILE } from './tiles'

/** Hero pick: the first product that hasn't sold (Clover's item order, or FEATURED's order). */
function Spotlight() {
  const { products, sold, status } = useCart()
  const p = products.find((x) => !sold.has(x.id))
  if (!p) return status === 'loading' ? <div className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-mist" /> : null
  const Icon = ICONS[p.category]
  const off = p.retail ? Math.round((1 - p.price / p.retail) * 100) : 0
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-28px_rgba(16,40,28,.45)] ring-1 ring-sage">
      <div className={`relative grid aspect-[16/10] place-items-center ${TILE[p.category]}`}>
        <Icon className="h-28 w-28 opacity-80" strokeWidth={1} />
        <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-forest">Pick of the week</span>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">{p.name}</h2>
        <p className="mt-1 text-ink-soft">{[p.grade, p.note].filter(Boolean).join(' · ')}</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <p>
            <span className="font-display text-4xl font-bold">${p.price.toLocaleString()}</span>
            {p.retail && <span className="ml-2 text-ink-soft line-through">${p.retail.toLocaleString()}</span>}
            {off > 0 && <span className="ml-2 font-semibold text-forest">{off}% off</span>}
          </p>
          <AddToCart id={p.id} className="px-6 py-3 text-base" />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Signature ribbons, taken from the logo mark */}
      <svg className="ribbon pointer-events-none absolute -right-40 -top-24 h-[140%] w-auto opacity-90 max-lg:hidden" viewBox="0 0 600 900" fill="none" aria-hidden="true">
        <path d="M340 -40c120 110 140 260 170 400s80 260 160 330" stroke="#00B050" strokeWidth="90" strokeLinecap="round" opacity=".16" />
        <path d="M180 60c120 110 140 260 170 400s80 260 160 330" stroke="#008A3E" strokeWidth="90" strokeLinecap="round" opacity=".14" />
      </svg>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <h1 className="font-display text-[clamp(2.9rem,7.2vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-ink">
            Good things,<br /><span className="whitespace-nowrap">found again.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Refurbished furniture, electronics, and commercial equipment at 40–70% off retail. Every piece is
            inspected, restored, cleaned, and shipped to your door across the US.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#shop" className="rounded-full bg-forest px-7 py-3.5 font-semibold text-white hover:bg-ink">
              Shop the collection
            </a>
            <a href="#warranty" className="rounded-full border-2 border-forest px-7 py-3 font-semibold text-forest hover:bg-forest hover:text-white">
              Our 30-day warranty
            </a>
          </div>
          <ul className="mt-10 grid max-w-xl gap-4 text-sm text-ink-soft sm:grid-cols-3">
            <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-forest" />30-day warranty</li>
            <li className="flex items-center gap-2"><Truck className="h-5 w-5 shrink-0 text-forest" />Insured delivery</li>
            <li className="flex items-center gap-2"><Recycle className="h-5 w-5 shrink-0 text-forest" />Kept out of landfills</li>
          </ul>
        </div>
        <Spotlight />
      </div>
    </section>
  )
}
