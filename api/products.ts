import { getCatalog } from '../server/catalog.js'
import { json } from '../server/config.js'

export async function GET() {
  try {
    const res = json(await getCatalog())
    // Vercel's CDN serves this for up to a minute, so Clover isn't called on every page view.
    // Checkout re-reads Clover directly, so a stale list can't sell an item twice.
    res.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res
  } catch (err) {
    console.error(err)
    return json({ error: 'Could not load products' }, 502)
  }
}
