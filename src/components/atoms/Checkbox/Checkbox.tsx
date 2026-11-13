import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Checkbox.css'

type CheckboxTone = 'default' | 'muted'

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  tone?: CheckboxTone
}

export function Checkbox({
  id,
  label,
  tone = 'default',
  className,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={cn('ui-checkbox', `ui-checkbox--${tone}`, className)}
      htmlFor={id}
    >
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
