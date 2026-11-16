import { describe, expect, it } from 'vitest'
import {
  calendarDaysBetween,
  defaultPayday,
  formatDateDisplay,
  isOnOrBefore,
  parseDateDisplay,
  parseDateInput,
  toDateInputValue,
} from './dates'

describe('dates', () => {
  it('round-trips ISO date input values', () => {
    const date = new Date(2026, 10, 15)
    expect(toDateInputValue(date)).toBe('2026-11-15')
    expect(parseDateInput('2026-11-15')).toEqual(date)
    expect(parseDateInput('not-a-date')).toBeNull()
  })

  it('formats and parses YYYY / MM / DD display values', () => {
    expect(formatDateDisplay('2026-11-15')).toBe('2026 / 11 / 15')
    expect(parseDateDisplay('2026 / 11 / 15')).toBe('2026-11-15')
    expect(parseDateDisplay('2026/11/5')).toBe('2026-11-05')
    expect(parseDateDisplay('nope')).toBeNull()
  })

  it('defaults payday to the 25th, rolling forward when needed', () => {
    expect(defaultPayday(new Date(2026, 10, 10))).toEqual(
      new Date(2026, 10, 25),
    )
    expect(defaultPayday(new Date(2026, 10, 26))).toEqual(
      new Date(2026, 11, 25),
    )
  })

  it('counts calendar days between dates', () => {
    expect(
      calendarDaysBetween(new Date(2026, 10, 20), new Date(2026, 10, 25)),
    ).toBe(5)
  })

  it('checks whether a date is on or before a reference day', () => {
    const today = new Date(2026, 10, 16)
    expect(isOnOrBefore(new Date(2026, 10, 15), today)).toBe(true)
    expect(isOnOrBefore(new Date(2026, 10, 16), today)).toBe(true)
    expect(isOnOrBefore(new Date(2026, 10, 17), today)).toBe(false)
  })
})
