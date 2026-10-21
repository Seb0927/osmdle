import type { ReactNode } from 'react'

interface ContentCardProps {
  children: ReactNode
}

export function ContentCard({ children }: ContentCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      {children}
    </div>
  )
}
