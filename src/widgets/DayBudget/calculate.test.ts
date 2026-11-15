import { describe, expect, it } from 'vitest'
import { adjustSum, calculateDayBudget } from './calculate'

describe('calculateDayBudget', () => {
  it('returns null for invalid sums', () => {
    expect(
      calculateDayBudget({
        sum: -1,
        startDate: new Date(2026, 10, 20),
        payday: new Date(2026, 10, 25),
        expenses: [],
      }),
    ).toBeNull()
  })

  it('subtracts known expenses and divides by days until payday', () => {
    const result = calculateDayBudget({
      sum: 10_000,
      startDate: new Date(2026, 10, 20),
      payday: new Date(2026, 10, 25),
      expenses: [
        { id: '1', name: 'Rent share', amount: 2_000 },
        { id: '2', name: 'Transit', amount: 500 },
      ],
    })

    expect(result).toEqual({
      expenseTotal: 2_500,
      available: 7_500,
      daysRemaining: 5,
      dailyBudget: 1_500,
      paydayIsPast: false,
    })
  })

  it('uses at least one day when payday is today', () => {
    const day = new Date(2026, 10, 25)
    const result = calculateDayBudget({
      sum: 900,
      startDate: day,
      payday: day,
      expenses: [],
    })

    expect(result?.daysRemaining).toBe(1)
    expect(result?.dailyBudget).toBe(900)
    expect(result?.paydayIsPast).toBe(false)
  })

  it('flags a payday in the past but still computes with one day', () => {
    const result = calculateDayBudget({
      sum: 500,
      startDate: new Date(2026, 10, 26),
      payday: new Date(2026, 10, 25),
      expenses: [],
    })

    expect(result?.paydayIsPast).toBe(true)
    expect(result?.daysRemaining).toBe(1)
    expect(result?.dailyBudget).toBe(500)
  })
})

describe('adjustSum', () => {
  it('applies deltas and never goes below zero', () => {
    expect(adjustSum(100, -10)).toBe(90)
    expect(adjustSum(50, -100)).toBe(0)
    expect(adjustSum(100, 1000)).toBe(1100)
  })
})
