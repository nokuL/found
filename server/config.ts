/** Server-side settings, read from Vercel environment variables (or .env.local in dev). */
const apiBase = () =>
  process.env.CLOVER_API_BASE || // testing only: point at a mock Clover server
  (process.env.CLOVER_ENV === 'production' ? 'https://api.clover.com' : 'https://apisandbox.dev.clover.com')

/** Clover rejects REST requests without a User-Agent. */
export const USER_AGENT = 'FoundAgainWebsite/1.0'

/** Payments (Hosted Checkout). */
export function cloverConfig() {
  const token = process.env.CLOVER_PRIVATE_TOKEN
  const merchantId = process.env.CLOVER_MERCHANT_ID
  if (!token || !merchantId) return null
  return {
    token,
    merchantId,
    apiBase: apiBase(),
    pageConfigUuid: process.env.CLOVER_PAGE_CONFIG_UUID,
    webhookSecret: process.env.CLOVER_WEBHOOK_SECRET,
  }
}

/** Products and stock (Inventory API). Needs a token with Inventory read and write permission. */
export function inventoryConfig() {
  const token = process.env.CLOVER_INVENTORY_TOKEN
  const merchantId = process.env.CLOVER_MERCHANT_ID
  if (!token || !merchantId) return null
  return { token, merchantId, apiBase: apiBase() }
}

/** With no Clover keys, checkout runs in demo mode. */
export const demoMode = () => cloverConfig() === null

// Fail closed: demo mode only runs where Vercel positively reports a non-production deploy, or under `npm run dev`.
// Production, or a missing/unknown VERCEL_ENV, refuses checkout instead of taking unpaid orders.
const DEMO_OK = new Set(['preview', 'development'])
export const demoBlocked = () => demoMode() && !process.env.FA_LOCAL_DEV && !DEMO_OK.has(process.env.VERCEL_ENV ?? '')

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
