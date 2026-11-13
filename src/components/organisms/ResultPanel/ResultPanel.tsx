import type { ReactNode } from 'react'
import { Surface } from '../../atoms/Surface/Surface'
import { Text } from '../../atoms/Text/Text'
import { cn } from '../../../lib/cn'
import './ResultPanel.css'

interface ResultPanelProps {
  ready: boolean
  placeholder: ReactNode
  children: ReactNode
  className?: string
}

export function ResultPanel({
  ready,
  placeholder,
  children,
  className,
}: ResultPanelProps) {
  return (
    <Surface
      variant="result"
      ready={ready}
      aria-live="polite"
      className={cn('ui-result-panel', className)}
    >
      {ready ? children : <Text variant="muted">{placeholder}</Text>}
    </Surface>
  )
}
