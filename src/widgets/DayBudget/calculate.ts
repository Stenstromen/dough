import { calendarDaysBetween } from '../../lib/dates'

export interface KnownExpense {
  id: string
  name: string
  amount: number
}

export interface DayBudgetInput {
  sum: number
  startDate: Date
  payday: Date
  expenses: KnownExpense[]
}

export interface DayBudgetResult {
  expenseTotal: number
  available: number
  daysRemaining: number
  dailyBudget: number
  paydayIsPast: boolean
}

export function calculateDayBudget(
  input: DayBudgetInput,
): DayBudgetResult | null {
  if (!Number.isFinite(input.sum) || input.sum < 0) {
    return null
  }

  const expenseTotal = input.expenses.reduce(
    (total, expense) => total + Math.max(0, expense.amount),
    0,
  )
  const available = input.sum - expenseTotal
  const rawDays = calendarDaysBetween(input.startDate, input.payday)
  const paydayIsPast = rawDays < 0
  const daysRemaining = Math.max(1, rawDays)
  const dailyBudget = available / daysRemaining

  return {
    expenseTotal,
    available,
    daysRemaining,
    dailyBudget,
    paydayIsPast,
  }
}

export function adjustSum(current: number, delta: number): number {
  return Math.max(0, current + delta)
}
