export const SITE_URL = 'https://osmdle.com'
export const SITE_NAME = 'Osmdle'
export const SITE_TITLE = "Osmdle: guess what's most common in OpenStreetMap"
export const SITE_DESCRIPTION =
  'Guess what there are the most of in the world according to OpenStreetMap — a higher/lower game built on OSM data.'

export function absoluteUrl(path = '/'): string {
  return new URL(path, SITE_URL).toString()
}
