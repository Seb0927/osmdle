'use client'

import { useSyncExternalStore } from 'react'
import { isMuted, setMuted, subscribeMuted } from '@/lib/game/audio.ts'

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false)

  return (
    <button
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      aria-pressed={muted}
      className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={() => setMuted(!muted)}
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
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {muted ? (
          <path d="m16 9 6 6M22 9l-6 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  )
}
