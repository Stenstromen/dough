import type { ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
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
}

export function DateField({
  label,
  value,
  onChange,
  id,
  className,
}: DateFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const pickerRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? formatDateDisplay(value)

  function commitDisplay(raw: string) {
    const iso = parseDateDisplay(raw)
    setDraft(null)
    if (iso) {
      onChange(iso)
    }
  }

  function openPicker() {
    const input = pickerRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      void input.showPicker()
      return
    }
    input.click()
  }

  return (
    <div className={cn('ui-date-field', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="ui-date-field__control">
        <input
          id={fieldId}
          className="ui-input ui-input--md ui-date-field__text"
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
        <button
          type="button"
          className="ui-date-field__calendar"
          aria-label="Open calendar"
          onClick={openPicker}
        >
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
        </button>
        <input
          ref={pickerRef}
          type="date"
          className="ui-date-field__picker"
          value={value}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            setDraft(null)
            onChange(event.target.value)
          }}
        />
      </div>
    </div>
  )
}
