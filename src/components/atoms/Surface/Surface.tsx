import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Surface.css'

type SurfaceVariant = 'panel' | 'result' | 'plain'

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section'
  variant?: SurfaceVariant
  ready?: boolean
  children: ReactNode
}

export function Surface({
  as: Tag = 'div',
  variant = 'panel',
  ready = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Tag
      className={cn(
        'ui-surface',
        `ui-surface--${variant}`,
        ready && 'ui-surface--ready',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
