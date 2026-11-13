import type { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import '../Text/Text.css'
import './Label.css'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn('ui-text', 'ui-text--label', 'ui-label', className)} {...props}>
      {children}
    </label>
  )
}
