import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="font-medium text-accent text-sm">404</p>
        <h1 className="mt-2 font-heading font-semibold text-3xl tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted text-sm">That page does not exist.</p>
        <Link className="mt-6 font-medium text-accent text-sm hover:underline" href="/">
          Back to the game
        </Link>
      </div>
    </div>
  )
}
