'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SoundToggle } from '@/components/game/SoundToggle'
import { Logo } from '@/components/layout/Logo'

const links = [
  { href: '/', label: 'Osmdle' },
  { href: '/about', label: 'About' },
  { href: '/attributions', label: 'Attributions' },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <header className="p-3 sm:px-6">
      <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-3 items-center gap-1 rounded-2xl border border-border bg-surface px-1 shadow-sm sm:gap-3 sm:px-3">
        <div ref={menuRef} className="relative justify-self-start">
          <button
            aria-controls="site-menu"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setIsOpen((open) => !open)}
            ref={buttonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {isOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          {isOpen ? (
            <nav
              aria-label="Site menu"
              className="absolute top-full left-0 z-20 mt-3 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg"
              id="site-menu"
            >
              {links.map((link) => (
                <Link
                  className="block rounded-md px-3 py-2 text-foreground text-sm hover:bg-subtle"
                  href={link.href}
                  key={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="justify-self-center">
          <Logo />
        </div>
        <div className="justify-self-end">
          <SoundToggle />
        </div>
      </div>
    </header>
  )
}
