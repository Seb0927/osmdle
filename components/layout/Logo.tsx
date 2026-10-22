import Image from 'next/image'
import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground">
      <Image
        loading="eager"
        alt=""
        className="size-8"
        height={1024}
        src="/images/icon.webp"
        width={1024}
      />
      <span className="font-heading font-semibold text-lg tracking-tight">osmdle</span>
    </Link>
  )
}
