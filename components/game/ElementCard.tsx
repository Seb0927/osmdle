'use client'

import Image from 'next/image'
import type { PointerEvent, ReactNode } from 'react'
import { useState } from 'react'
import { playSound } from '@/lib/game/audio.ts'
import { formatCount } from '@/lib/game/format.ts'
import type { GameElement } from '@/lib/game/types.ts'

export type CardState = 'idle' | 'correct' | 'wrong'

interface ElementCardProps {
  element: GameElement
  count: ReactNode
  hidden: boolean
  disabled: boolean
  state: CardState
  onSelect: () => void
}

const ribbonClasses: Record<Exclude<CardState, 'idle'>, string> = {
  correct: 'card-ribbon card-ribbon-success',
  wrong: 'card-ribbon card-ribbon-danger',
}

export function ElementCard({
  element,
  count,
  hidden,
  disabled,
  state,
  onSelect,
}: ElementCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = element.image?.url
  const showImage = Boolean(imageUrl) && !imageFailed
  const ariaLabel = hidden
    ? `Choose ${element.title}, count hidden`
    : `Choose ${element.title}, ${formatCount(element.count)} elements`

  function handlePointerEnter(event: PointerEvent<HTMLButtonElement>) {
    if (!disabled && event.pointerType === 'mouse') {
      playSound('hover')
    }
  }

  return (
    // touch-manipulation prevents mobile browsers from reserving the first tap
    // for double-tap zoom.
    <button
      aria-label={ariaLabel}
      className="card-grid card-ratio family-frame relative w-full touch-manipulation place-items-center overflow-hidden rounded-2xl border border-border bg-surface px-4 pt-7 pb-10 text-center shadow-sm transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none enabled:hover:shadow-xl disabled:cursor-default motion-safe:focus-visible:scale-105 motion-safe:enabled:hover:-translate-y-1 motion-safe:enabled:hover:scale-105 motion-safe:enabled:active:scale-95 sm:px-6 sm:pt-8 sm:pb-12"
      data-family={element.family}
      disabled={disabled}
      onClick={onSelect}
      onPointerEnter={handlePointerEnter}
      type="button"
    >
      {state !== 'idle' ? (
        <span aria-hidden="true" className={ribbonClasses[state]} data-testid="verdict">
          {state === 'correct' ? 'Correct' : 'Incorrect'}
        </span>
      ) : null}
      <h2 className="font-heading line-clamp-2 w-full text-lg font-semibold tracking-tight text-balance sm:text-xl">
        {element.title}
      </h2>
      <div className="mt-2 flex min-h-18 w-full items-center md:mt-4">
        <p className="line-clamp-3 w-full text-sm leading-6 text-pretty text-muted">
          {element.description}
        </p>
      </div>
      <div className="card-image-ratio relative mt-4 max-h-full w-7/10 shrink-0 overflow-hidden rounded-lg bg-subtle md:mt-0">
        {showImage && imageUrl ? (
          <Image
            alt={element.image?.title ?? element.title}
            className="object-cover"
            fill
            loading="eager"
            onError={() => setImageFailed(true)}
            sizes="(min-width: 640px) 12rem, 60vw"
            src={imageUrl}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col items-center">
        <div className="text-3xl font-semibold tabular-nums sm:text-4xl">{count}</div>
        <div className="mt-1 text-xs font-medium tracking-widest text-muted uppercase">
          Elements
        </div>
        <span
          className="family-badge mt-4 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-widest uppercase"
          data-family={element.family}
        >
          <span aria-hidden="true" className="family-badge-icon size-3 shrink-0" />
          {element.family}
        </span>
      </div>
      <span
        aria-hidden="true"
        className="font-heading pointer-events-none absolute right-4 bottom-3 max-w-48 truncate text-right text-xs font-medium tracking-wide text-muted opacity-80 sm:right-4 sm:bottom-3 md:hidden"
      >
        {element.title}
      </span>
    </button>
  )
}
