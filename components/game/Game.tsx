'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { CountUp } from '@/components/game/CountUp'
import type { CardState } from '@/components/game/ElementCard'
import { ElementCard } from '@/components/game/ElementCard'
import { GameOver } from '@/components/game/GameOver'
import { elements } from '@/lib/data.ts'
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

function GameSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mx-auto h-3 w-32 animate-pulse rounded bg-subtle" />
      <div className="mx-auto mt-4 h-8 w-72 animate-pulse rounded bg-subtle" />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border border-border bg-subtle" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-subtle" />
      </div>
    </div>
  )
}

export function Game() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const startedRef = useRef(false)
  const focusAfterRestartRef = useRef(false)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
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
    if (state.phase !== 'gameover' || state.streak <= state.bestStreak) {
      return
    }
    writeBestStreak(state.streak)
    dispatch({ type: 'set-best', bestStreak: state.streak })
  }, [state.bestStreak, state.phase, state.streak])

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
    dispatch({ type: 'commit', nextRound, usedIds })
  }, [state.nextRound, state.usedIds])

  useEffect(() => {
    if (state.phase !== 'sliding') {
      return
    }
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

    const leftRect = leftElement.getBoundingClientRect()
    const rightRect = rightElement.getBoundingClientRect()
    const deltaX = leftRect.left - rightRect.left
    const deltaY = leftRect.top - rightRect.top
    let cancelled = false

    const rightAnimation = rightElement.animate(
      [{ transform: 'translate(0, 0)' }, { transform: `translate(${deltaX}px, ${deltaY}px)` }],
      { duration: SLIDE_MS, easing: 'ease-in-out', fill: 'forwards' },
    )
    const leftAnimation = leftElement.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: SLIDE_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    })

    Promise.all([rightAnimation.finished, leftAnimation.finished])
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
      rightAnimation.cancel()
      leftAnimation.cancel()
    }
  }, [commitSlide, state.phase])

  const restart = useCallback(() => {
    focusAfterRestartRef.current = true
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

  const handleSelect = useCallback((side: Side) => {
    dispatch({ type: 'guess', side })
  }, [])

  if (!state.round) {
    return <GameSkeleton />
  }

  const { left, right } = state.round
  const revealed = state.phase !== 'answering' && state.phase !== 'boot'
  const disabled = state.phase !== 'answering'
  const winner = left.count > right.count ? left : right
  const showVerdict =
    state.phase === 'holding' || state.phase === 'sliding' || state.phase === 'gameover'
  const announcement =
    (state.phase === 'holding' || state.phase === 'gameover') && state.result
      ? `${state.result === 'correct' ? 'Correct' : 'Wrong'}. ${winner.title} has ${formatCount(winner.count)} elements.`
      : ''

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="flex items-center justify-center gap-3 text-muted text-xs tracking-wide">
        <span data-testid="streak">Streak {state.streak}</span>
        <span aria-hidden="true">·</span>
        <span data-testid="best-streak">Best {state.bestStreak}</span>
      </div>
      <h1 className="mt-4 text-center font-semibold text-2xl tracking-tight sm:text-3xl">
        Which has more elements?
      </h1>
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div aria-hidden="true" className="mt-3 flex h-6 items-center justify-center">
        {showVerdict && state.result ? (
          <span
            className={`font-medium text-sm ${state.result === 'correct' ? 'text-success' : 'text-danger'}`}
            data-testid="verdict"
          >
            {state.result === 'correct' ? 'Correct!' : 'Wrong.'}
          </span>
        ) : null}
      </div>

      <div className="relative mt-6">
        <div className={state.phase === 'gameover' ? 'pointer-events-none opacity-40' : ''}>
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            <div className="relative h-full" data-side="left" key={`left-${left.id}`} ref={leftRef}>
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
              className="card-enter relative h-full"
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
          </div>
        </div>
        {state.phase === 'gameover' ? (
          <GameOver bestStreak={state.bestStreak} onRestart={restart} streak={state.streak} />
        ) : null}
      </div>
    </div>
  )
}
