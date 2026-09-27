import { CATEGORIES, FEATURED, type CategoryKey, type Grade, type Product } from '../src/data.js'
import { inventoryConfig, USER_AGENT } from './config.js'
import { sold } from './store.js'

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

const GRADES: Grade[] = ['Like new', 'Excellent', 'Good']

/** Clover category → site collection. Items in no matching category stay off the website (e.g. POS-only items). */
function categoryOf(item: CloverItem): CategoryKey | undefined {
  for (const { name = '' } of item.categories?.elements ?? []) {
    const n = name.trim().toLowerCase()
    const c = CATEGORIES.find((c) => n === c.key || n === c.name.toLowerCase() || (c.key === 'art' && n.startsWith('art')))
    if (c) return c.key
  }
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

/** Products for the shop. From Clover when connected, otherwise the FEATURED list in src/data.ts. */
export async function getCatalog({ fresh = false } = {}): Promise<Catalog> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.data
  const soldLocally = await sold.ids()

  let data: Catalog
  if (!inventoryConfig()) {
    data = { products: FEATURED, soldIds: soldLocally, source: 'local' }
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
