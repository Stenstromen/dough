export const MAX_SCHEDULE_MONTHS = 600
export const DEFAULT_VISIBLE_MONTHS = 12

export interface FinancingInputs {
  amountFinanced: number
  setupFee: number
  monthlyAdminFee: number
  targetPayments: number
  originalInstallment: number
  adjustedInstallment: number | null
  nominalAnnualRate: number
  monthlyRateOverride: number | null
}

export interface ScheduleRow {
  month: number
  interest: number
  principal: number
  adminFee: number
  payment: number
  remaining: number
}

export interface PlanSummary {
  monthlyInstallment: number
  paymentsToClear: number
  totalInterest: number
  totalAdminFees: number
  totalRepaidInclSetup: number
  financingCost: number
  balanceAfterTargetTerm: number
  balanceAfterMaxTerm: number
  cleared: boolean
  schedule: ScheduleRow[]
}

export interface FinancingResult {
  monthlyRatePercent: number
  annualRateUsedPercent: number
  installmentForTargetTerm: number
  original: PlanSummary
  adjusted: PlanSummary | null
  savings: number | null
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Standard annuity payment for the financed amount (excludes admin fee). */
export function annuityPayment(
  principal: number,
  monthlyRate: number,
  periods: number,
): number {
  if (principal <= 0 || periods <= 0) return 0
  if (monthlyRate === 0) return principal / periods
  const growth = (1 + monthlyRate) ** periods
  return (principal * monthlyRate * growth) / (growth - 1)
}

export function resolveMonthlyRate(inputs: FinancingInputs): number {
  if (inputs.monthlyRateOverride !== null) {
    return inputs.monthlyRateOverride / 100
  }
  return inputs.nominalAnnualRate / 100 / 12
}

export function simulatePlan(options: {
  principal: number
  monthlyRate: number
  adminFee: number
  installment: number
  setupFee: number
  targetPayments: number
  maxMonths?: number
}): PlanSummary {
  const {
    principal,
    monthlyRate,
    adminFee,
    installment,
    setupFee,
    targetPayments,
    maxMonths = MAX_SCHEDULE_MONTHS,
  } = options

  let balance = principal
  let totalInterest = 0
  let totalAdminFees = 0
  let balanceAfterTargetTerm = principal
  const schedule: ScheduleRow[] = []

  for (let month = 1; month <= maxMonths && balance > 0.004; month += 1) {
    const interest = roundMoney(balance * monthlyRate)
    const maxPrincipal = balance
    let principalPay = roundMoney(installment - interest - adminFee)
    let payment = installment
    let fee = adminFee

    if (principalPay >= maxPrincipal) {
      principalPay = maxPrincipal
      payment = roundMoney(principalPay + interest + fee)
    } else if (principalPay < 0) {
      // Payment does not cover interest + fee; apply payment to interest first.
      principalPay = 0
      const covered = Math.min(installment, interest + fee)
      payment = covered
      fee = Math.min(adminFee, Math.max(0, covered - interest))
    }

    balance = roundMoney(Math.max(0, balance - principalPay))
    totalInterest = roundMoney(totalInterest + interest)
    totalAdminFees = roundMoney(totalAdminFees + fee)

    schedule.push({
      month,
      interest,
      principal: principalPay,
      adminFee: fee,
      payment,
      remaining: balance,
    })

    if (month === targetPayments) {
      balanceAfterTargetTerm = balance
    }
  }

  if (schedule.length < targetPayments) {
    balanceAfterTargetTerm = 0
  }

  const paymentsToClear = schedule.length
  const cleared = balance <= 0.004
  const balanceAfterMaxTerm = cleared ? 0 : balance
  const totalRepaidInclSetup = roundMoney(
    schedule.reduce((sum, row) => sum + row.payment, 0) + setupFee,
  )
  const financingCost = roundMoney(totalInterest + totalAdminFees + setupFee)

  return {
    monthlyInstallment: installment,
    paymentsToClear,
    totalInterest,
    totalAdminFees,
    totalRepaidInclSetup,
    financingCost,
    balanceAfterTargetTerm: cleared && schedule.length <= targetPayments
      ? 0
      : balanceAfterTargetTerm,
    balanceAfterMaxTerm,
    cleared,
    schedule,
  }
}

export function calculateFinancing(inputs: FinancingInputs): FinancingResult | null {
  if (
    inputs.amountFinanced <= 0 ||
    inputs.targetPayments <= 0 ||
    inputs.originalInstallment <= 0
  ) {
    return null
  }

  const monthlyRate = resolveMonthlyRate(inputs)
  const monthlyRatePercent = monthlyRate * 100
  const annualRateUsedPercent = monthlyRatePercent * 12
  const baseAnnuity = annuityPayment(
    inputs.amountFinanced,
    monthlyRate,
    inputs.targetPayments,
  )
  const installmentForTargetTerm = roundMoney(
    baseAnnuity + inputs.monthlyAdminFee,
  )

  const shared = {
    principal: inputs.amountFinanced,
    monthlyRate,
    adminFee: inputs.monthlyAdminFee,
    setupFee: inputs.setupFee,
    targetPayments: inputs.targetPayments,
  }

  const original = simulatePlan({
    ...shared,
    installment: inputs.originalInstallment,
  })

  const adjusted =
    inputs.adjustedInstallment !== null && inputs.adjustedInstallment > 0
      ? simulatePlan({
          ...shared,
          installment: inputs.adjustedInstallment,
        })
      : null

  const savings =
    adjusted === null
      ? null
      : roundMoney(original.totalRepaidInclSetup - adjusted.totalRepaidInclSetup)

  return {
    monthlyRatePercent,
    annualRateUsedPercent,
    installmentForTargetTerm,
    original,
    adjusted,
    savings,
  }
}
