import type { ElementType, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Stack.css'

type StackGap = 'sm' | 'md' | 'lg' | 'xl'
type StackColumns = 1 | 2 | 'auto-2' | 'balance-2' | 'part-grid' | 'form-2'

interface StackProps {
  as?: ElementType
  gap?: StackGap
  columns?: StackColumns
  className?: string
  children: ReactNode
  [key: string]: unknown
}

export function Stack({
  as: Tag = 'div',
  gap = 'md',
  columns = 1,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <Tag
      className={cn(
        'ui-stack',
        `ui-stack--gap-${gap}`,
        columns !== 1 && `ui-stack--cols-${columns}`,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
