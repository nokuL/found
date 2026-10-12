import { CATEGORIES, FEATURED, GRADES, type CategoryKey, type Product } from '../src/data.js'
import { inventoryConfig, USER_AGENT } from './config.js'
import { items, photos, sold } from './store.js'

export type Catalog = { products: Product[]; soldIds: string[]; source: 'clover' | 'local' }

type Named = { elements?: { name?: string }[] }
type CloverItem = {
  id: string
  name: string
  price: number
  alternateName?: string
  categories?: Named
  tags?: Named
  itemStock?: { quantity?: number }
}

/** Clover category → site collection. Items in no matching category stay off the website (e.g. POS-only items). */
function categoryOf(item: CloverItem): CategoryKey | undefined {
  for (const { name = '' } of item.categories?.elements ?? []) {
    const key = categoryKey(name)
    if (key) return key
  }
}

const categoryKey = (name: string) => {
  const n = name.trim().toLowerCase()
  return CATEGORIES.find((c) => n === c.key || n === c.name.toLowerCase() || (c.key === 'art' && n.startsWith('art')))?.key
}

/** Clover tags carry the extras Clover items don't have: a grade tag ("Excellent") and a retail tag ("Retail 1795"). */
function fromTags(item: CloverItem) {
  const names = (item.tags?.elements ?? []).map((t) => (t.name ?? '').trim())
  const grade = GRADES.find((g) => names.some((n) => n.toLowerCase() === g.toLowerCase()))
  const retailTag = names.map((n) => /^retail\s*\$?\s*([\d,]+(?:\.\d+)?)$/i.exec(n)).find(Boolean)
  const retail = retailTag ? Number(retailTag[1].replace(/,/g, '')) : undefined
  return { grade, retail }
}

async function cloverItems(): Promise<CloverItem[]> {
  const inv = inventoryConfig()!
  const items: CloverItem[] = []
  for (let offset = 0; ; offset += 1000) {
    const url = `${inv.apiBase}/v3/merchants/${inv.merchantId}/items?filter=hidden%3Dfalse&expand=categories,tags,itemStock&limit=1000&offset=${offset}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${inv.token}`, Accept: 'application/json', 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`Clover inventory ${res.status}: ${await res.text()}`)
    const page = ((await res.json()) as { elements?: CloverItem[] }).elements ?? []
    items.push(...page)
    if (page.length < 1000) return items
  }
}

let cache: { at: number; data: Catalog } | null = null
const TTL = 60_000

/**
 * Products for the shop. From Clover when connected, otherwise the items added on /admin
 * (or the sample FEATURED list in src/data.ts until the first one is added).
 */
export async function getCatalog({ fresh = false } = {}): Promise<Catalog> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.data
  const [soldLocally, photoUrls] = await Promise.all([sold.ids(), photos.all()])

  let data: Catalog
  if (!inventoryConfig()) {
    const added = await items.all()
    data = { products: added.length ? added : FEATURED, soldIds: soldLocally, source: 'local' }
  } else {
    const products: Product[] = []
    const soldIds = new Set(soldLocally)
    for (const item of await cloverItems()) {
      const category = categoryOf(item)
      if (!category || !(item.price > 0)) continue
      const { grade, retail } = fromTags(item)
      products.push({ id: item.id, name: item.name, category, price: item.price / 100, retail, grade, note: item.alternateName ?? '' })
      // No stock record means stock isn't tracked for the item, so it counts as available.
      const qty = item.itemStock?.quantity
      if (qty !== undefined && qty <= 0) soldIds.add(item.id)
    }
    data = { products, soldIds: [...soldIds], source: 'clover' }
  }
  data.products = data.products.map((p) => (photoUrls.has(p.id) ? { ...p, photo: photoUrls.get(p.id) } : p))
  cache = { at: Date.now(), data }
  return data
}

export const invalidateCatalog = () => void (cache = null)

/** After a paid order: take one off Clover's stock count for each item (sets it to 0 for one-of-a-kind pieces). */
export async function takeFromStock(ids: string[]) {
  const inv = inventoryConfig()
  if (!inv) return []
  const headers = { Authorization: `Bearer ${inv.token}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT }
  const failed: string[] = []
  for (const id of ids) {
    const url = `${inv.apiBase}/v3/merchants/${inv.merchantId}/item_stocks/${id}`
    try {
      const current = await fetch(url, { headers })
      const qty = current.ok ? (((await current.json()) as { quantity?: number }).quantity ?? 1) : 1
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ quantity: Math.max(0, qty - 1) }) })
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    } catch (err) {
      console.error('Clover stock update failed for', id, err)
      failed.push(id)
    }
  }
  invalidateCatalog()
  return failed
}

async function clover<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const inv = inventoryConfig()!
  const res = await fetch(`${inv.apiBase}/v3/merchants/${inv.merchantId}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${inv.token}`, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!res.ok) throw new Error(`Clover ${init.method ?? 'GET'} ${path} ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

/** Finds a Clover category or tag by name (any case), creating it when it doesn't exist yet. */
async function findOrCreate(kind: 'categories' | 'tags', name: string, matches: (n: string) => boolean) {
  const { elements = [] } = await clover<{ elements?: { id: string; name?: string }[] }>(`/${kind}?limit=1000`)
  const found = elements.find((e) => matches((e.name ?? '').trim().toLowerCase()))
  return found?.id ?? (await clover<{ id: string }>(`/${kind}`, { method: 'POST', body: { name } })).id
}

/**
 * Adds an item from /admin to Clover, set up the way the README's "Clover inventory" section describes:
 * site category, grade and retail tags, and a stock count of 1. Returns the new Clover item id.
 */
export async function createCloverItem(p: Omit<Product, 'id'>) {
  const { id } = await clover<{ id: string }>('/items', {
    method: 'POST',
    body: { name: p.name, price: Math.round(p.price * 100), priceType: 'FIXED', alternateName: p.note || undefined, hidden: false },
  })
  try {
    const cat = CATEGORIES.find((c) => c.key === p.category)!
    const categoryId = await findOrCreate('categories', cat.name, (n) => categoryKey(n) === p.category)
    await clover('/category_items', { method: 'POST', body: { elements: [{ category: { id: categoryId }, item: { id } }] } })

    const tagNames = [p.grade, p.retail ? `Retail ${p.retail}` : undefined].filter((t): t is string => !!t)
    for (const name of tagNames) {
      const tagId = await findOrCreate('tags', name, (n) => n === name.toLowerCase())
      await clover('/tag_items', { method: 'POST', body: { elements: [{ tag: { id: tagId }, item: { id } }] } })
    }
    await clover(`/item_stocks/${id}`, { method: 'PUT', body: { quantity: 1 } })
  } catch (err) {
    // Don't leave a half-set-up item in Clover.
    await clover(`/items/${id}`, { method: 'DELETE' }).catch((e) => console.error('Clover cleanup failed for', id, e))
    throw err
  }
  invalidateCatalog()
  return id
}

/** Takes an item off the website by hiding it in Clover. It stays in Clover, so it can be relisted there. */
export async function hideCloverItem(id: string) {
  await clover(`/items/${id}`, { method: 'POST', body: { hidden: true } })
  invalidateCatalog()
}
