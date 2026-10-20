import type { Metadata } from 'next'
import data from '@/data/elements.json'

export const metadata: Metadata = {
  title: 'Attributions',
}

const creditedImages = data.elements.flatMap((element) =>
  element.image ? [{ id: element.id, title: element.title, image: element.image }] : [],
)

export default function AttributionsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-semibold text-3xl tracking-tight">Attributions</h1>
      <div className="mt-6 space-y-4 text-muted text-sm leading-6">
        <p>
          OpenStreetMap data is © OpenStreetMap contributors, available under the Open Data Commons
          Open Database License (ODbL).{' '}
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
          Counts are provided by{' '}
          <a
            className="text-accent hover:underline"
            href="https://taginfo.openstreetmap.org"
            rel="noreferrer"
            target="_blank"
          >
            Taginfo
          </a>
          . Snapshot: {data.snapshot}
          {data.source.dataUntil ? ` (data until ${data.source.dataUntil.slice(0, 10)})` : ''}.
        </p>
        <p>
          Example images are hotlinked from Wikimedia Commons and the OpenStreetMap Wiki. Each
          credit links to the source page. Licenses are shown where the source provides them.
        </p>
      </div>

      <details className="mt-8 rounded-lg border border-border p-4">
        <summary className="cursor-pointer font-medium text-sm">
          Image credits ({creditedImages.length})
        </summary>
        <ul className="mt-4 space-y-3">
          {creditedImages.map(({ id, title, image }) => (
            <li className="text-muted text-xs leading-5" key={id}>
              {image.pageUrl ? (
                <a
                  className="font-medium text-foreground hover:underline"
                  href={image.pageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {image.title ?? title}
                </a>
              ) : (
                <span className="font-medium text-foreground">{image.title ?? title}</span>
              )}
              <span>
                {' '}
                — {image.author ?? 'Unknown author'} · {image.license ?? 'See source page'}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
