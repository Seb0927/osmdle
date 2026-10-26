import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentCard } from '@/components/layout/ContentCard'
import data from '@/data/elements.json'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About',
  description: 'How Osmdle works and what the OpenStreetMap element counts actually measure.',
  alternates: { canonical: absoluteUrl('/about/') },
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <ContentCard>
        <h1 className="font-heading font-semibold text-3xl tracking-tight">About Osmdle</h1>
        <div className="mt-6 space-y-4 text-muted text-sm leading-6">
          <p>
            Osmdle is a higher/lower game where each round shows you two features from around the
            world, and you pick the one you think is mapped more often worldwide. The game is built
            on OpenStreetMap (OSM) data, and because that data is edited constantly, counts change
            over time.
          </p>
          <p>
            Osmdle uses a periodic Taginfo snapshot that captures the current count of{' '}
            {data.elements.length} features mapped in OSM. You can find the date of the latest
            snapshot on the{' '}
            <Link className="text-accent hover:underline" href="/attributions">
              attributions page
            </Link>
            .
          </p>
          <p>
            Counts reflect elements (nodes, ways, and relations) mapped in OSM by volunteers, so
            they don't represent real-world totals. Some features and regions are under-mapped, and
            some features are mapped more than once. Both can skew the numbers.
          </p>
          <p>
            Guess correctly to build your streak, and try to beat your best{' '}
            <span aria-hidden="true">(ﾉ◕ヮ◕)ﾉ</span>.
          </p>
        </div>
        <Link className="mt-8 inline-flex font-medium text-accent text-sm hover:underline" href="/">
          Back to the game
        </Link>
      </ContentCard>
    </div>
  )
}
