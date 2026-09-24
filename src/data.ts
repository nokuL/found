export const CONTACT = {
  phone: '+1 (984) 284-7225',
  phoneHref: 'tel:+19842847225',
  email: 'hello@foundagain.com', // TODO: replace with the real inbox
  address: ['5203 Haybeck Lane', 'Apex, North Carolina 27523'],
}

export type CategoryKey = 'furniture' | 'electronics' | 'equipment' | 'art'

export const CATEGORIES: {
  key: CategoryKey
  name: string
  blurb: string
  items: string[]
}[] = [
  {
    key: 'furniture',
    name: 'Furniture',
    blurb: 'Home and office pieces, inspected for structure and joint stability, then restored.',
    items: ['Living room sets', 'Dining tables', 'Bedroom & storage', 'Ergonomic chairs', 'Standing desks', 'Conference tables'],
  },
  {
    key: 'electronics',
    name: 'Electronics',
    blurb: 'Tested on a multi-point checklist, with every device data-wiped before it is listed.',
    items: ['Laptops & tablets', 'Smartphones', 'Smartwatches', 'Gaming consoles', 'Home audio', 'Smart TVs'],
  },
  {
    key: 'equipment',
    name: 'Equipment',
    blurb: 'Office tech and commercial gear from corporate liquidations, ready to work again.',
    items: ['Printers & copiers', 'Servers & networking', 'Commercial kitchen', 'Workshop tools', 'Light industrial'],
  },
  {
    key: 'art',
    name: 'Art & artifacts',
    blurb: 'Handpicked African art, traditional pieces, and decorative objects with a story.',
    items: ['African art', 'Traditional artifacts', 'Decorative ornaments', 'Wall pieces'],
  },
]

export type Grade = 'Like new' | 'Excellent' | 'Good'

export type Product = {
  id: string
  name: string
  category: CategoryKey
  /** USD */
  price: number
  /** Original retail price in USD, shown struck through. Optional. */
  retail?: number
  grade?: Grade
  note: string
}

/**
 * Fallback product list, used only when Clover inventory is not connected (no CLOVER_INVENTORY_TOKEN).
 * Once it is, products come from Clover; see README "Clover inventory".
 * Each listing is a single, one-of-a-kind item. `id` must stay stable: carts and sold records use it.
 */
export const FEATURED: Product[] = [
  { id: 'aeron-b', name: 'Herman Miller Aeron, size B', category: 'furniture', price: 649, retail: 1795, grade: 'Excellent', note: 'New gas cylinder, mesh steamed' },
  { id: 'mbp14-m2pro', name: 'MacBook Pro 14" M2 Pro, 16GB', category: 'electronics', price: 1199, retail: 1999, grade: 'Like new', note: 'Battery at 96%, data wiped' },
  { id: 'oak-dining-6', name: 'Solid oak dining table, seats 6', category: 'furniture', price: 540, retail: 1400, grade: 'Good', note: 'Refinished top, joints reinforced' },
  { id: 'brother-l8360', name: 'Brother HL-L8360CDW color laser', category: 'equipment', price: 219, retail: 549, grade: 'Excellent', note: '12k page count, new drum' },
  { id: 'shona-sculpture', name: 'Hand-carved Shona stone sculpture', category: 'art', price: 380, retail: 700, grade: 'Excellent', note: 'Serpentine stone, 14" tall' },
  { id: 'uplift-v2-60', name: 'Uplift V2 standing desk, 60"', category: 'furniture', price: 389, retail: 899, grade: 'Like new', note: 'Motors tested, all presets work' },
]

/** Checkout settings. The server recomputes every total from these, so the browser can't change a price. */
export const SHOP = {
  shippingFlat: 49, // USD per order. TODO: placeholder, set your real rate
  // Apex, NC (Wake County) combined sales tax: 4.75% state + 2.5% local (county + transit). TODO: confirm with your accountant.
  taxRate: 0.0725,
  taxName: 'NC sales tax',
  pickupLabel: 'Pick up in Apex, NC',
}

/** Numbers used in the Returns, Shipping, Privacy, and Terms pages. Change them here, not in the page text. */
export const POLICY = {
  updated: 'September 24, 2026',
  returnDays: 14, // from delivery or pickup
  refundBusinessDays: 5, // after we receive and inspect a return
  damageReportHours: 48,
  processingBusinessDays: 2, // payment to hand-off to the carrier
  parcelDelivery: '3 to 7 business days',
  freightDelivery: '1 to 3 weeks',
  pickupHoldDays: 14,
  legalName: 'Found Again LLC',
  governingState: 'North Carolina',
  venue: 'Wake County, North Carolina',
}

export const POLICY_LINKS = [
  { href: '/returns', label: 'Returns & refunds' },
  { href: '/shipping', label: 'Shipping & pickup' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of sale' },
]
