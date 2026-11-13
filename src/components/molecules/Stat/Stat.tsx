import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Stat.css'

interface StatProps {
  label: ReactNode
  value: ReactNode
  className?: string
}

export function Stat({ label, value, className }: StatProps) {
  return (
    <div className={cn('ui-stat', className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

interface StatGroupProps {
  children: ReactNode
  columns?: 1 | 2
  className?: string
}

export function StatGroup({
  children,
  columns = 2,
  className,
}: StatGroupProps) {
  return (
    <dl
      className={cn(
        'ui-stat-group',
        columns === 2 && 'ui-stat-group--cols-2',
        className,
      )}
    >
      {children}
    </dl>
  )
}
