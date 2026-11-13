import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Button.css'

type ButtonVariant = 'ghost' | 'accent' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({
  variant = 'ghost',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('ui-button', `ui-button--${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  )
}
