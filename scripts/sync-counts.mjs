#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_PATH = path.join(ROOT, 'data/catalog.json')
const OUTPUT_PATH = path.join(ROOT, 'data/elements.json')
const CACHE_DIR = path.join(ROOT, '.cache')
const CACHE_PATH = path.join(CACHE_DIR, 'taginfo.json')

const TAGINFO = 'https://taginfo.openstreetmap.org/api/4'
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT = 'osmdle/0.1 (+https://github.com/Seb0927/osmdle)'
const REQUEST_DELAY_MS = 250
const MIN_COUNT = 1000
const WARN_COUNT = 5000

const reportOnly = process.argv.includes('--report')

let cache = { responses: {} }
let requestsSinceSave = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadCache() {
  try {
    cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'))
  } catch {
    cache = { responses: {} }
  }
}

async function saveCache() {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`)
}

function encode(value) {
  return encodeURIComponent(value)
}

async function fetchJson(url) {
  if (cache.responses[url]) {
    return cache.responses[url]
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        accept: 'application/json',
      },
    })

    if (response.status === 429) {
      const retryAfter = Number.parseInt(response.headers.get('retry-after') ?? '', 10)
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000 * 2 ** attempt)
      continue
    }

    if (response.status >= 500) {
      await sleep(1000 * 2 ** attempt)
      continue
    }

    if (!response.ok) {
      const body = (await response.text()).slice(0, 200)
      throw new Error(`${response.status} ${url}: ${body}`)
    }

    const json = await response.json()
    cache.responses[url] = json
    requestsSinceSave += 1
    if (requestsSinceSave >= 20) {
      requestsSinceSave = 0
      await saveCache()
    }
    await sleep(REQUEST_DELAY_MS)
    return json
  }

  throw new Error(`request failed after retries: ${url}`)
}

function tagListKey(tags) {
  return tags
    .map((tag) => `${tag.key}=${tag.value}`)
    .sort()
    .join('|')
}

function stripHtml(value) {
  if (!value) {
    return null
  }
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

function resolveImageUrl(image) {
  if (!image) {
    return null
  }

  const original = image.image_url?.split('?')[0] ?? null
  if (original?.includes('wiki.openstreetmap.org')) {
    return original
  }

  if (!image.thumb_url_prefix || !image.thumb_url_suffix) {
    return original
  }

  const width = Number(image.width)
  if (Number.isFinite(width) && width > 0 && width <= 500) {
    return original
  }

  return `${image.thumb_url_prefix}500${image.thumb_url_suffix}`.split('?')[0]
}

function pageUrlFor(imageUrl, title) {
  const host = imageUrl?.includes('wiki.openstreetmap.org')
    ? 'https://wiki.openstreetmap.org/wiki'
    : 'https://commons.wikimedia.org/wiki'
  return `${host}/${encode(title.replaceAll(' ', '_'))}`
}

async function resolveImageAttribution(imageUrl, title) {
  const apis = imageUrl?.includes('wiki.openstreetmap.org')
    ? ['https://wiki.openstreetmap.org/w/api.php', COMMONS]
    : [COMMONS]

  for (const api of apis) {
    try {
      const url = `${api}?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encode(title)}`
      const data = await fetchJson(url)
      const page = Object.values(data.query?.pages ?? {})[0]
      const metadata = page?.imageinfo?.[0]?.extmetadata
      if (!metadata || (!metadata.Artist && !metadata.LicenseShortName)) {
        continue
      }
      return {
        author: stripHtml(metadata.Artist?.value),
        license: stripHtml(metadata.LicenseShortName?.value),
        licenseUrl: stripHtml(metadata.LicenseUrl?.value),
        credit: stripHtml(metadata.Credit?.value),
      }
    } catch {}
  }

  return null
}

async function resolveCount(tags) {
  if (tags.length === 1) {
    const tag = tags[0]
    const url = `${TAGINFO}/tag/stats?key=${encode(tag.key)}&value=${encode(tag.value)}`
    const data = await fetchJson(url)
    const row = data.data?.find((entry) => entry.type === 'all')
    if (!row || !Number.isFinite(row.count)) {
      throw new Error(`no count for ${tag.key}=${tag.value}`)
    }
    return {
      count: row.count,
      breakdown: {
        nodes: data.data.find((entry) => entry.type === 'nodes')?.count ?? 0,
        ways: data.data.find((entry) => entry.type === 'ways')?.count ?? 0,
        relations: data.data.find((entry) => entry.type === 'relations')?.count ?? 0,
      },
      sourceUrl: `https://taginfo.openstreetmap.org/tags/${encode(tag.key)}=${encode(tag.value)}`,
      dataUntil: data.data_until,
    }
  }

  const orientations = [
    [tags[0], tags[1]],
    [tags[1], tags[0]],
  ]

  for (const [base, other] of orientations) {
    const url = `${TAGINFO}/tag/combinations?key=${encode(base.key)}&value=${encode(base.value)}&query=${encode(other.value)}&rp=100`
    const data = await fetchJson(url)
    const row = data.data?.find(
      (entry) => entry.other_key === other.key && entry.other_value === other.value,
    )
    if (row && Number.isFinite(row.together_count)) {
      return {
        count: row.together_count,
        breakdown: null,
        sourceUrl: `https://taginfo.openstreetmap.org/tags/${encode(base.key)}=${encode(base.value)}#combinations`,
        dataUntil: data.data_until,
      }
    }
  }

  throw new Error(
    `no combination count for ${tags.map((tag) => `${tag.key}=${tag.value}`).join(' + ')}`,
  )
}

async function resolveWiki(tags) {
  const candidates = tags.length === 2 ? [tags[1], tags[0]] : [tags[0]]
  const seen = new Set()

  for (const tag of candidates) {
    const key = tagListKey([tag])
    if (seen.has(key)) {
      continue
    }
    seen.add(key)

    const url = `${TAGINFO}/tag/wiki_pages?key=${encode(tag.key)}&value=${encode(tag.value)}`
    const data = await fetchJson(url)
    const rows = data.data ?? []
    if (rows.length === 0) {
      continue
    }

    const row = rows.find((entry) => entry.lang === 'en') ?? rows[0]
    const imageData = row.image
    const imageUrl = imageData ? resolveImageUrl(imageData) : null
    const image = imageData
      ? {
          url: imageUrl,
          title: imageData.title ?? null,
          pageUrl: imageData.title && imageUrl ? pageUrlFor(imageUrl, imageData.title) : null,
          source: imageUrl?.includes('wiki.openstreetmap.org')
            ? 'OpenStreetMap Wiki'
            : 'Wikimedia Commons',
          ...(imageData.title
            ? ((await resolveImageAttribution(imageUrl, imageData.title)) ?? {})
            : {}),
        }
      : null

    return {
      tag,
      description: row.description?.trim() || null,
      image,
      dataUntil: data.data_until,
    }
  }

  return null
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
    pairs.push({ a: previous, b: current, ratio: ratio(previous.count, current.count) })
  }
  return pairs.sort((a, b) => a.ratio - b.ratio).slice(0, 8)
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'))
  const elements = catalog.elements ?? []
  const results = []
  const errors = []
  const warnings = []
  const dataUntilTracker = createDataUntilTracker()
  const seenTags = new Map()

  for (const [index, element] of elements.entries()) {
    const label = `${String(index + 1).padStart(3, '0')}/${elements.length} ${element.id}`

    const tags = element.tags ?? []
    if (tags.length < 1 || tags.length > 2) {
      errors.push(`${label}: expected 1-2 tags, got ${tags.length}`)
      continue
    }

    const tagKey = tagListKey(tags)
    if (seenTags.has(tagKey)) {
      errors.push(`${label}: duplicate tags (also ${seenTags.get(tagKey)})`)
      continue
    }
    seenTags.set(tagKey, element.id)

    try {
      const count = await resolveCount(tags)
      const wiki = await resolveWiki(tags)

      if (count.count < MIN_COUNT) {
        warnings.push(`${label}: low count ${count.count}`)
      } else if (count.count < WARN_COUNT) {
        warnings.push(`${label}: small count ${count.count}`)
      }

      if (!element.shortDescription && !wiki?.description) {
        warnings.push(`${label}: no wiki description`)
      }

      if (!wiki?.image?.url) {
        warnings.push(`${label}: no wiki image`)
      }

      if (wiki?.dataUntil) {
        dataUntilTracker.push(wiki.dataUntil)
      }
      if (count.dataUntil) {
        dataUntilTracker.push(count.dataUntil)
      }

      results.push({
        id: element.id,
        title: element.title,
        family: element.family,
        tags,
        description: element.shortDescription ?? wiki?.description ?? element.title,
        image: wiki?.image ?? null,
        count: count.count,
        breakdown: count.breakdown,
        sourceUrl: count.sourceUrl,
      })

      console.log(`${label}: ${count.count.toLocaleString('en-US')}`)
    } catch (error) {
      errors.push(`${label}: ${error.message}`)
      console.log(`${label}: FAILED`)
    }
  }

  await saveCache()

  const dataUntil = dataUntilTracker.latest()
  const snapshot = dataUntil ? dataUntil.slice(0, 7) : new Date().toISOString().slice(0, 7)

  console.log('')
  console.log(`resolved: ${results.length}/${elements.length}`)
  if (warnings.length > 0) {
    console.log(`warnings: ${warnings.length}`)
    for (const warning of warnings) {
      console.log(`  - ${warning}`)
    }
  }
  if (errors.length > 0) {
    console.log(`errors: ${errors.length}`)
    for (const error of errors) {
      console.log(`  - ${error}`)
    }
  }

  if (errors.length > 0) {
    if (!reportOnly) {
      console.log('')
      console.log('aborting without writing data/elements.json')
    }
    process.exitCode = 1
    return
  }

  console.log('')
  console.log('closest count pairs:')
  for (const pair of closestPairs(results)) {
    console.log(`  ${pair.a.title} (${pair.a.count}) vs ${pair.b.title} (${pair.b.count})`)
  }

  if (reportOnly) {
    return
  }

  const output = {
    schemaVersion: 1,
    snapshot,
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Taginfo',
      url: 'https://taginfo.openstreetmap.org',
      dataUntil,
    },
    elements: results,
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log('')
  console.log(`wrote ${results.length} elements to ${OUTPUT_PATH}`)
}

function createDataUntilTracker() {
  const values = []
  return {
    push(value) {
      if (value) {
        values.push(value)
      }
    },
    latest() {
      if (values.length === 0) {
        return null
      }
      return values.sort().at(-1)
    },
  }
}

await loadCache()
await main()
