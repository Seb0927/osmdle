export type Family =
  | 'civic'
  | 'health'
  | 'food'
  | 'transport'
  | 'roads'
  | 'water'
  | 'nature'
  | 'landuse'
  | 'sports'
  | 'tourism'
  | 'buildings'
  | 'street'

export interface Tag {
  key: string
  value: string
}

export interface ElementImage {
  url: string
  title: string | null
  pageUrl: string | null
  source: string
  author?: string | null
  license?: string | null
  licenseUrl?: string | null
  credit?: string | null
}

export interface ElementBreakdown {
  nodes: number
  ways: number
  relations: number
}

export interface GameElement {
  id: string
  title: string
  family: Family
  tags: Tag[]
  description: string
  image: ElementImage | null
  count: number
  breakdown: ElementBreakdown | null
  sourceUrl: string
}

export interface CatalogSource {
  name: string
  url: string
  dataUntil: string
}

export interface CatalogSnapshot {
  schemaVersion: number
  snapshot: string
  generatedAt: string
  source: CatalogSource
  elements: GameElement[]
}

export interface Round {
  left: GameElement
  right: GameElement
}

export interface PairOptions {
  minRatio?: number
  maxRatio?: number
  sameFamilyChance?: number
  usedIds?: ReadonlySet<string>
  rng?: () => number
}
