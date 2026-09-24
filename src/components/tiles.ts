import { Sofa, Laptop, Printer, Palette } from 'lucide-react'
import type { CategoryKey } from '../data'

export const ICONS: Record<CategoryKey, typeof Sofa> = { furniture: Sofa, electronics: Laptop, equipment: Printer, art: Palette }
export const TILE: Record<CategoryKey, string> = {
  furniture: 'bg-[#DCEBDF] text-forest',
  electronics: 'bg-[#D9E6EC] text-[#1F4E63]',
  equipment: 'bg-[#E6E4DA] text-[#4F4A33]',
  art: 'bg-[#F1E1CF] text-ochre',
}
