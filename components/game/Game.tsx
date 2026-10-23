'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { CountUp } from '@/components/game/CountUp'
import type { CardState } from '@/components/game/ElementCard'
import { ElementCard } from '@/components/game/ElementCard'
import { GameOver } from '@/components/game/GameOver'
import { elements } from '@/lib/data.ts'
import { playSound, preloadSounds, unlockAudio } from '@/lib/game/audio.ts'
import { COUNT_UP_MS, SLIDE_MS, VERDICT_HOLD_MS } from '@/lib/game/config.ts'
import { formatCount } from '@/lib/game/format.ts'
import { createFirstRound, pickNextRound } from '@/lib/game/round.ts'
import type { Round } from '@/lib/game/types.ts'

const BEST_STREAK_KEY = 'osmdle:best-streak'

type Phase = 'boot' | 'answering' | 'revealing' | 'holding' | 'sliding' | 'gameover'
type Side = 'left' | 'right'
type Result = 'correct' | 'wrong'

interface State {
  phase: Phase
  round: Round | null
  nextRound: Round | null
  usedIds: Set<string>
  streak: number
  chosenSide: Side | null
  result: Result | null
  bestStreak: number
}

type Action =
  | { type: 'start'; round: Round; nextRound: Round; usedIds: Set<string>; bestStreak: number }
  | { type: 'guess'; side: Side }
  | { type: 'reveal-done' }
  | { type: 'hold-done' }
  | { type: 'commit'; nextRound: Round; usedIds: Set<string> }
  | { type: 'set-best'; bestStreak: number }

const initialState: State = {
  phase: 'boot',
  round: null,
  nextRound: null,
  usedIds: new Set(),
  streak: 0,
  chosenSide: null,
  result: null,
  bestStreak: 0,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return {
        phase: 'answering',
        round: action.round,
        nextRound: action.nextRound,
        usedIds: action.usedIds,
        streak: 0,
        chosenSide: null,
        result: null,
        bestStreak: action.bestStreak,
      }
    case 'guess': {
      if (state.phase !== 'answering' || !state.round) {
        return state
      }
      const winner: Side = state.round.left.count > state.round.right.count ? 'left' : 'right'
      return {
        ...state,
        phase: 'revealing',
        chosenSide: action.side,
        result: action.side === winner ? 'correct' : 'wrong',
      }
    }
    case 'reveal-done':
      return state.phase === 'revealing' ? { ...state, phase: 'holding' } : state
    case 'hold-done':
      if (state.phase !== 'holding') {
        return state
      }
      return { ...state, phase: state.result === 'correct' ? 'sliding' : 'gameover' }
    case 'commit':
      if (state.phase !== 'sliding' || !state.nextRound) {
        return state
      }
      return {
        ...state,
        phase: 'answering',
        round: state.nextRound,
        nextRound: action.nextRound,
        usedIds: action.usedIds,
        streak: state.streak + 1,
        chosenSide: null,
        result: null,
      }
    case 'set-best':
      return { ...state, bestStreak: action.bestStreak }
  }
}

function makeInitialGame() {
  const round = createFirstRound(elements)
  const usedIds = new Set([round.left.id, round.right.id])
  const nextRound = pickNextRound(round, elements, { usedIds })
  return { round, nextRound, usedIds }
}

function readBestStreak(): number {
  try {
    const value = Number.parseInt(window.localStorage.getItem(BEST_STREAK_KEY) ?? '', 10)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function writeBestStreak(value: number): void {
  try {
    window.localStorage.setItem(BEST_STREAK_KEY, String(value))
  } catch {
    return
  }
}

function cardState(side: Side, state: State): CardState {
  if (state.phase !== 'holding' && state.phase !== 'sliding' && state.phase !== 'gameover') {
    return 'idle'
  }
  if (state.chosenSide === side) {
    return state.result === 'correct' ? 'correct' : 'wrong'
  }
  return state.result === 'wrong' ? 'correct' : 'idle'
}

function deckClasses(side: Side, frontSide: Side) {
  const position =
    side === frontSide
      ? 'max-md:z-20 max-md:-rotate-1'
      : 'max-md:z-0 max-md:translate-x-8 max-md:translate-y-4 max-md:rotate-2 max-md:scale-95'

  return `max-md:absolute max-md:inset-0 motion-safe:max-md:transition-transform motion-safe:max-md:duration-200 md:relative md:w-full md:max-w-sm ${position}`
}

function GameSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-7 pb-8 sm:px-6">
      <div className="flex justify-center">
        <div className="h-6 w-40 animate-pulse rounded-full border border-border bg-surface shadow-sm" />
      </div>
      <div className="mx-auto mt-4 h-8 w-72 animate-pulse rounded bg-subtle" />
      <div className="max-md:pr-5">
        <div className="mx-auto mt-4 w-full max-w-xs sm:max-w-sm md:flex md:max-w-none md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-16">
          <div aria-hidden="true" className="card-ratio w-full md:hidden" />
          <div className="max-md:absolute max-md:inset-0 max-md:z-20 max-md:-rotate-1 md:relative md:w-full md:max-w-sm">
            <div className="card-ratio size-full animate-pulse rounded-2xl border border-border bg-subtle" />
          </div>
          <div className="max-md:absolute max-md:inset-0 max-md:z-0 max-md:translate-x-8 max-md:translate-y-4 max-md:rotate-2 max-md:scale-95 md:relative md:w-full md:max-w-sm">
            <div className="card-ratio size-full animate-pulse rounded-2xl border border-border bg-subtle" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Game() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [frontSide, setFrontSide] = useState<Side>('left')
  const startedRef = useRef(false)
  const focusAfterRestartRef = useRef(false)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  // Gestures are resolved on pointerup so selection does not depend on where a
  // moving card ends up after the browser retargets the synthesized click.
  const swipeStartRef = useRef<{ x: number; y: number; side: Side | null } | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    preloadSounds()
    const bestStreak = readBestStreak()
    const { round, nextRound, usedIds } = makeInitialGame()
    dispatch({ type: 'start', round, nextRound, usedIds, bestStreak })
  }, [])

  useEffect(() => {
    if (state.phase === 'revealing') {
      const timer = window.setTimeout(() => dispatch({ type: 'reveal-done' }), COUNT_UP_MS)
      return () => window.clearTimeout(timer)
    }
    if (state.phase === 'holding') {
      const timer = window.setTimeout(() => dispatch({ type: 'hold-done' }), VERDICT_HOLD_MS)
      return () => window.clearTimeout(timer)
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'holding' && state.result) {
      playSound(state.result)
    }
  }, [state.phase, state.result])

  useEffect(() => {
    if (state.phase === 'gameover') {
      playSound('gameover')
    }
  }, [state.phase])

  useEffect(() => {
    if (state.streak <= state.bestStreak) {
      return
    }
    writeBestStreak(state.streak)
    dispatch({ type: 'set-best', bestStreak: state.streak })
  }, [state.bestStreak, state.streak])

  useEffect(() => {
    const url = state.nextRound?.right.image?.url
    if (!url) {
      return
    }
    const image = new Image()
    image.src = url
  }, [state.nextRound])

  const commitSlide = useCallback(() => {
    if (!state.nextRound) {
      return
    }
    const usedIds = new Set(state.usedIds)
    usedIds.add(state.nextRound.right.id)
    const nextRound = pickNextRound(state.nextRound, elements, { usedIds })
    setFrontSide('left')
    dispatch({ type: 'commit', nextRound, usedIds })
  }, [state.nextRound, state.usedIds])

  useEffect(() => {
    if (state.phase !== 'sliding') {
      return
    }
    playSound('slide')
    const leftElement = leftRef.current
    const rightElement = rightRef.current
    if (!leftElement || !rightElement) {
      commitSlide()
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commitSlide()
      return
    }

    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    let cancelled = false
    let rightAnimation: Animation | null = null

    if (isDesktop) {
      const leftRect = leftElement.getBoundingClientRect()
      const rightRect = rightElement.getBoundingClientRect()
      const deltaX = leftRect.left - rightRect.left
      const deltaY = leftRect.top - rightRect.top

      rightAnimation = rightElement.animate(
        [{ transform: 'translate(0, 0)' }, { transform: `translate(${deltaX}px, ${deltaY}px)` }],
        { duration: SLIDE_MS, easing: 'ease-in-out', fill: 'forwards' },
      )
    }

    const leftAnimation = leftElement.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: SLIDE_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    })

    Promise.all([rightAnimation?.finished, leftAnimation.finished])
      .then(() => {
        if (!cancelled) {
          commitSlide()
        }
      })
      .catch(() => {
        cancelled = true
      })

    return () => {
      cancelled = true
      rightAnimation?.cancel()
      leftAnimation.cancel()
    }
  }, [commitSlide, state.phase])

  const restart = useCallback(() => {
    focusAfterRestartRef.current = true
    setFrontSide('left')
    const { round, nextRound, usedIds } = makeInitialGame()
    dispatch({ type: 'start', round, nextRound, usedIds, bestStreak: state.bestStreak })
  }, [state.bestStreak])

  useEffect(() => {
    if (state.phase !== 'answering' || !focusAfterRestartRef.current) {
      return
    }
    focusAfterRestartRef.current = false
    leftRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [state.phase])

  // Chrome can drop the first tap when a deck card is still moving through its
  // swap transition. Select on pointerup from the side captured on pointerdown
  // instead of relying on the click target.
  const selectCard = useCallback((side: Side) => {
    unlockAudio()
    setFrontSide('right')
    dispatch({ type: 'guess', side })
  }, [])

  const handleSelect = useCallback(
    (side: Side) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      selectCard(side)
    },
    [selectCard],
  )

  const handleDeckPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false
    if (event.pointerType === 'mouse') {
      return
    }
    // The card may move before pointerup, so remember which side was touched.
    const target = event.target instanceof Element ? event.target.closest('[data-side]') : null
    const side = target?.getAttribute('data-side')
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      side: side === 'left' || side === 'right' ? side : null,
    }
  }, [])

  const handleDeckPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current
      swipeStartRef.current = null
      if (!start || state.phase !== 'answering') {
        return
      }
      const deltaX = event.clientX - start.x
      const deltaY = event.clientY - start.y
      if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressClickRef.current = true
        setFrontSide((side) => (side === 'left' ? 'right' : 'left'))
        return
      }
      // Short taps select directly; suppress the browser's follow-up click so
      // the guess is not handled twice.
      if (start.side && Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
        suppressClickRef.current = true
        selectCard(start.side)
      }
    },
    [selectCard, state.phase],
  )

  const handleDeckPointerCancel = useCallback(() => {
    swipeStartRef.current = null
  }, [])

  const handlePeek = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setFrontSide((side) => (side === 'left' ? 'right' : 'left'))
  }, [])

  if (!state.round) {
    return <GameSkeleton />
  }

  const { left, right } = state.round
  const revealed = state.phase !== 'answering' && state.phase !== 'boot'
  const disabled = state.phase !== 'answering'
  const winner = left.count > right.count ? left : right
  const announcement =
    (state.phase === 'holding' || state.phase === 'gameover') && state.result
      ? `${state.result === 'correct' ? 'Correct' : 'Wrong'}. ${winner.title} has ${formatCount(winner.count)} elements.`
      : ''

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-7 pb-8 sm:px-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-3 py-1 text-muted text-xs tracking-wide shadow-sm">
          <span data-testid="streak">Streak {state.streak}</span>
          <span aria-hidden="true">·</span>
          <span data-testid="best-streak">Best {state.bestStreak}</span>
        </div>
      </div>
      <h1 className="mt-4 text-center font-heading font-semibold text-2xl tracking-tight sm:text-3xl">
        Which has more elements?
      </h1>
      <p className="mt-2 text-center text-muted text-xs sm:text-sm">
        Pick the feature with more elements mapped in OpenStreetMap.
      </p>
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="relative mt-4">
        <div
          className={`max-md:pr-5 ${state.phase === 'gameover' ? 'pointer-events-none opacity-40' : ''}`}
        >
          <div
            className="relative mx-auto w-full max-w-xs max-md:touch-pan-y sm:max-w-sm md:flex md:max-w-none md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-16"
            onPointerCancel={handleDeckPointerCancel}
            onPointerDown={handleDeckPointerDown}
            onPointerUp={handleDeckPointerUp}
          >
            <div aria-hidden="true" className="card-ratio w-full md:hidden" />
            <div
              className={deckClasses('left', frontSide)}
              data-side="left"
              key={`left-${left.id}`}
              ref={leftRef}
            >
              <ElementCard
                count={formatCount(left.count)}
                disabled={disabled}
                element={left}
                hidden={false}
                onSelect={() => handleSelect('left')}
                state={cardState('left', state)}
              />
            </div>
            <div
              className={`card-enter ${deckClasses('right', frontSide)}`}
              data-side="right"
              key={`right-${right.id}`}
              ref={rightRef}
            >
              <ElementCard
                count={revealed ? <CountUp value={right.count} /> : '?'}
                disabled={disabled}
                element={right}
                hidden={!revealed}
                onSelect={() => handleSelect('right')}
                state={cardState('right', state)}
              />
            </div>
            {state.phase === 'answering' ? (
              <button
                aria-label={`Show ${(frontSide === 'left' ? right : left).title}`}
                className="absolute top-0 -right-8 -bottom-4 left-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
                onClick={handlePeek}
                type="button"
              />
            ) : null}
          </div>
        </div>
        {state.phase === 'gameover' ? (
          <GameOver bestStreak={state.bestStreak} onRestart={restart} streak={state.streak} />
        ) : null}
      </div>
    </div>
  )
}
