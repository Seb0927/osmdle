import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 p-4 text-muted text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Data © OpenStreetMap contributors · Counts via Taginfo</p>
        <Link className="hover:text-foreground" href="/attributions">
          Attributions
        </Link>
      </div>
    </footer>
  )
}
