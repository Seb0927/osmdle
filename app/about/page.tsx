import type { Metadata } from 'next'
import Link from 'next/link'
import data from '@/data/elements.json'
import { formatSnapshot } from '@/lib/game/format.ts'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-heading font-semibold text-3xl tracking-tight">About osmdle</h1>
      <div className="mt-6 space-y-4 text-muted text-sm leading-6">
        <p>
          osmdle is a higher/lower game. Each round shows two OpenStreetMap features and asks which
          one has more elements mapped worldwide.
        </p>
        <p>
          Counts come from OpenStreetMap data via Taginfo. This snapshot is from{' '}
          {formatSnapshot(data.snapshot)}
          {data.source.dataUntil ? ` (data until ${data.source.dataUntil.slice(0, 10)})` : ''}.
        </p>
        <p>
          The numbers count elements mapped in OpenStreetMap — nodes, ways, and relations — not
          real-world totals. Under-mapped regions and duplicate representations can affect the
          numbers.
        </p>
        <p>There are no accounts and no leaderboard. Guess correctly to keep your streak going.</p>
      </div>
      <Link className="mt-8 inline-flex font-medium text-accent text-sm hover:underline" href="/">
        Back to the game
      </Link>
    </div>
  )
}
