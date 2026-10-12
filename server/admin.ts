import { createHmac, timingSafeEqual } from 'node:crypto'
import { del, put } from '@vercel/blob'
import { json } from './config.js'
import { photos, storageKind } from './store.js'

/** The /admin login, from ADMIN_USERNAME and ADMIN_PASSWORD. Without both, /admin is switched off. */
export function adminConfig() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) return null
  return { username, password }
}

const COOKIE = 'fa_admin'
const SESSION_DAYS = 14

// The session cookie is "<expiry>.<HMAC of the expiry>", keyed with the password: changing ADMIN_PASSWORD signs everyone out.
const sign = (exp: string, password: string) => createHmac('sha256', password).update(`fa-admin:${exp}`).digest('hex')

function same(a: string, b: string) {
  const x = createHmac('sha256', 'compare').update(a).digest()
  const y = createHmac('sha256', 'compare').update(b).digest()
  return timingSafeEqual(x, y)
}

/** Checks a login. Wrong guesses wait a second before answering, to slow down password guessing. */
export async function checkLogin(username: string, password: string) {
  const cfg = adminConfig()
  const ok = !!cfg && same(username, cfg.username) && same(password, cfg.password)
  if (!ok) await new Promise((r) => setTimeout(r, 1000))
  return ok
}

function cookie(value: string, maxAge: number) {
  const secure = process.env.FA_LOCAL_DEV ? '' : '; Secure'
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

export function sessionCookie() {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000)
  return cookie(`${exp}.${sign(exp, adminConfig()!.password)}`, SESSION_DAYS * 86_400)
}

export const logoutCookie = () => cookie('', 0)

/** Returns an error response unless the request carries a valid session cookie. */
export function requireAdmin(req: Request): Response | null {
  const cfg = adminConfig()
  if (!cfg) return json({ error: 'Admin login is not set up. Add ADMIN_USERNAME and ADMIN_PASSWORD in Vercel.' }, 503)
  const value = /(?:^|;\s*)fa_admin=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1] ?? ''
  const [exp, mac] = value.split('.')
  if (!exp || !mac || Number(exp) < Date.now() || !same(mac, sign(exp, cfg.password))) return json({ error: 'Please log in.' }, 401)
  return null
}

/** Photos go to Vercel Blob. Locally (no blob token, in-memory store) they are kept inline so uploads can be tried out. */
export const photosEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN || storageKind() === 'memory'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_PHOTO = 3_000_000 // bytes; the browser shrinks photos to well under this before sending

/** Saves a photo sent as a data URL ("data:image/jpeg;base64,...") for a product, replacing any earlier one. */
export async function savePhoto(id: string, dataUrl: string) {
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  const ext = m && TYPES[m[1]]
  if (!m || !ext) throw new PhotoError('Please use a JPEG, PNG, or WebP photo.')
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > MAX_PHOTO) throw new PhotoError('That photo is too large. Please use one under 3 MB.')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (storageKind() !== 'memory') throw new PhotoError('Photo storage is not set up. Connect Vercel Blob in Vercel > Storage.')
    await photos.set(id, dataUrl)
    return
  }
  const old = await photos.get(id)
  const blob = await put(`products/${id}.${ext}`, bytes, { access: 'public', contentType: m[1], addRandomSuffix: true })
  await photos.set(id, blob.url)
  if (old?.startsWith('https://')) await del(old).catch((err) => console.error('Old photo not deleted', old, err))
}

export async function removePhoto(id: string) {
  const old = await photos.get(id)
  await photos.remove(id)
  if (old?.startsWith('https://') && process.env.BLOB_READ_WRITE_TOKEN) await del(old).catch((err) => console.error('Photo not deleted', old, err))
}

/** A problem with the photo itself, shown to the uploader as is. */
export class PhotoError extends Error {}
