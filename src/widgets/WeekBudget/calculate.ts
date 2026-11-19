import { addCalendarDays } from '../../lib/dates'
import {
  calculateDayBudget,
  type DayBudgetInput,
  type DayBudgetResult,
} from '../DayBudget/calculate'

export interface WeekBudgetInput extends DayBudgetInput {
  /** Length of the budgeting window. Defaults to 7. */
  periodDays?: number
}

export interface WeekBudgetResult extends DayBudgetResult {
  periodDays: number
  /** Inclusive last day of the budgeting window (from date + periodDays − 1). */
  periodEndDate: Date
  weekBudget: number
}

export interface Rule7525Input {
  weeklyBudget: number
  /** Available sum at the start of the period */
  availableSum: number
  /** Balance / available sum left at the end of the period */
  endBalance: number
  /** Upcoming known expenses already reserved in the weekly plan */
  upcomingExpenseTotal: number
}

export interface Rule7525Result {
  weeklyBudget: number
  availableSum: number
  endBalance: number
  upcomingExpenseTotal: number
  /** Derived: start − end − reserved expenses */
  actualSpending: number
  unspentAllowance: number
  /** 25% of unspent — transfer to savings */
  savingsTransfer: number
  /** 75% of unspent — remains in account */
  retainedSurplus: number
  hasUnspent: boolean
}

const DEFAULT_PERIOD_DAYS = 7
const MIN_PERIOD_DAYS = 1
const MAX_PERIOD_DAYS = 14

export function clampPeriodDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PERIOD_DAYS
  return Math.min(MAX_PERIOD_DAYS, Math.max(MIN_PERIOD_DAYS, Math.round(value)))
}

export function calculateWeekBudget(
  input: WeekBudgetInput,
): WeekBudgetResult | null {
  const day = calculateDayBudget(input)
  if (!day) return null

  const requested = clampPeriodDays(input.periodDays ?? DEFAULT_PERIOD_DAYS)
  const periodDays = Math.min(requested, day.daysRemaining)
  const weekBudget = day.dailyBudget * periodDays
  const periodEndDate = addCalendarDays(input.startDate, periodDays - 1)

  return {
    ...day,
    periodDays,
    periodEndDate,
    weekBudget,
  }
}

/**
 * Weekly 75/25 from end balance:
 * spending = available sum − end balance − reserved known expenses
 * unspent = weekly budget − spending
 * 25% of unspent → savings, 75% remains in the account.
 */
export function calculate7525(input: Rule7525Input): Rule7525Result | null {
  const {
    weeklyBudget,
    availableSum,
    endBalance,
    upcomingExpenseTotal,
  } = input

  if (
    !Number.isFinite(weeklyBudget) ||
    !Number.isFinite(availableSum) ||
    !Number.isFinite(endBalance) ||
    !Number.isFinite(upcomingExpenseTotal) ||
    weeklyBudget < 0 ||
    availableSum < 0 ||
    endBalance < 0 ||
    upcomingExpenseTotal < 0
  ) {
    return null
  }

  const actualSpending =
    availableSum - endBalance - upcomingExpenseTotal
  const unspentAllowance = weeklyBudget - actualSpending

  if (unspentAllowance <= 0) {
    return {
      weeklyBudget,
      availableSum,
      endBalance,
      upcomingExpenseTotal,
      actualSpending,
      unspentAllowance,
      savingsTransfer: 0,
      retainedSurplus: 0,
      hasUnspent: false,
    }
  }

  return {
    weeklyBudget,
    availableSum,
    endBalance,
    upcomingExpenseTotal,
    actualSpending,
    unspentAllowance,
    savingsTransfer: unspentAllowance * 0.25,
    retainedSurplus: unspentAllowance * 0.75,
    hasUnspent: true,
  }
}

export { DEFAULT_PERIOD_DAYS, MIN_PERIOD_DAYS, MAX_PERIOD_DAYS }
