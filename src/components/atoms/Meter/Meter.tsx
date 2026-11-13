import { cn } from '../../../lib/cn'
import type { BadgeTone } from '../Badge/Badge'
import './Meter.css'

interface MeterProps {
  value: number
  tone?: Exclude<BadgeTone, 'neutral'>
  className?: string
}

export function Meter({ value, tone = 'good', className }: MeterProps) {
  const clamped = Math.max(0, Math.min(value, 100))

  return (
    <div className={cn('ui-meter', className)} aria-hidden="true">
      <div
        className={cn('ui-meter__fill', `ui-meter__fill--${tone}`)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
