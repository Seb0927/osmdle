#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_PATH = path.join(ROOT, 'data/catalog.json')
const OUTPUT_PATH = path.join(ROOT, 'data/elements.json')

const EXPECTED_COUNT = 300
const MIN_COUNT = 1000
const NEAR_TIE_RATIO = 1.1
const VALID_FAMILIES = new Set([
  'civic',
  'health',
  'food',
  'transport',
  'roads',
  'water',
  'nature',
  'landuse',
  'sports',
  'tourism',
  'buildings',
  'street',
])
const VALID_IMAGE_PREFIXES = [
  'https://upload.wikimedia.org/',
  'https://thumb.wikimedia.org/',
  'https://wiki.openstreetmap.org/w/images/',
]

const errors = []
const warnings = []

function error(message) {
  errors.push(message)
}

function warn(message) {
  warnings.push(message)
}

function tagSet(tags) {
  return tags.map((tag) => `${tag.key}=${tag.value}`)
}

function tagSetKey(tags) {
  return tagSet(tags).sort().join('|')
}

function isSubset(a, b) {
  const other = new Set(tagSet(b))
  return tagSet(a).every((tag) => other.has(tag))
}

function ratio(a, b) {
  return Math.max(a, b) / Math.min(a, b)
}

function closestPairs(elements) {
  const sorted = [...elements].sort((a, b) => a.count - b.count)
  const pairs = []
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    pairs.push({
      a: previous,
      b: current,
      ratio: ratio(previous.count, current.count),
    })
  }
  return pairs.sort((a, b) => a.ratio - b.ratio).slice(0, 10)
}

function validateElement(element, index) {
  const label = `elements[${index}] (${element?.id ?? 'unknown'})`

  if (!element || typeof element !== 'object') {
    error(`${label}: not an object`)
    return
  }

  if (typeof element.id !== 'string' || element.id.length === 0) {
    error(`${label}: missing id`)
  }
  if (typeof element.title !== 'string' || element.title.length === 0) {
    error(`${label}: missing title`)
  }
  if (!VALID_FAMILIES.has(element.family)) {
    error(`${label}: invalid family ${JSON.stringify(element.family)}`)
  }

  if (!Array.isArray(element.tags) || element.tags.length < 1 || element.tags.length > 2) {
    error(`${label}: expected 1-2 tags`)
    return
  }

  for (const tag of element.tags) {
    if (
      typeof tag?.key !== 'string' ||
      tag.key.length === 0 ||
      typeof tag?.value !== 'string' ||
      tag.value.length === 0
    ) {
      error(`${label}: invalid tag ${JSON.stringify(tag)}`)
    }
  }

  if (!Number.isInteger(element.count) || element.count <= 0) {
    error(`${label}: count must be a positive integer, got ${JSON.stringify(element.count)}`)
  } else if (element.count < MIN_COUNT) {
    warn(`${label}: low count ${element.count}`)
  }

  if (typeof element.description !== 'string' || element.description.length === 0) {
    error(`${label}: missing description`)
  } else if (element.description.length > 400) {
    warn(`${label}: description is ${element.description.length} characters`)
  }

  if (element.image === null) {
    warn(`${label}: no image`)
  } else if (typeof element.image !== 'object') {
    error(`${label}: image must be an object or null`)
  } else {
    if (
      typeof element.image.url !== 'string' ||
      !VALID_IMAGE_PREFIXES.some((prefix) => element.image.url.startsWith(prefix))
    ) {
      error(`${label}: image url is not from an allowed source`)
    }
    if (typeof element.image.title !== 'string' || element.image.title.length === 0) {
      warn(`${label}: image has no title`)
    }
    if (typeof element.image.pageUrl !== 'string' || element.image.pageUrl.length === 0) {
      warn(`${label}: image has no page url`)
    }
  }

  if (
    typeof element.sourceUrl !== 'string' ||
    !element.sourceUrl.startsWith('https://taginfo.openstreetmap.org/')
  ) {
    warn(`${label}: missing Taginfo source url`)
  }
}

async function main() {
  let catalog
  let output

  try {
    catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'))
  } catch (readError) {
    console.error(`cannot read ${CATALOG_PATH}: ${readError.message}`)
    process.exitCode = 1
    return
  }

  try {
    output = JSON.parse(await readFile(OUTPUT_PATH, 'utf8'))
  } catch {
    console.error(`cannot read ${OUTPUT_PATH}. Run \`npm run data:sync\` first.`)
    process.exitCode = 1
    return
  }

  const catalogElements = catalog.elements ?? []
  const elements = output.elements ?? []

  if (catalog.schemaVersion !== 1) {
    error(`catalog schemaVersion must be 1, got ${JSON.stringify(catalog.schemaVersion)}`)
  }
  if (catalogElements.length !== EXPECTED_COUNT) {
    error(`catalog has ${catalogElements.length} elements, expected ${EXPECTED_COUNT}`)
  }
  if (output.schemaVersion !== 1) {
    error(`output schemaVersion must be 1, got ${JSON.stringify(output.schemaVersion)}`)
  }
  if (elements.length !== EXPECTED_COUNT) {
    error(`output has ${elements.length} elements, expected ${EXPECTED_COUNT}`)
  }
  if (typeof output.snapshot !== 'string' || !/^\d{4}-\d{2}$/.test(output.snapshot)) {
    error(`output snapshot must look like YYYY-MM, got ${JSON.stringify(output.snapshot)}`)
  }
  if (typeof output.source?.dataUntil !== 'string') {
    error('output source.dataUntil is missing')
  } else if (output.snapshot !== output.source.dataUntil.slice(0, 7)) {
    error('output snapshot does not match source.dataUntil')
  }
  if (Number.isNaN(Date.parse(output.generatedAt))) {
    error(`output generatedAt is invalid: ${JSON.stringify(output.generatedAt)}`)
  }

  const catalogIds = catalogElements.map((element) => element.id)
  const outputIds = elements.map((element) => element.id)
  if (catalogIds.join('|') !== outputIds.join('|')) {
    error('output element order/ids do not match the catalog')
  }

  const catalogById = new Map(catalogElements.map((element) => [element.id, element]))
  const seenIds = new Map()
  const seenTitles = new Map()
  const seenTags = new Map()

  for (const [index, element] of elements.entries()) {
    validateElement(element, index)

    if (seenIds.has(element.id)) {
      error(`duplicate id ${element.id} at elements[${index}]`)
    }
    seenIds.set(element.id, index)

    if (seenTitles.has(element.title)) {
      error(`duplicate title ${element.title} at elements[${index}]`)
    }
    seenTitles.set(element.title, index)

    if (Array.isArray(element.tags)) {
      const key = tagSetKey(element.tags)
      if (seenTags.has(key)) {
        error(`duplicate tags ${key} at elements[${index}]`)
      }
      seenTags.set(key, index)

      const source = catalogById.get(element.id)
      if (source && tagSetKey(source.tags) !== key) {
        error(`tags for ${element.id} do not match the catalog`)
      }
    }
  }

  for (let a = 0; a < elements.length; a += 1) {
    for (let b = a + 1; b < elements.length; b += 1) {
      const first = elements[a]
      const second = elements[b]
      if (
        Array.isArray(first.tags) &&
        Array.isArray(second.tags) &&
        (isSubset(first.tags, second.tags) || isSubset(second.tags, first.tags))
      ) {
        error(
          `subset/superset pair: ${first.id} (${first.title}) and ${second.id} (${second.title})`,
        )
      }
    }
  }

  const counts = elements.map((element) => element.count).filter(Number.isFinite)
  const pairs = closestPairs(elements)
  const nearTies = pairs.filter((pair) => pair.ratio < NEAR_TIE_RATIO)

  console.log(`catalog: ${catalogElements.length} elements`)
  console.log(`output:  ${elements.length} elements`)
  console.log(`snapshot: ${output.snapshot} (data until ${output.source?.dataUntil ?? 'unknown'})`)
  if (counts.length > 0) {
    console.log(
      `counts:  ${Math.min(...counts).toLocaleString('en-US')} .. ${Math.max(...counts).toLocaleString('en-US')}`,
    )
  }
  console.log('closest pairs:')
  for (const pair of pairs) {
    console.log(`  ${pair.a.title} (${pair.a.count}) vs ${pair.b.title} (${pair.b.count})`)
  }
  if (nearTies.length > 0) {
    warn(`${nearTies.length} pair(s) are closer than ${NEAR_TIE_RATIO}x`)
  }

  if (warnings.length > 0) {
    console.log('')
    console.log(`warnings: ${warnings.length}`)
    for (const message of warnings) {
      console.log(`  - ${message}`)
    }
  }

  if (errors.length > 0) {
    console.log('')
    console.log(`errors: ${errors.length}`)
    for (const message of errors) {
      console.log(`  - ${message}`)
    }
    process.exitCode = 1
    return
  }

  console.log('')
  console.log('validation passed')
}

await main()
