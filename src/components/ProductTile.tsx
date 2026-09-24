import type { CategoryKey } from '../data'
import { ICONS, TILE } from './tiles'

/** Small square thumbnail for cart and checkout rows. Swap for a product photo later. */
export function Thumb({ category }: { category: CategoryKey }) {
  const Icon = ICONS[category]
  return (
    <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl ${TILE[category]}`} aria-hidden="true">
      <Icon className="h-8 w-8" strokeWidth={1.4} />
    </span>
  )
}
