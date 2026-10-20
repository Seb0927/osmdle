import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground">
      <svg
        aria-hidden="true"
        className="size-6 text-accent"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      <span className="font-semibold text-lg tracking-tight">osmdle</span>
    </Link>
  )
}
