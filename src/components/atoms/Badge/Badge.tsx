import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Badge.css'

export type BadgeTone = 'excellent' | 'good' | 'elevated' | 'high' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <p className={cn('ui-badge', `ui-badge--${tone}`, className)} {...props}>
      {children}
    </p>
  )
}
