export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/** Display format: YYYY / MM / DD */
export function formatDateDisplay(isoOrDate: string | Date): string {
  const date =
    typeof isoOrDate === 'string' ? parseDateInput(isoOrDate) : isoOrDate
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year} / ${month} / ${day}`
}

/** Accepts YYYY / MM / DD, YYYY-MM-DD, and similar separators. */
export function parseDateDisplay(raw: string): string | null {
  const cleaned = raw.replace(/\s/g, '')
  const match = cleaned.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return toDateInputValue(date)
}

/** 25th of this month, or next month if that date has already passed. */
export function defaultPayday(from = new Date()): Date {
  const today = startOfDay(from)
  const candidate = new Date(today.getFullYear(), today.getMonth(), 25)
  if (candidate < today) {
    return new Date(today.getFullYear(), today.getMonth() + 1, 25)
  }
  return candidate
}

export function calendarDaysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime()
  return Math.round(ms / 86_400_000)
}
