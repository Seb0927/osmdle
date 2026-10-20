import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  areCompatible,
  createFirstRound,
  isSubset,
  pickChallenger,
  pickNextRound,
} from '../lib/game/round.ts'
import type { Family, GameElement, Tag } from '../lib/game/types.ts'

function seededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function makeElement(
  id: string,
  count: number,
  options: { family?: Family; tags?: Tag[] } = {},
): GameElement {
  return {
    id,
    title: id,
    family: options.family ?? 'civic',
    tags: options.tags ?? [{ key: 'amenity', value: id }],
    description: id,
    image: null,
    count,
    breakdown: null,
    sourceUrl: 'https://taginfo.openstreetmap.org',
  }
}

describe('isSubset', () => {
  test('detects subsets in both directions', () => {
    const school = [{ key: 'amenity', value: 'school' }]
    const schoolBuilding = [
      { key: 'amenity', value: 'school' },
      { key: 'building', value: 'yes' },
    ]

    assert.equal(isSubset(school, schoolBuilding), true)
    assert.equal(isSubset(schoolBuilding, school), false)
    assert.equal(isSubset(school, school), true)
  })

  test('returns false for disjoint tags', () => {
    assert.equal(
      isSubset([{ key: 'amenity', value: 'school' }], [{ key: 'amenity', value: 'hospital' }]),
      false,
    )
  })
})

describe('areCompatible', () => {
  test('rejects identical elements and equal counts', () => {
    const left = makeElement('school', 100)
    const same = makeElement('school', 100)

    assert.equal(areCompatible(left, same), false)
    assert.equal(areCompatible(left, makeElement('hospital', 100)), false)
  })

  test('rejects subset and superset tag pairs', () => {
    const left = makeElement('school', 100)
    const right = makeElement('school-building', 200, {
      tags: [
        { key: 'amenity', value: 'school' },
        { key: 'building', value: 'yes' },
      ],
    })

    assert.equal(areCompatible(left, right), false)
    assert.equal(areCompatible(right, left), false)
  })

  test('enforces ratio bounds', () => {
    const left = makeElement('school', 100)

    assert.equal(areCompatible(left, makeElement('close', 105)), false)
    assert.equal(areCompatible(left, makeElement('valid', 120)), true)
    assert.equal(areCompatible(left, makeElement('edge', 20_000)), true)
    assert.equal(areCompatible(left, makeElement('far', 20_001)), false)
  })

  test('accepts custom ratio bounds', () => {
    const left = makeElement('school', 100)
    const right = makeElement('hospital', 105)

    assert.equal(areCompatible(left, right), false)
    assert.equal(areCompatible(left, right, { minRatio: 1, maxRatio: 2 }), true)
  })
})

describe('pickChallenger', () => {
  test('avoids used ids when alternatives exist', () => {
    const left = makeElement('school', 100)
    const used = makeElement('used', 150)
    const available = makeElement('available', 120)
    const usedIds = new Set(['used'])

    const picked = pickChallenger(left, [left, used, available], {
      usedIds,
      sameFamilyChance: 0,
      rng: seededRng(1),
    })

    assert.equal(picked?.id, 'available')
  })

  test('prefers the same family when requested', () => {
    const left = makeElement('school', 100, { family: 'civic' })
    const sameFamily = makeElement('library', 150, { family: 'civic' })
    const otherFamily = makeElement('cafe', 120, { family: 'food' })

    const picked = pickChallenger(left, [left, sameFamily, otherFamily], {
      sameFamilyChance: 1,
      rng: seededRng(1),
    })

    assert.equal(picked?.id, 'library')
  })

  test('falls back to other families when the same family has no candidates', () => {
    const left = makeElement('school', 100, { family: 'civic' })
    const otherFamily = makeElement('cafe', 120, { family: 'food' })

    const picked = pickChallenger(left, [left, otherFamily], {
      sameFamilyChance: 1,
      rng: seededRng(1),
    })

    assert.equal(picked?.id, 'cafe')
  })

  test('relaxes ratio bounds when no candidate fits', () => {
    const left = makeElement('school', 100)
    const nearTie = makeElement('near-tie', 101)
    const tooFar = makeElement('too-far', 10_000)

    const picked = pickChallenger(left, [left, nearTie, tooFar], {
      minRatio: 1.5,
      maxRatio: 2,
      sameFamilyChance: 0,
      rng: seededRng(1),
    })

    assert.ok(picked)
    assert.notEqual(picked?.id, 'school')
  })

  test('returns null when no element can be challenged', () => {
    const left = makeElement('school', 100)
    const onlyEqual = makeElement('equal', 100)

    const picked = pickChallenger(left, [left, onlyEqual], { rng: seededRng(1) })

    assert.equal(picked, null)
  })
})

describe('createFirstRound', () => {
  test('returns a compatible pair', () => {
    const elements = [
      makeElement('a', 100),
      makeElement('b', 120),
      makeElement('c', 300),
      makeElement('d', 5_000),
    ]

    const round = createFirstRound(elements, { rng: seededRng(7) })

    assert.notEqual(round.left.id, round.right.id)
    assert.notEqual(round.left.count, round.right.count)
    assert.equal(areCompatible(round.left, round.right), true)
  })

  test('is deterministic with a seeded rng', () => {
    const elements = [
      makeElement('a', 100),
      makeElement('b', 120),
      makeElement('c', 300),
      makeElement('d', 5_000),
    ]

    const first = createFirstRound(elements, { rng: seededRng(42) })
    const second = createFirstRound(elements, { rng: seededRng(42) })

    assert.equal(first.left.id, second.left.id)
    assert.equal(first.right.id, second.right.id)
  })
})

describe('pickNextRound', () => {
  test('moves the right card to the left and picks a new challenger', () => {
    const a = makeElement('a', 100)
    const b = makeElement('b', 120)
    const c = makeElement('c', 300)
    const d = makeElement('d', 5_000)
    const round = { left: a, right: b }

    const next = pickNextRound(round, [a, b, c, d], {
      usedIds: new Set(['a']),
      sameFamilyChance: 0,
      rng: seededRng(3),
    })

    assert.equal(next.left.id, 'b')
    assert.notEqual(next.right.id, 'a')
    assert.notEqual(next.right.id, 'b')
    assert.equal(areCompatible(next.left, next.right), true)
  })
})
