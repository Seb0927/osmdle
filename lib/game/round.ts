import { MAX_RATIO, MIN_RATIO, SAME_FAMILY_CHANCE } from './config.ts'
import type { GameElement, PairOptions, Round, Tag } from './types.ts'

function tagSet(tags: Tag[]): Set<string> {
  return new Set(tags.map((tag) => `${tag.key}=${tag.value}`))
}

export function tagSetKey(tags: Tag[]): string {
  return [...tagSet(tags)].sort().join('|')
}

export function isSubset(a: Tag[], b: Tag[]): boolean {
  const other = tagSet(b)
  return a.every((tag) => other.has(`${tag.key}=${tag.value}`))
}

export function countsRatio(a: number, b: number): number {
  if (a <= 0 || b <= 0) {
    return Number.POSITIVE_INFINITY
  }

  return Math.max(a, b) / Math.min(a, b)
}

export function areCompatible(
  left: GameElement,
  right: GameElement,
  options: PairOptions = {},
): boolean {
  if (left.id === right.id || left.count === right.count) {
    return false
  }

  if (isSubset(left.tags, right.tags) || isSubset(right.tags, left.tags)) {
    return false
  }

  const ratio = countsRatio(left.count, right.count)
  const minRatio = options.minRatio ?? MIN_RATIO
  const maxRatio = options.maxRatio ?? MAX_RATIO

  return ratio >= minRatio && ratio <= maxRatio
}

function chooseOne<T>(items: T[], rng: () => number): T | null {
  if (items.length === 0) {
    return null
  }

  const index = Math.floor(rng() * items.length)
  return items[Math.min(index, items.length - 1)] ?? null
}

function preferFamily(
  pool: GameElement[],
  left: GameElement,
  chance: number,
  rng: () => number,
): GameElement[] {
  if (chance <= 0) {
    return pool
  }

  const sameFamily = pool.filter((element) => element.family === left.family)
  if (sameFamily.length === 0) {
    return pool
  }

  if (chance >= 1 || rng() < chance) {
    return sameFamily
  }

  return pool
}

function isStructurallyCompatible(left: GameElement, right: GameElement): boolean {
  return (
    left.id !== right.id &&
    left.count !== right.count &&
    !isSubset(left.tags, right.tags) &&
    !isSubset(right.tags, left.tags)
  )
}

function buildPools(
  left: GameElement,
  elements: GameElement[],
  options: PairOptions,
): GameElement[][] {
  const usedIds = options.usedIds ?? new Set<string>()
  const minRatio = options.minRatio ?? MIN_RATIO
  const maxRatio = options.maxRatio ?? MAX_RATIO
  const others = elements.filter((element) => isStructurallyCompatible(left, element))

  const withinRatio = (element: GameElement) => {
    const ratio = countsRatio(left.count, element.count)
    return ratio >= minRatio && ratio <= maxRatio
  }

  const withinMaxRatio = (element: GameElement) => {
    return countsRatio(left.count, element.count) <= maxRatio
  }

  return [
    others.filter((element) => !usedIds.has(element.id) && withinRatio(element)),
    others.filter(withinRatio),
    others.filter((element) => !usedIds.has(element.id) && withinMaxRatio(element)),
    others.filter(withinMaxRatio),
    others.filter((element) => !usedIds.has(element.id)),
    others,
  ]
}

export function pickChallenger(
  left: GameElement,
  elements: GameElement[],
  options: PairOptions = {},
): GameElement | null {
  const rng = options.rng ?? Math.random
  const chance = options.sameFamilyChance ?? SAME_FAMILY_CHANCE

  for (const pool of buildPools(left, elements, options)) {
    const preferred = preferFamily(pool, left, chance, rng)
    const chosen = chooseOne(preferred, rng)
    if (chosen) {
      return chosen
    }
  }

  return null
}

export function createFirstRound(elements: GameElement[], options: PairOptions = {}): Round {
  const rng = options.rng ?? Math.random
  const eligible = elements.filter((left) =>
    elements.some((right) => areCompatible(left, right, options)),
  )
  const left = chooseOne(eligible, rng)

  if (!left) {
    throw new Error('No compatible starting pair available')
  }

  const usedIds = new Set(options.usedIds ?? [])
  usedIds.add(left.id)
  const right = pickChallenger(left, elements, { ...options, usedIds, rng })

  if (!right) {
    throw new Error('No compatible second element available')
  }

  return { left, right }
}

export function pickNextRound(
  round: Round,
  elements: GameElement[],
  options: PairOptions = {},
): Round {
  const rng = options.rng ?? Math.random
  const usedIds = new Set(options.usedIds ?? [])
  usedIds.add(round.left.id)
  usedIds.add(round.right.id)

  const right = pickChallenger(round.right, elements, { ...options, usedIds, rng })

  if (!right) {
    throw new Error('No compatible next element available')
  }

  return { left: round.right, right }
}
