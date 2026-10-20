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

const stateClasses: Record<CardState, string> = {
  idle: 'border-border enabled:hover:border-accent enabled:hover:shadow-md',
  correct: 'border-success ring-2 ring-success',
  wrong: 'border-danger ring-2 ring-danger',
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
    <button
      aria-label={ariaLabel}
      className={`group flex size-full flex-col overflow-hidden rounded-xl border bg-surface text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default ${stateClasses[state]}`}
      disabled={disabled}
      onClick={onSelect}
      onPointerEnter={handlePointerEnter}
      type="button"
    >
      <div className="relative w-full overflow-hidden bg-subtle" style={{ aspectRatio: '4 / 3' }}>
        {showImage && imageUrl ? (
          <Image
            alt={element.image?.title ?? element.title}
            className="object-cover"
            fill
            loading="eager"
            onError={() => setImageFailed(true)}
            sizes="(min-width: 768px) 50vw, 100vw"
            src={imageUrl}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted text-sm">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h2 className="font-semibold text-lg tracking-tight sm:text-xl">{element.title}</h2>
        <p className="line-clamp-3 text-muted text-sm leading-6">{element.description}</p>
        <div className="mt-auto pt-3">
          <div className="font-semibold text-2xl tabular-nums sm:text-3xl">{count}</div>
          <div className="font-medium text-muted text-xs tracking-wide">Elements</div>
        </div>
      </div>
    </button>
  )
}
