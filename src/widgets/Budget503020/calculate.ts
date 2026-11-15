export const NEEDS_SHARE = 0.5
export const WANTS_SHARE = 0.3
export const SAVINGS_SHARE = 0.2

export type BudgetBucketId = 'needs' | 'wants' | 'savings'

export interface BudgetBucket {
  id: BudgetBucketId
  label: string
  share: number
  percentLabel: string
  description: string
  note: string
}

export const BUDGET_BUCKETS: BudgetBucket[] = [
  {
    id: 'needs',
    label: 'Needs',
    share: NEEDS_SHARE,
    percentLabel: '50%',
    description:
      'Housing, groceries, utilities, transport, minimum loan payments.',
    note: 'Cover essentials first. If needs regularly exceed half of take-home pay, trim fixed costs or revisit income.',
  },
  {
    id: 'wants',
    label: 'Wants',
    share: WANTS_SHARE,
    percentLabel: '30%',
    description:
      'Restaurants, entertainment, hobbies, discretionary purchases.',
    note: 'Lifestyle spending you choose. Easy to cut first when you need more room for savings or debt.',
  },
  {
    id: 'savings',
    label: 'Savings',
    share: SAVINGS_SHARE,
    percentLabel: '20%',
    description:
      'Emergency savings, investments, extra debt repayments.',
    note: 'Pay yourself next. Build a cash buffer, then invest or accelerate debt beyond the minimums.',
  },
]

export interface BudgetAllocation {
  id: BudgetBucketId
  label: string
  share: number
  percentLabel: string
  description: string
  note: string
  amount: number
}

export interface Budget503020Result {
  income: number
  allocations: BudgetAllocation[]
}

export function allocateBudget503020(
  income: number,
): Budget503020Result | null {
  if (!Number.isFinite(income) || income <= 0) {
    return null
  }

  return {
    income,
    allocations: BUDGET_BUCKETS.map((bucket) => ({
      ...bucket,
      amount: income * bucket.share,
    })),
  }
}
