import { useState, type FormEvent } from 'react'
import { Phone, Mail, MapPin, CircleCheck } from 'lucide-react'
import { CONTACT } from '../data'

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    try {
      const body = new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>).toString()
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="bg-forest py-20 text-white lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Talk to a real person</h2>
          <p className="mt-4 max-w-md text-lg text-white/80">Questions about an item, an order, or a delivery. We answer every message.</p>
          <ul className="mt-10 space-y-5 text-lg">
            <li><a href={CONTACT.phoneHref} className="flex items-center gap-3 hover:underline"><Phone className="h-5 w-5" />{CONTACT.phone}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 hover:underline"><Mail className="h-5 w-5" />{CONTACT.email}</a></li>
            <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5" /><span>{CONTACT.address[0]}<br />{CONTACT.address[1]}</span></li>
          </ul>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col justify-center rounded-3xl bg-white p-10 text-ink" role="status">
            <CircleCheck className="h-12 w-12 text-leaf" />
            <h3 className="mt-4 font-display text-3xl font-bold">Message sent</h3>
            <p className="mt-2 text-lg text-ink-soft">We will reply by email within one business day.</p>
          </div>
        ) : (
          <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submit} className="grid gap-5 rounded-3xl bg-white p-6 text-ink sm:p-8">
            <input type="hidden" name="form-name" value="contact" />
            <p hidden><label>Leave this empty <input name="bot-field" /></label></p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" required className="field" autoComplete="name" /></div>
              <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required className="field" autoComplete="email" /></div>
            </div>
            <div>
              <label className="label" htmlFor="c-topic">Topic</label>
              <select id="c-topic" name="topic" className="field" defaultValue="General question">
                <option>An item in the shop</option><option>An existing order</option><option>Warranty claim</option><option>General question</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" name="message" rows={4} required className="field" />
            </div>
            {status === 'error' && <p className="text-red-700" role="alert">Your message did not go through. Try again, or call us.</p>}
            <button disabled={status === 'sending'} className="rounded-full bg-ink py-3.5 font-semibold text-white hover:bg-leaf disabled:opacity-60">
              {status === 'sending' ? 'Sending message…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
