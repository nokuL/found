import { ChevronDown } from 'lucide-react'
import { POLICY } from '../data'

const QA = [
  ['Where do you deliver?', 'We ship anywhere in the continental US through insured carriers. Large furniture goes by white-glove freight.'],
  ['What does the warranty cover?', 'Structural failures, loose joints, and functional breakdowns on furniture and non-powered equipment within 30 days of delivery. We repair, replace, or refund. Normal wear and tear and misuse are not covered.'],
  ['How do I pay?', 'Add items to your cart and check out. Payment is handled on the secure checkout page of Clover, our payment provider, so your card details never touch our site.'],
  ['Can I return something?', `Yes. Most items can be returned within ${POLICY.returnDays} days of delivery or pickup, in the condition you received them. See Returns & refunds at the bottom of the page for the details.`],
  ['Can I pick up my order instead?', 'Yes. Choose pickup in Apex, NC at checkout and it is free. We email you within one business day to arrange a time.'],
  ['Are used devices wiped?', 'Every phone, laptop, tablet, and server is wiped with a certified process before testing, so it reaches you clean.'],
  ['Is the African art authentic?', 'Each piece is handpicked and vetted. Listings include the material, origin, and dimensions so you know exactly what you are getting.'],
]

export default function Faq() {
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Questions people ask</h2>
        <div className="mt-10 divide-y divide-sage border-y border-sage">
          {QA.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="h-5 w-5 shrink-0 text-forest transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
