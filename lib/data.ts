import snapshot from '@/data/elements.json'
import type { CatalogSnapshot } from './game/types.ts'

export const catalog = snapshot as CatalogSnapshot
export const elements = catalog.elements
