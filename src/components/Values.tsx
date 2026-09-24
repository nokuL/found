const COLS = [
  { who: 'Premium for less', title: 'Brands you know, 40–70% off', text: 'Pay well below US retail on pieces that have been tested, restored, and backed by our warranty.' },
  { who: 'No surprises', title: 'Honest condition grades', text: 'Every listing shows its grade, what we fixed, and the retail price it replaces, so you know exactly what arrives.' },
  { who: 'For the planet', title: 'Less waste, less new', text: 'Longer product lives keep e-waste and bulky furniture out of landfills and reduce demand for new manufacturing.' },
]

export default function Values() {
  return (
    <section className="border-y border-sage bg-mist py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3">
        {COLS.map((c) => (
          <div key={c.who}>
            <p className="font-semibold text-forest">{c.who}</p>
            <h3 className="mt-2 font-display text-2xl font-bold">{c.title}</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
