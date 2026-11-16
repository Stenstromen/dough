import { describe, expect, it } from 'vitest'
import { adjustSum, calculateDayBudget, isExpenseDue } from './calculate'

describe('isExpenseDue', () => {
  const today = new Date(2026, 10, 16)

  it('is false when no due date is set', () => {
    expect(
      isExpenseDue({ id: '1', name: 'Bill', amount: 100 }, today),
    ).toBe(false)
  })

  it('is true when due today or earlier', () => {
    expect(
      isExpenseDue(
        { id: '1', name: 'Bill', amount: 100, dueDate: new Date(2026, 10, 16) },
        today,
      ),
    ).toBe(true)
    expect(
      isExpenseDue(
        { id: '1', name: 'Bill', amount: 100, dueDate: new Date(2026, 10, 10) },
        today,
      ),
    ).toBe(true)
  })

  it('is false when due in the future', () => {
    expect(
      isExpenseDue(
        { id: '1', name: 'Bill', amount: 100, dueDate: new Date(2026, 10, 20) },
        today,
      ),
    ).toBe(false)
  })
})

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

  it('subtracts only upcoming expenses from the daily plan', () => {
    const result = calculateDayBudget({
      sum: 10_000,
      startDate: new Date(2026, 10, 16),
      payday: new Date(2026, 10, 25),
      referenceDate: new Date(2026, 10, 16),
      expenses: [
        {
          id: '1',
          name: 'Already due',
          amount: 2_000,
          dueDate: new Date(2026, 10, 15),
        },
        {
          id: '2',
          name: 'Upcoming',
          amount: 500,
          dueDate: new Date(2026, 10, 20),
        },
        { id: '3', name: 'No date', amount: 1_000 },
      ],
    })

    expect(result).toMatchObject({
      dueExpenseTotal: 2_000,
      dueExpenseCount: 1,
      upcomingExpenseTotal: 1_500,
      available: 8_500,
      daysRemaining: 9,
      dailyBudget: 8_500 / 9,
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
