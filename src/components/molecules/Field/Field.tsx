import type {
  ChangeEvent,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'
import { useId } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Label } from '../../atoms/Label/Label'
import { cn } from '../../../lib/cn'
import './Field.css'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  grow?: boolean
  inputSize?: 'md' | 'lg'
  clearable?: boolean
}

function hasValue(value: InputHTMLAttributes<HTMLInputElement>['value']): boolean {
  if (value === undefined || value === null) return false
  return String(value).length > 0
}

export function Field({
  label,
  id,
  grow = false,
  inputSize = 'md',
  clearable = true,
  className,
  value,
  disabled,
  readOnly,
  onChange,
  ...props
}: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const showClear =
    clearable &&
    !disabled &&
    !readOnly &&
    hasValue(value) &&
    typeof onChange === 'function'

  function handleClear(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!onChange) return

    const nextValue = ''
    onChange({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLInputElement>)
  }

  return (
    <div className={cn('ui-field', grow && 'ui-field--grow', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className={cn('ui-field__control', showClear && 'ui-field__control--clearable')}>
        <Input
          {...props}
          id={fieldId}
          inputSize={inputSize}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={onChange}
          className={cn(showClear && 'ui-input--with-clear')}
        />
        {showClear ? (
          <button
            type="button"
            className="ui-field__clear"
            aria-label="Clear input"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
