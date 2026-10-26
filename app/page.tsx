import type { Metadata } from 'next'
import { Game } from '@/components/game/Game'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
}

export default function Home() {
  return <Game />
}
