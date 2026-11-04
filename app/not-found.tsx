import Link from 'next/link'
import { ContentCard } from '@/components/layout/ContentCard'

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="w-full max-w-md">
        <ContentCard>
          <p className="text-sm font-medium text-accent">404</p>
          <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-muted">That page does not exist.</p>
          <Link className="mt-6 text-sm font-medium text-accent hover:underline" href="/">
            Back to the game
          </Link>
        </ContentCard>
      </div>
    </div>
  )
}
