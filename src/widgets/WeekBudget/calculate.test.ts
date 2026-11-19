import { describe, expect, it } from 'vitest'
import {
  calculate7525,
  calculateWeekBudget,
  clampPeriodDays,
} from './calculate'

describe('clampPeriodDays', () => {
  it('defaults invalid values to 7 and clamps to 1–14', () => {
    expect(clampPeriodDays(Number.NaN)).toBe(7)
    expect(clampPeriodDays(0)).toBe(1)
    expect(clampPeriodDays(20)).toBe(14)
    expect(clampPeriodDays(7.4)).toBe(7)
  })
})

describe('calculateWeekBudget', () => {
  it('multiplies the daily rate by the period, capped by days remaining', () => {
    const result = calculateWeekBudget({
      sum: 9_000,
      startDate: new Date(2026, 10, 16),
      payday: new Date(2026, 10, 25),
      referenceDate: new Date(2026, 10, 16),
      periodDays: 7,
      expenses: [
        {
          id: '1',
          name: 'Upcoming',
          amount: 900,
          dueDate: new Date(2026, 10, 20),
        },
      ],
    })

    // 9 days remaining, available 8100 → 900/day → 7-day week = 6300
    expect(result).toMatchObject({
      daysRemaining: 9,
      available: 8_100,
      dailyBudget: 900,
      periodDays: 7,
      weekBudget: 6_300,
      upcomingExpenseTotal: 900,
    })
    expect(result?.periodEndDate).toEqual(new Date(2026, 10, 22))
  })

  it('shortens the period when fewer days remain until payday', () => {
    const result = calculateWeekBudget({
      sum: 1_000,
      startDate: new Date(2026, 10, 23),
      payday: new Date(2026, 10, 25),
      periodDays: 7,
      expenses: [],
    })

    expect(result?.daysRemaining).toBe(2)
    expect(result?.periodDays).toBe(2)
    expect(result?.dailyBudget).toBe(500)
    expect(result?.weekBudget).toBe(1_000)
    expect(result?.periodEndDate).toEqual(new Date(2026, 10, 24))
  })
})

describe('calculate7525', () => {
  it('derives spending from start/end balance and reserved expenses', () => {
    // Start 8538, end 2130, expenses 908 → spending 5500
    // Weekly budget 7630 → unspent 2130 → 532.5 / 1597.5
    expect(
      calculate7525({
        weeklyBudget: 7_630,
        availableSum: 8_538,
        endBalance: 2_130,
        upcomingExpenseTotal: 908,
      }),
    ).toEqual({
      weeklyBudget: 7_630,
      availableSum: 8_538,
      endBalance: 2_130,
      upcomingExpenseTotal: 908,
      actualSpending: 5_500,
      unspentAllowance: 2_130,
      savingsTransfer: 532.5,
      retainedSurplus: 1_597.5,
      hasUnspent: true,
    })
  })

  it('returns no split when there is nothing unspent', () => {
    expect(
      calculate7525({
        weeklyBudget: 7_630,
        availableSum: 8_538,
        endBalance: 0,
        upcomingExpenseTotal: 908,
      }),
    ).toMatchObject({
      actualSpending: 7_630,
      unspentAllowance: 0,
      savingsTransfer: 0,
      retainedSurplus: 0,
      hasUnspent: false,
    })
  })

  it('returns null for invalid amounts', () => {
    expect(
      calculate7525({
        weeklyBudget: -1,
        availableSum: 100,
        endBalance: 50,
        upcomingExpenseTotal: 0,
      }),
    ).toBeNull()
    expect(
      calculate7525({
        weeklyBudget: 100,
        availableSum: 100,
        endBalance: Number.NaN,
        upcomingExpenseTotal: 0,
      }),
    ).toBeNull()
  })
})
