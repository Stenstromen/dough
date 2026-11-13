import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Label } from '../../atoms/Label/Label'
import { cn } from '../../../lib/cn'
import './Field.css'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  grow?: boolean
  inputSize?: 'md' | 'lg'
}

export function Field({
  label,
  id,
  grow = false,
  inputSize = 'md',
  className,
  ...props
}: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div className={cn('ui-field', grow && 'ui-field--grow', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} inputSize={inputSize} {...props} />
    </div>
  )
}
