'use client'

import { useEffect, useState } from 'react'
import { playSound } from '@/lib/game/audio.ts'
import { COUNT_UP_MS } from '@/lib/game/config.ts'
import { countAtTime, formatCount } from '@/lib/game/format.ts'

interface CountUpProps {
  value: number
  durationMs?: number
}

export function CountUp({ value, durationMs = COUNT_UP_MS }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || durationMs <= 0) {
      setDisplayValue(value)
      return
    }

    const sound = playSound('count-up')

    let frame = 0
    const startedAt = performance.now()

    function tick(now: number) {
      const elapsed = now - startedAt
      if (elapsed >= durationMs) {
        setDisplayValue(value)
        return
      }

      setDisplayValue(countAtTime(0, value, elapsed, durationMs))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      sound?.stop()
    }
  }, [durationMs, value])

  return <span className="tabular-nums">{formatCount(displayValue)}</span>
}
