import type { Metadata } from 'next'
import { ContentCard } from '@/components/layout/ContentCard'
import { Disclosure } from '@/components/layout/Disclosure'
import data from '@/data/elements.json'
import { formatSnapshot } from '@/lib/game/format.ts'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Attributions',
  description: 'Data sources, map imagery, and image and sound credits for Osmdle.',
  alternates: { canonical: absoluteUrl('/attributions/') },
}

const creditedImages = data.elements
  .flatMap((element) =>
    element.image ? [{ id: element.id, title: element.title, image: element.image }] : [],
  )
  .toSorted((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }))

const creditedSounds = [
  {
    author: 'LittleRainySeasons',
    title: 'Correct',
    url: 'https://freesound.org/people/LittleRainySeasons/sounds/335908/',
  },
  {
    author: 'LaurenPonder',
    title: 'Correct and Incorrect Chime',
    url: 'https://freesound.org/people/LaurenPonder/sounds/639432/',
  },
  {
    author: 'NenadSimic',
    title: 'Menu Selection Click',
    url: 'https://freesound.org/people/NenadSimic/sounds/171697/',
  },
  {
    author: 'Werra',
    title: 'Vintage Camera Flash Powder and Shutter',
    url: 'https://freesound.org/people/Werra/sounds/232130/',
  },
]

export default function AttributionsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <ContentCard>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Attributions</h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-muted">
          <p>
            OpenStreetMap data is © OpenStreetMap contributors, available under the Open Data
            Commons Open Database License (ODbL). The game background uses OpenStreetMap map
            imagery.{' '}
            <a
              className="text-accent hover:underline"
              href="https://www.openstreetmap.org/copyright"
              rel="noreferrer"
              target="_blank"
            >
              Read the OSM copyright and license
            </a>
            .
          </p>
          <p>
            The dark background uses the{' '}
            <a
              className="text-accent hover:underline"
              href="https://carto.com/attribution"
              rel="noreferrer"
              target="_blank"
            >
              CARTO Dark Matter
            </a>{' '}
            basemap. Map data is © OpenStreetMap contributors.
          </p>
          <p>
            Family badge icons are from{' '}
            <a
              className="text-accent hover:underline"
              href="https://github.com/openstreetmap-carto/openstreetmap-carto"
              rel="noreferrer"
              target="_blank"
            >
              openstreetmap-carto
            </a>
            , released under CC0 1.0.
          </p>
          <p>
            Counts are provided by{' '}
            <a
              className="text-accent hover:underline"
              href="https://taginfo.openstreetmap.org"
              rel="noreferrer"
              target="_blank"
            >
              Taginfo
            </a>
            . Snapshot: {formatSnapshot(data.snapshot)}
            {data.source.dataUntil ? ` (data until ${data.source.dataUntil.slice(0, 10)})` : ''}.
          </p>
          <p>
            Tag descriptions are from the{' '}
            <a
              className="text-accent hover:underline"
              href="https://wiki.openstreetmap.org"
              rel="noreferrer"
              target="_blank"
            >
              OpenStreetMap Wiki
            </a>
            , © OpenStreetMap Wiki contributors, available under{' '}
            <a
              className="text-accent hover:underline"
              href="https://creativecommons.org/licenses/by-sa/2.0/"
              rel="noreferrer"
              target="_blank"
            >
              CC BY-SA 2.0
            </a>
            .
          </p>
          <p>
            Example images are hotlinked from Wikimedia Commons and the OpenStreetMap Wiki. Each
            image links to its source page, where the available author and license information is
            listed.
          </p>
        </div>

        <Disclosure className="mt-8" summary={`Image credits (${creditedImages.length})`}>
          <ul className="mt-4 space-y-3">
            {creditedImages.map(({ id, title, image }) => (
              <li className="text-xs leading-5 text-muted" key={id}>
                {title} ·{' '}
                {image.pageUrl ? (
                  <a
                    className="font-medium text-foreground hover:underline"
                    href={image.pageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {image.title ?? 'Unnamed file'}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    {image.title ?? 'Unnamed file'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure className="mt-4" summary={`Sound credits (${creditedSounds.length})`}>
          <p className="mt-4 text-xs leading-5 text-muted">
            Sound effects are from{' '}
            <a
              className="text-accent hover:underline"
              href="https://freesound.org"
              rel="noreferrer"
              target="_blank"
            >
              Freesound
            </a>
            .
          </p>
          <ul className="mt-3 space-y-3">
            {creditedSounds.map(({ author, title, url }) => (
              <li className="text-xs leading-5 text-muted" key={url}>
                <a
                  className="font-medium text-foreground hover:underline"
                  href={url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {title}
                </a>
                <span> by {author}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </ContentCard>
    </div>
  )
}
