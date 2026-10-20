import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { countAtTime, easeOutCubic, formatCount, formatSnapshot } from '../lib/game/format.ts'

describe('formatCount', () => {
  test('formats counts with thousands separators', () => {
    assert.equal(formatCount(1451104), '1,451,104')
    assert.equal(formatCount(0), '0')
  })
})

describe('formatSnapshot', () => {
  test('formats a YYYY-MM snapshot as a month and year', () => {
    assert.equal(formatSnapshot('2026-10'), 'October 2026')
  })

  test('returns invalid snapshots unchanged', () => {
    assert.equal(formatSnapshot('unknown'), 'unknown')
    assert.equal(formatSnapshot('2026-13'), '2026-13')
  })
})

describe('easeOutCubic', () => {
  test('starts at zero, ends at one, and clamps', () => {
    assert.equal(easeOutCubic(0), 0)
    assert.equal(easeOutCubic(1), 1)
    assert.equal(easeOutCubic(-1), 0)
    assert.equal(easeOutCubic(2), 1)
    assert.equal(easeOutCubic(0.5), 0.875)
  })
})

describe('countAtTime', () => {
  test('interpolates from the start to the end', () => {
    assert.equal(countAtTime(0, 1000, 0, 3000), 0)
    assert.equal(countAtTime(0, 1000, 1500, 3000), 875)
    assert.equal(countAtTime(0, 1000, 3000, 3000), 1000)
  })

  test('clamps elapsed time and handles zero duration', () => {
    assert.equal(countAtTime(100, 200, -500, 1000), 100)
    assert.equal(countAtTime(100, 200, 5000, 1000), 200)
    assert.equal(countAtTime(100, 200, 0, 0), 200)
  })
})
