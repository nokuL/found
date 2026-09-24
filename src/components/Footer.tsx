import { POLICY_LINKS } from '../data'
import { Logo } from './Logo'

export default function Footer() {
  return (
    <footer className="bg-paper py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-ink-soft">Every object has a story that deserves a sequel.</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-medium text-ink-soft" aria-label="Footer">
          <a href="/#shop" className="hover:text-forest">Shop</a>
          <a href="/#warranty" className="hover:text-forest">Warranty</a>
          <a href="/#faq" className="hover:text-forest">FAQ</a>
          <a href="/#contact" className="hover:text-forest">Contact</a>
        </nav>
        <p className="text-sm text-ink-soft">© {new Date().getFullYear()} Found Again LLC · Apex, NC</p>
      </div>
      <nav className="mx-auto mt-8 flex max-w-7xl flex-wrap gap-x-6 gap-y-2 border-t border-sage px-5 pt-6 text-sm text-ink-soft" aria-label="Policies">
        {POLICY_LINKS.map((l) => <a key={l.href} href={l.href} className="hover:text-forest">{l.label}</a>)}
      </nav>
    </footer>
  )
}
