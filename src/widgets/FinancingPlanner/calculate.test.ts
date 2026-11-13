import { describe, expect, it } from 'vitest'
import {
  annuityPayment,
  calculateFinancing,
  resolveMonthlyRate,
  simulatePlan,
  type FinancingInputs,
} from './calculate'

const spreadsheetBase: FinancingInputs = {
  amountFinanced: 16990,
  setupFee: 299,
  monthlyAdminFee: 39,
  targetPayments: 24,
  originalInstallment: 824,
  adjustedInstallment: 3000,
  nominalAnnualRate: 9.99,
  monthlyRateOverride: null,
}

describe('resolveMonthlyRate', () => {
  it('derives monthly rate from nominal annual rate', () => {
    expect(resolveMonthlyRate(spreadsheetBase)).toBeCloseTo(0.008325, 10)
  })

  it('prefers an explicit monthly override', () => {
    expect(
      resolveMonthlyRate({
        ...spreadsheetBase,
        monthlyRateOverride: 0.9,
      }),
    ).toBeCloseTo(0.009, 10)
  })
})

describe('annuityPayment', () => {
  it('returns zero for invalid inputs', () => {
    expect(annuityPayment(0, 0.01, 12)).toBe(0)
    expect(annuityPayment(1000, 0.01, 0)).toBe(0)
  })

  it('splits evenly when interest is zero', () => {
    expect(annuityPayment(1200, 0, 12)).toBe(100)
  })

  it('matches the spreadsheet loan portion before admin fee', () => {
    const monthlyRate = 0.0999 / 12
    expect(annuityPayment(16990, monthlyRate, 24)).toBeCloseTo(783.9238836, 5)
  })
})

describe('simulatePlan', () => {
  it('clears the original spreadsheet plan in 24 payments', () => {
    const plan = simulatePlan({
      principal: 16990,
      monthlyRate: 0.0999 / 12,
      adminFee: 39,
      installment: 824,
      setupFee: 299,
      targetPayments: 24,
    })

    expect(plan.cleared).toBe(true)
    expect(plan.paymentsToClear).toBe(24)
    expect(plan.totalInterest).toBe(1821.54)
    expect(plan.totalAdminFees).toBe(936)
    expect(plan.totalRepaidInclSetup).toBe(20046.54)
    expect(plan.financingCost).toBe(3056.54)
    expect(plan.balanceAfterTargetTerm).toBe(0)
    expect(plan.balanceAfterMaxTerm).toBe(0)
    expect(plan.schedule).toHaveLength(24)
  })

  it('clears a high adjusted installment faster', () => {
    const plan = simulatePlan({
      principal: 16990,
      monthlyRate: 0.0999 / 12,
      adminFee: 39,
      installment: 3000,
      setupFee: 299,
      targetPayments: 24,
    })

    expect(plan.paymentsToClear).toBe(6)
    expect(plan.totalInterest).toBe(492.63)
    expect(plan.totalAdminFees).toBe(234)
    expect(plan.totalRepaidInclSetup).toBe(18015.63)
    expect(plan.financingCost).toBe(1025.63)
  })
})

describe('calculateFinancing', () => {
  it('returns null when required inputs are missing', () => {
    expect(
      calculateFinancing({
        ...spreadsheetBase,
        amountFinanced: 0,
      }),
    ).toBeNull()
    expect(
      calculateFinancing({
        ...spreadsheetBase,
        originalInstallment: 0,
      }),
    ).toBeNull()
  })

  it('matches the spreadsheet comparison totals', () => {
    const result = calculateFinancing(spreadsheetBase)

    expect(result).not.toBeNull()
    expect(result!.monthlyRatePercent).toBeCloseTo(0.8325, 6)
    expect(result!.installmentForTargetTerm).toBeCloseTo(822.92, 2)
    expect(result!.original.totalRepaidInclSetup).toBe(20046.54)
    expect(result!.adjusted?.totalRepaidInclSetup).toBe(18015.63)
    expect(result!.savings).toBe(2030.91)
  })

  it('treats adjusted installment as optional', () => {
    const result = calculateFinancing({
      ...spreadsheetBase,
      adjustedInstallment: null,
    })

    expect(result).not.toBeNull()
    expect(result!.adjusted).toBeNull()
    expect(result!.savings).toBeNull()
    expect(result!.original.paymentsToClear).toBe(24)
  })
})
