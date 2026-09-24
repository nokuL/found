import { ShoppingBag, Lock, Truck, ShieldCheck } from 'lucide-react'

const STEPS = [
  { icon: ShoppingBag, title: 'Add it to your cart', text: 'Every listing is one of a kind, with an honest condition grade and a note on what we restored.' },
  { icon: Lock, title: 'Pay securely', text: 'Checkout runs on Clover, our payment provider. Your card details never touch our site.' },
  { icon: Truck, title: 'Delivered or picked up', text: 'Insured shipping across the continental US, or free pickup from us in Apex, NC.' },
  { icon: ShieldCheck, title: '30 days of cover', text: 'If something fails within 30 days, we repair it, replace it, or refund you.' },
]

export default function Process() {
  return (
    <section className="bg-ink py-20 text-white lg:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          From our workshop to your door in four steps.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative border-t-2 border-leaf/60 pt-6">
              <span className="font-display text-5xl font-extrabold text-leaf">{i + 1}</span>
              <s.icon className="absolute right-0 top-8 h-7 w-7 text-white/40" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
