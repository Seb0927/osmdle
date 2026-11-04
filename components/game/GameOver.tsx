'use client'

import { useEffect, useRef, useState } from 'react'

interface GameOverProps {
  streak: number
  bestStreak: number
  previousBest: number
  newRecord: boolean
  onRestart: (fromKeyboard: boolean) => void
}

export function GameOver({
  streak,
  bestStreak,
  previousBest,
  newRecord,
  onRestart,
}: GameOverProps) {
  const [copied, setCopied] = useState(false)
  const playAgainRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    playAgainRef.current?.focus()
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copiedWithFallback = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copiedWithFallback) {
      throw new Error('copy failed')
    }
  }

  async function handleShare() {
    const url = window.location.origin
    const text = `I got a streak of ${streak} on Osmdle! Can you beat it? ${url}`

    try {
      await copyText(text)
      setCopied(true)
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      aria-labelledby="game-over-title"
      className="absolute inset-0 z-10 flex items-center justify-center p-4"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-xl">
        <h2 className="font-heading text-2xl font-semibold tracking-tight" id="game-over-title">
          {newRecord ? 'Best streak!' : 'Game over'}
        </h2>
        <p className="mt-4 text-3xl font-semibold tracking-tight">Streak {streak}</p>
        {newRecord ? (
          previousBest > 0 ? (
            <p className="mt-1 text-sm text-muted">Previous best {previousBest}</p>
          ) : null
        ) : (
          <p className="mt-1 text-sm text-muted">Best streak {bestStreak}</p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            onClick={handleShare}
            type="button"
          >
            {copied ? 'Copied!' : 'Share result'}
          </button>
          <button
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            onClick={(event) => onRestart(event.detail === 0)}
            ref={playAgainRef}
            type="button"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}
