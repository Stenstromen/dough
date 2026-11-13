import type { InputHTMLAttributes } from 'react'
import { cn } from '../../../lib/cn'
import './Input.css'

type InputSize = 'md' | 'lg'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
}

export function Input({ className, inputSize = 'md', ...props }: InputProps) {
  return (
    <input
      className={cn('ui-input', `ui-input--${inputSize}`, className)}
      {...props}
    />
  )
}
