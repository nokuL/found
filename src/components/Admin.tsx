import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Camera, CircleCheck, LogOut, Trash2 } from 'lucide-react'
import { CATEGORIES, GRADES, type Product } from '../data'
import { Thumb } from './ProductTile'

type Inventory = {
  storage: 'clover' | 'redis' | 'memory'
  photos: boolean
  samples: boolean
  products: Product[]
  soldIds: string[]
}

/** Shrinks a photo in the browser to at most 1600px on its long side, as a JPEG data URL, so uploads stay small. */
async function shrink(file: File) {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data: data as Record<string, unknown> & { error?: string } }
}

/** Where the person who lists items logs in and adds them. Not linked from the site; go to /admin. */
export default function Admin() {
  const [state, setState] = useState<'loading' | 'login' | 'off' | 'ready'>('loading')
  const [inv, setInv] = useState<Inventory | null>(null)
  const [message, setMessage] = useState('')

  const apply = useCallback((r: Awaited<ReturnType<typeof call>>) => {
    if (r.status === 401) return setState('login')
    if (r.status === 503) {
      setMessage(r.data.error ?? '')
      return setState('off')
    }
    if (!r.ok) {
      setMessage('Could not load the items. Refresh the page to try again.')
      return setState('off')
    }
    setInv(r.data as unknown as Inventory)
    setState('ready')
  }, [])
  const load = useCallback(() => call('GET', '/api/admin/items').then(apply), [apply])

  useEffect(() => {
    document.title = 'Admin · Found Again'
    const robots = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex' })
    document.head.append(robots)
    call('GET', '/api/admin/items').then(apply)
    return () => robots.remove()
  }, [apply])

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 lg:py-16">
      {state === 'loading' && <p className="text-lg text-ink-soft">Loading…</p>}
      {state === 'off' && <p className="rounded-2xl bg-mist p-6 text-lg text-ink-soft" role="alert">{message}</p>}
      {state === 'login' && <Login onDone={load} />}
      {state === 'ready' && inv && <Dashboard inv={inv} reload={load} onLogout={() => setState('login')} />}
    </section>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const r = await call('POST', '/api/admin/login', Object.fromEntries(new FormData(e.currentTarget)))
    setBusy(false)
    if (r.ok) onDone()
    else setError(r.data.error ?? 'Could not log in. Please try again.')
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-sm gap-5 rounded-3xl border border-sage bg-white p-6 sm:p-8">
      <h1 className="font-display text-3xl font-bold">Log in to add items</h1>
      <div><label className="label" htmlFor="a-user">Username</label><input id="a-user" name="username" required className="field" autoComplete="username" /></div>
      <div><label className="label" htmlFor="a-pass">Password</label><input id="a-pass" name="password" type="password" required className="field" autoComplete="current-password" /></div>
      {error && <p className="text-red-700" role="alert">{error}</p>}
      <button disabled={busy} className="rounded-full bg-ink py-3.5 font-semibold text-white hover:bg-leaf disabled:opacity-60">
        {busy ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

function Dashboard({ inv, reload, onLogout }: { inv: Inventory; reload: () => Promise<void>; onLogout: () => void }) {
  const sold = new Set(inv.soldIds)

  async function logout() {
    await call('DELETE', '/api/admin/login')
    onLogout()
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-tight">Shop items</h1>
        <button onClick={logout} className="flex items-center gap-2 font-semibold text-forest underline-offset-4 hover:underline">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
      {inv.storage === 'clover' && (
        <p className="mt-3 text-ink-soft">New items are added to Clover, so they can also be sold in the store. Edit prices and details in the Clover dashboard.</p>
      )}
      {inv.storage === 'memory' && (
        <p className="mt-3 rounded-xl bg-[#F1E1CF] p-4 text-ink" role="note">
          Test mode: items added here are kept only until the server restarts.
        </p>
      )}

      <AddItem photos={inv.photos} onAdded={reload} />

      <h2 className="mt-14 font-display text-2xl font-bold">On the site now ({inv.products.length})</h2>
      {inv.samples && <p className="mt-2 text-ink-soft">These are sample items. They disappear once you add your first item.</p>}
      <ul className="mt-5 grid gap-3">
        {inv.products.map((p) => (
          <Row key={p.id} p={p} sold={sold.has(p.id)} sample={inv.samples} clover={inv.storage === 'clover'} photos={inv.photos} reload={reload} />
        ))}
      </ul>
    </>
  )
}

function AddItem({ photos, onAdded }: { photos: boolean; onAdded: () => Promise<void> }) {
  const [photo, setPhoto] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; text?: string }>({ kind: 'idle' })
  const form = useRef<HTMLFormElement>(null)

  async function pick(file?: File) {
    if (!file) return setPhoto('')
    try {
      setPhoto(await shrink(file))
    } catch {
      setStatus({ kind: 'error', text: 'That file could not be read as a photo. Try a JPEG or PNG.' })
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    const fields = Object.fromEntries([...new FormData(e.currentTarget)].filter(([k]) => k !== 'file'))
    const r = await call('POST', '/api/admin/items', { ...fields, photo })
    if (!r.ok) return setStatus({ kind: 'error', text: r.data.error ?? 'The item could not be saved. Please try again.' })
    form.current?.reset()
    setPhoto('')
    setStatus(r.data.warning ? { kind: 'error', text: String(r.data.warning) } : { kind: 'saved' })
    await onAdded()
  }

  return (
    <form ref={form} onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-sage bg-white p-6 sm:p-8 md:grid-cols-[14rem_1fr]">
      <div>
        <span className="label">Photo</span>
        {photos ? (
          <label className="grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[#C9D8CD] bg-mist text-ink-soft hover:border-forest md:aspect-square">
            {photo ? (
              <img src={photo} alt="Photo to upload" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm font-medium"><Camera className="h-8 w-8" />Add a photo</span>
            )}
            <input name="file" type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        ) : (
          <p className="rounded-2xl bg-mist p-4 text-sm text-ink-soft">Photos are off until Vercel Blob storage is connected.</p>
        )}
      </div>

      <div className="grid gap-5">
        <div><label className="label" htmlFor="i-name">Name</label><input id="i-name" name="name" required maxLength={120} className="field" placeholder='e.g. Herman Miller Aeron, size B' /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="i-cat">Category</label>
            <select id="i-cat" name="category" required className="field" defaultValue="">
              <option value="" disabled>Choose…</option>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="i-grade">Condition</label>
            <select id="i-grade" name="grade" className="field" defaultValue="">
              <option value="">No grade</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="i-price">Price (USD)</label><input id="i-price" name="price" required inputMode="decimal" pattern="\$?[\d,]+(\.\d{1,2})?" className="field" placeholder="649" /></div>
          <div><label className="label" htmlFor="i-retail">Original retail price (optional)</label><input id="i-retail" name="retail" inputMode="decimal" pattern="\$?[\d,]+(\.\d{1,2})?" className="field" placeholder="1795" /></div>
        </div>
        <div><label className="label" htmlFor="i-note">Short note (optional)</label><input id="i-note" name="note" maxLength={160} className="field" placeholder="New gas cylinder, mesh steamed" /></div>
        {status.kind === 'error' && <p className="text-red-700" role="alert">{status.text}</p>}
        {status.kind === 'saved' && <p className="flex items-center gap-2 font-medium text-forest" role="status"><CircleCheck className="h-5 w-5" />Added. It shows on the shop within a minute.</p>}
        <button disabled={status.kind === 'saving'} className="rounded-full bg-ink py-3.5 font-semibold text-white hover:bg-leaf disabled:opacity-60">
          {status.kind === 'saving' ? 'Adding item…' : 'Add item to shop'}
        </button>
      </div>
    </form>
  )
}

function Row({ p, sold, sample, clover, photos, reload }: { p: Product; sold: boolean; sample: boolean; clover: boolean; photos: boolean; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function changePhoto(file?: File) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const r = await call('PATCH', '/api/admin/items', { id: p.id, photo: await shrink(file) })
      if (!r.ok) setError(r.data.error ?? 'The photo could not be saved.')
      else await reload()
    } catch {
      setError('That file could not be read as a photo. Try a JPEG or PNG.')
    }
    setBusy(false)
  }

  async function remove() {
    const how = clover ? 'It will be hidden in Clover, where you can relist it.' : 'This cannot be undone.'
    if (!confirm(`Remove "${p.name}" from the site? ${how}`)) return
    setBusy(true)
    const r = await call('DELETE', `/api/admin/items?id=${encodeURIComponent(p.id)}`)
    if (!r.ok) setError(r.data.error ?? 'The item could not be removed.')
    else await reload()
    setBusy(false)
  }

  return (
    <li className={`flex flex-wrap items-center gap-4 rounded-2xl border border-sage bg-white p-3 ${busy ? 'opacity-60' : ''}`}>
      <Thumb category={p.category} photo={p.photo} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{p.name}</p>
        <p className="text-sm text-ink-soft">
          ${p.price.toLocaleString()} · {CATEGORIES.find((c) => c.key === p.category)!.name}
          {p.grade && ` · ${p.grade}`}
          {sold && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 font-semibold text-ink">Sold</span>}
        </p>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      </div>
      {!sample && (
        <div className="flex gap-2">
          {photos && (
            <label className={`flex items-center gap-1.5 rounded-full border border-sage px-3 py-2 text-sm font-semibold hover:border-forest ${busy ? 'pointer-events-none' : 'cursor-pointer'}`}>
              <Camera className="h-4 w-4" /> {p.photo ? 'Change photo' : 'Add photo'}
              <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => changePhoto(e.target.files?.[0])} />
            </label>
          )}
          <button onClick={remove} disabled={busy} className="flex items-center gap-1.5 rounded-full border border-sage px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-700">
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        </div>
      )}
    </li>
  )
}
