import { usePersistedState } from '../../lib/usePersistedState'

export interface ExpenseDraft {
  id: string
  name: string
  amount: string
  dueDate: string
}

export interface KnownExpensesState {
  expenses: ExpenseDraft[]
  nextExpenseNumber: number
}

export const KNOWN_EXPENSES_KEY = 'dough:known-expenses'
const DAY_BUDGET_KEY = 'dough:day-budget'

const INITIAL_STATE: KnownExpensesState = {
  expenses: [],
  nextExpenseNumber: 1,
}

export function isExpenseDraft(value: unknown): value is ExpenseDraft {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.amount === 'string' &&
    (typeof record.dueDate === 'string' || record.dueDate === undefined)
  )
}

export function normalizeExpense(value: ExpenseDraft): ExpenseDraft {
  return {
    ...value,
    dueDate: value.dueDate ?? '',
  }
}

export function isKnownExpensesState(
  value: unknown,
): value is KnownExpensesState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    Array.isArray(record.expenses) &&
    record.expenses.every(isExpenseDraft) &&
    typeof record.nextExpenseNumber === 'number'
  )
}

function readDayBudgetExpenses(): KnownExpensesState | null {
  try {
    const raw = window.localStorage.getItem(DAY_BUDGET_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      !Array.isArray(parsed.expenses) ||
      !parsed.expenses.every(isExpenseDraft)
    ) {
      return null
    }
    const nextExpenseNumber =
      typeof parsed.nextExpenseNumber === 'number'
        ? parsed.nextExpenseNumber
        : parsed.expenses.length + 1
    return {
      expenses: parsed.expenses.map(normalizeExpense),
      nextExpenseNumber,
    }
  } catch {
    return null
  }
}

function readInitialKnownExpenses(): KnownExpensesState {
  if (typeof window === 'undefined') return INITIAL_STATE

  try {
    const raw = window.localStorage.getItem(KNOWN_EXPENSES_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as unknown
      if (isKnownExpensesState(parsed)) {
        return {
          expenses: parsed.expenses.map(normalizeExpense),
          nextExpenseNumber: parsed.nextExpenseNumber,
        }
      }
    }
  } catch {
    // Fall through to migration.
  }

  return readDayBudgetExpenses() ?? INITIAL_STATE
}

export function useKnownExpenses() {
  return usePersistedState(
    KNOWN_EXPENSES_KEY,
    readInitialKnownExpenses(),
    isKnownExpensesState,
  )
}
