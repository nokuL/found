import { ScanSearch, Wrench, Droplets, HardDrive, Check } from 'lucide-react'

const REFURB = [
  { icon: ScanSearch, title: 'Diagnostics', text: 'Gadgets and equipment run a multi-point functionality checklist. Furniture is checked for structure and joint stability.' },
  { icon: Wrench, title: 'Restoration', text: 'Cosmetic detailing, structural reinforcement, fabric steaming, and replacement of worn components.' },
  { icon: Droplets, title: 'Sanitization', text: 'Deep cleaning and industrial-grade disinfection before anything is photographed or listed.' },
]

export default function Warranty() {
  return (
    <section id="warranty" className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <div className="inline-flex items-baseline gap-3 text-forest">
            <span className="font-display text-[clamp(5rem,12vw,9rem)] font-extrabold leading-none tracking-tighter">30</span>
            <span className="font-display text-2xl font-bold leading-tight">days of<br />cover</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">The Found Again warranty</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            If furniture or non-powered equipment has a structural failure, loose joints, or a functional breakdown
            within 30 days, we will repair it, replace it, or refund you. No cost to you.
          </p>
          <ul className="mt-6 space-y-3">
            {['Included on every eligible item, no add-on to buy', 'Repair, replacement, or full refund', 'Excludes normal wear and tear or misuse'].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-leaf" />{t}</li>
            ))}
          </ul>
          <div className="mt-8 flex gap-4 rounded-2xl bg-mist p-5">
            <HardDrive className="h-6 w-6 shrink-0 text-forest" />
            <p className="text-ink-soft">
              <strong className="text-ink">Your data is gone before it ships.</strong> Every phone, laptop, and server
              goes through certified data wiping alongside hardware diagnostics.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold">How every item is prepared</h3>
          <ol className="mt-6 space-y-4">
            {REFURB.map((r, i) => (
              <li key={r.title} className="flex gap-5 rounded-2xl border border-sage bg-white p-6">
                <div className="flex flex-col items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-forest font-display text-lg font-bold text-white">{i + 1}</span>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-semibold">
                    <r.icon className="h-5 w-5 text-leaf" aria-hidden="true" />{r.title}
                  </h4>
                  <p className="mt-1 leading-relaxed text-ink-soft">{r.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
