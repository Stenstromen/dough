import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import {
  formatDateDisplay,
  parseDateDisplay,
} from '../../../lib/dates'
import { cn } from '../../../lib/cn'
import { Label } from '../../atoms/Label/Label'
import '../../atoms/Input/Input.css'
import './DateField.css'

interface DateFieldProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  clearable?: boolean
}

export function DateField({
  label,
  value,
  onChange,
  id,
  className,
  clearable = false,
}: DateFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const pickerId = `${fieldId}-picker`
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? formatDateDisplay(value)
  const showClear = clearable && Boolean(value || draft?.trim())

  function commitDisplay(raw: string) {
    const trimmed = raw.trim()
    setDraft(null)
    if (!trimmed) {
      if (clearable) onChange('')
      return
    }
    const iso = parseDateDisplay(trimmed)
    if (iso) onChange(iso)
  }

  return (
    <div className={cn('ui-date-field', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div
        className={cn(
          'ui-date-field__control',
          showClear && 'ui-date-field__control--clearable',
        )}
      >
        <input
          id={fieldId}
          className={cn(
            'ui-input',
            'ui-input--md',
            'ui-date-field__text',
            showClear && 'ui-date-field__text--clearable',
          )}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="YYYY / MM / DD"
          value={display}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commitDisplay(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
        />
        {showClear ? (
          <button
            type="button"
            className="ui-date-field__clear"
            aria-label="Clear date"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setDraft(null)
              onChange('')
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
        <div className="ui-date-field__calendar">
          <svg
            viewBox="0 0 20 20"
            width="18"
            height="18"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="2.5"
              y="4.5"
              width="15"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {/*
            iOS Safari ignores programmatic .click() / showPicker() on hidden
            date inputs. Overlay a real date input so the tap is native.
          */}
          <input
            id={pickerId}
            type="date"
            className="ui-date-field__picker"
            value={value}
            aria-label="Open calendar"
            onChange={(event) => {
              const next = event.target.value
              setDraft(null)
              onChange(next)
            }}
          />
        </div>
      </div>
    </div>
  )
}
