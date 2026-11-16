import { calendarDaysBetween, isOnOrBefore } from '../../lib/dates'

export interface KnownExpense {
  id: string
  name: string
  amount: number
  dueDate?: Date | null
}

export interface DayBudgetInput {
  sum: number
  startDate: Date
  payday: Date
  expenses: KnownExpense[]
  /** Day used to decide if an expense is already due. Defaults to startDate. */
  referenceDate?: Date
}

export interface DayBudgetResult {
  expenseTotal: number
  dueExpenseTotal: number
  upcomingExpenseTotal: number
  available: number
  daysRemaining: number
  dailyBudget: number
  paydayIsPast: boolean
  dueExpenseCount: number
}

export function isExpenseDue(
  expense: KnownExpense,
  referenceDate: Date,
): boolean {
  if (!expense.dueDate) return false
  return isOnOrBefore(expense.dueDate, referenceDate)
}

export function calculateDayBudget(
  input: DayBudgetInput,
): DayBudgetResult | null {
  if (!Number.isFinite(input.sum) || input.sum < 0) {
    return null
  }

  const referenceDate = input.referenceDate ?? input.startDate
  let dueExpenseTotal = 0
  let upcomingExpenseTotal = 0
  let dueExpenseCount = 0

  for (const expense of input.expenses) {
    const amount = Math.max(0, expense.amount)
    if (isExpenseDue(expense, referenceDate)) {
      dueExpenseTotal += amount
      dueExpenseCount += 1
    } else {
      upcomingExpenseTotal += amount
    }
  }

  // Only upcoming expenses stay reserved in the daily plan.
  // Due/past ones should already be reflected in the available sum.
  const available = input.sum - upcomingExpenseTotal
  const rawDays = calendarDaysBetween(input.startDate, input.payday)
  const paydayIsPast = rawDays < 0
  const daysRemaining = Math.max(1, rawDays)
  const dailyBudget = available / daysRemaining

  return {
    expenseTotal: dueExpenseTotal + upcomingExpenseTotal,
    dueExpenseTotal,
    upcomingExpenseTotal,
    available,
    daysRemaining,
    dailyBudget,
    paydayIsPast,
    dueExpenseCount,
  }
}

export function adjustSum(current: number, delta: number): number {
  return Math.max(0, current + delta)
}
