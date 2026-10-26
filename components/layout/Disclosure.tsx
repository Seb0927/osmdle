import type { ReactNode } from 'react'

interface DisclosureProps {
  summary: ReactNode
  children: ReactNode
  className?: string
}

export function Disclosure({ summary, children, className }: DisclosureProps) {
  return (
    <details className={`rounded-lg border border-border p-4 ${className ?? ''}`}>
      <summary className="cursor-pointer font-medium text-sm">{summary}</summary>
      {children}
    </details>
  )
}
