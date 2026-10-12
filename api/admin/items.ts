import { randomUUID } from 'node:crypto'
import { CATEGORIES, FEATURED, GRADES, type Product } from '../../src/data.js'
import { PhotoError, photosEnabled, removePhoto, requireAdmin, savePhoto } from '../../server/admin.js'
import { createCloverItem, getCatalog, hideCloverItem } from '../../server/catalog.js'
import { inventoryConfig, json, str } from '../../server/config.js'
import { items, storageKind } from '../../server/store.js'

/** The shop's items, for /admin. `storage` says where new items go: Clover, Redis, or memory (lost on restart). */
export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const catalog = await getCatalog({ fresh: true })
  const samples = catalog.source === 'local' && !(await items.all()).length
  return json({
    storage: inventoryConfig() ? 'clover' : storageKind(),
    photos: photosEnabled(),
    samples,
    products: catalog.products,
    soldIds: catalog.soldIds,
  })
}

async function readBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

const usd = (v: unknown) => {
  const n = Number(typeof v === 'string' ? v.replace(/[$,\s]/g, '') : v)
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n * 100) / 100 : undefined
}

/** Adds an item (and its photo, if one is sent). With Clover connected, the item is created in Clover. */
export async function POST(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const body = await readBody(req)
  if (!body) return json({ error: 'Invalid request' }, 400)

  const name = str(body.name, 120)
  const category = CATEGORIES.find((c) => c.key === body.category)?.key
  const price = usd(body.price)
  const retail = body.retail === '' || body.retail == null ? undefined : usd(body.retail)
  const grade = GRADES.find((g) => g === body.grade)
  const note = str(body.note, 160)
  const photo = typeof body.photo === 'string' && body.photo ? body.photo : undefined
  if (!name || !category || !price) return json({ error: 'Please fill in the name, category, and price.' }, 400)
  if (body.retail && !retail) return json({ error: 'Please check the retail price, or leave it empty.' }, 400)
  if (photo && !photosEnabled()) return json({ error: 'Photo storage is not set up. Connect Vercel Blob in Vercel > Storage.' }, 503)

  const product: Omit<Product, 'id'> = { name, category, price, retail, grade, note }
  let id: string
  try {
    if (inventoryConfig()) id = await createCloverItem(product)
    else await items.save({ id: (id = 'u-' + randomUUID().slice(0, 8)), ...product })
  } catch (err) {
    console.error(err)
    return json({ error: 'The item could not be saved. Please try again in a minute.' }, 502)
  }

  if (photo) {
    try {
      await savePhoto(id, photo)
    } catch (err) {
      console.error(err)
      const why = err instanceof PhotoError ? err.message : 'The photo could not be saved.'
      return json({ id, warning: `The item was added, but not its photo. ${why} Use "Change photo" to try again.` })
    }
  }
  return json({ id })
}

/** Replaces an item's photo: { id, photo } with photo as a data URL. */
export async function PATCH(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const body = await readBody(req)
  const id = str(body?.id, 80)
  if (!id || typeof body?.photo !== 'string') return json({ error: 'Invalid request' }, 400)
  if (!photosEnabled()) return json({ error: 'Photo storage is not set up. Connect Vercel Blob in Vercel > Storage.' }, 503)
  if (!(await getCatalog({ fresh: true })).products.some((p) => p.id === id)) return json({ error: 'That item is no longer listed.' }, 404)
  try {
    await savePhoto(id, body.photo)
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof PhotoError ? err.message : 'The photo could not be saved. Please try again.' }, err instanceof PhotoError ? 400 : 502)
  }
  return json({ ok: true })
}

/** Takes an item off the site: ?id=... Clover items are hidden in Clover (relist them there); others are deleted. */
export async function DELETE(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (FEATURED.some((p) => p.id === id)) return json({ error: 'Sample items disappear by themselves once you add your first item.' }, 400)
  try {
    if (inventoryConfig()) await hideCloverItem(id)
    else await items.remove(id)
    await removePhoto(id)
  } catch (err) {
    console.error(err)
    return json({ error: 'The item could not be removed. Please try again in a minute.' }, 502)
  }
  return json({ ok: true })
}
