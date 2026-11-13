import { describe, expect, it } from 'vitest'
import { buildSchedule, type LoanPartInput } from './schedule'

const from = new Date(2026, 0, 1)

describe('buildSchedule', () => {
  it('projects interest-only months when amortization is off', () => {
    const parts: LoanPartInput[] = [
      {
        id: 'a',
        name: 'Part A',
        balance: 1_200_000,
        annualRate: 3.6,
        amortize: false,
        monthlyAmortization: 0,
      },
    ]

    const schedule = buildSchedule(parts, 3, from)
    const monthlyInterest = (1_200_000 * 0.036) / 12

    expect(schedule).toHaveLength(3)
    expect(schedule[0].label).toMatch(/2026/)
    expect(schedule[0].parts[0].interest).toBeCloseTo(monthlyInterest, 8)
    expect(schedule[0].parts[0].amortization).toBe(0)
    expect(schedule[0].parts[0].closingBalance).toBe(1_200_000)
    expect(schedule[2].parts[0].closingBalance).toBe(1_200_000)
  })

  it('reduces balances when amortizing and caps at remaining principal', () => {
    const parts: LoanPartInput[] = [
      {
        id: 'a',
        name: 'Part A',
        balance: 10_000,
        annualRate: 12,
        amortize: true,
        monthlyAmortization: 4_000,
      },
    ]

    const schedule = buildSchedule(parts, 4, from)

    expect(schedule[0].parts[0].amortization).toBe(4_000)
    expect(schedule[0].parts[0].closingBalance).toBe(6_000)
    expect(schedule[1].parts[0].closingBalance).toBe(2_000)
    expect(schedule[2].parts[0].amortization).toBe(2_000)
    expect(schedule[2].parts[0].closingBalance).toBe(0)
    expect(schedule[3].parts[0].interest).toBe(0)
    expect(schedule[3].parts[0].amortization).toBe(0)
  })

  it('totals interest, amortization, and payment across parts', () => {
    const parts: LoanPartInput[] = [
      {
        id: 'a',
        name: 'Part A',
        balance: 100_000,
        annualRate: 6,
        amortize: true,
        monthlyAmortization: 1_000,
      },
      {
        id: 'b',
        name: 'Part B',
        balance: 50_000,
        annualRate: 3,
        amortize: false,
        monthlyAmortization: 0,
      },
    ]

    const [first] = buildSchedule(parts, 1, from)
    const expectedInterest =
      (100_000 * 0.06) / 12 + (50_000 * 0.03) / 12

    expect(first.totalInterest).toBeCloseTo(expectedInterest, 8)
    expect(first.totalAmortization).toBe(1_000)
    expect(first.totalPayment).toBeCloseTo(expectedInterest + 1_000, 8)
    expect(first.parts).toHaveLength(2)
  })
})
