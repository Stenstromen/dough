import { describe, expect, it } from 'vitest'
import {
  allocateBudget503020,
  NEEDS_SHARE,
  SAVINGS_SHARE,
  WANTS_SHARE,
} from './calculate'

describe('allocateBudget503020', () => {
  it('returns null for invalid income', () => {
    expect(allocateBudget503020(0)).toBeNull()
    expect(allocateBudget503020(-100)).toBeNull()
  })

  it('splits take-home pay into 50/30/20', () => {
    const result = allocateBudget503020(40_000)

    expect(result).not.toBeNull()
    expect(result!.allocations).toHaveLength(3)
    expect(result!.allocations[0]).toMatchObject({
      id: 'needs',
      share: NEEDS_SHARE,
      amount: 20_000,
    })
    expect(result!.allocations[1]).toMatchObject({
      id: 'wants',
      share: WANTS_SHARE,
      amount: 12_000,
    })
    expect(result!.allocations[2]).toMatchObject({
      id: 'savings',
      share: SAVINGS_SHARE,
      amount: 8_000,
    })
    expect(
      result!.allocations.reduce((sum, bucket) => sum + bucket.amount, 0),
    ).toBe(40_000)
  })
})
