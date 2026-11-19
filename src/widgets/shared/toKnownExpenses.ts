import { parseDateInput } from '../../lib/dates'
import { parseAmount } from '../../lib/format'
import type { KnownExpense } from '../DayBudget/calculate'
import { normalizeExpense, type ExpenseDraft } from './knownExpenses'

export function toKnownExpenses(expenses: ExpenseDraft[]): KnownExpense[] {
  return expenses.map(normalizeExpense).flatMap((expense) => {
    const amount = parseAmount(expense.amount)
    if (amount === null || amount <= 0) return []
    return [
      {
        id: expense.id,
        name: expense.name.trim() || 'Expense',
        amount,
        dueDate: parseDateInput(expense.dueDate),
      },
    ]
  })
}
