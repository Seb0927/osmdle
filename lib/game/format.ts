const countFormatter = new Intl.NumberFormat('en-US')

export function formatCount(count: number): string {
  return countFormatter.format(count)
}

export function formatSnapshot(snapshot: string): string {
  const [yearText, monthText] = snapshot.split('-')
  const year = Number(yearText)
  const month = Number(monthText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return snapshot
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  return 1 - (1 - clamped) ** 3
}

export function countAtTime(
  from: number,
  to: number,
  elapsedMs: number,
  durationMs: number,
): number {
  if (durationMs <= 0) {
    return to
  }

  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs))
  return Math.round(from + (to - from) * easeOutCubic(progress))
}
