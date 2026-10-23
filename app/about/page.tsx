import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentCard } from '@/components/layout/ContentCard'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <ContentCard>
        <h1 className="font-heading font-semibold text-3xl tracking-tight">About Osmdle</h1>
        <div className="mt-6 space-y-4 text-muted text-sm leading-6">
          <p>
            Osmdle is a higher/lower game built on OpenStreetMap data. Each round shows two
            features: pick the one you think is mapped more often worldwide.
          </p>
          <p>
            OpenStreetMap is edited constantly, so counts change over time. Osmdle uses a periodic
            Taginfo snapshot; the current date is on the{' '}
            <Link className="text-accent hover:underline" href="/attributions">
              attributions page
            </Link>
            .
          </p>
          <p>
            Counts reflect elements mapped in OpenStreetMap (nodes, ways, and relations), not
            real-world totals. Under-mapped regions and features mapped more than once can skew the
            numbers.
          </p>
          <p>Guess correctly to build your streak, and try to beat your best.</p>
        </div>
        <Link className="mt-8 inline-flex font-medium text-accent text-sm hover:underline" href="/">
          Back to the game
        </Link>
      </ContentCard>
    </div>
  )
}
