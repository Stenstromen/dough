import {
  Button,
  DateField,
  Field,
  Stack,
  Surface,
  Text,
} from '../../components'
import { isOnOrBefore, parseDateInput, startOfDay } from '../../lib/dates'
import { formatInputAmount } from '../../lib/format'
import {
  normalizeExpense,
  type ExpenseDraft,
  type KnownExpensesState,
} from './knownExpenses'
import './KnownExpensesEditor.css'

interface KnownExpensesEditorProps {
  state: KnownExpensesState
  onChange: (
    updater: (current: KnownExpensesState) => KnownExpensesState,
  ) => void
}

function isDueOrPast(dueDateRaw: string, reference: Date): boolean {
  const dueDate = parseDateInput(dueDateRaw)
  if (!dueDate) return false
  return isOnOrBefore(dueDate, reference)
}

function compareExpensesByDueDate(a: ExpenseDraft, b: ExpenseDraft): number {
  const aDue = parseDateInput(a.dueDate)
  const bDue = parseDateInput(b.dueDate)
  if (!aDue && !bDue) return 0
  if (!aDue) return -1
  if (!bDue) return 1
  return aDue.getTime() - bDue.getTime()
}

export function KnownExpensesEditor({
  state,
  onChange,
}: KnownExpensesEditorProps) {
  const today = startOfDay(new Date())
  const expenses = state.expenses
    .map(normalizeExpense)
    .sort(compareExpensesByDueDate)

  function addExpense() {
    onChange((current) => ({
      ...current,
      nextExpenseNumber: current.nextExpenseNumber + 1,
      expenses: [
        {
          id: `expense-${current.nextExpenseNumber}`,
          name: '',
          amount: '',
          dueDate: '',
        },
        ...current.expenses.map(normalizeExpense),
      ],
    }))
  }

  function updateExpense(id: string, patch: Partial<ExpenseDraft>) {
    onChange((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id
          ? normalizeExpense({ ...normalizeExpense(expense), ...patch })
          : normalizeExpense(expense),
      ),
    }))
  }

  function removeExpense(id: string) {
    onChange((current) => ({
      ...current,
      expenses: current.expenses
        .filter((expense) => expense.id !== id)
        .map(normalizeExpense),
    }))
  }

  return (
    <Stack gap="md" className="known-expenses">
      <div className="known-expenses__head">
        <Text variant="section">Known expenses</Text>
        <Button variant="accent" onClick={addExpense}>
          Add expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Text variant="meta">
          Add bills or set-asides with an optional due date. Due or past expenses
          light up so you can deduct them from the available sum instead of
          leaving them in the daily plan. Shared with Day budget and Week
          budget.
        </Text>
      ) : (
        <Stack gap="sm">
          {expenses.map((expense, index) => {
            const due = isDueOrPast(expense.dueDate, today)
            return (
              <Surface
                as="section"
                key={expense.id}
                variant="panel"
                className={
                  due
                    ? 'known-expenses__card known-expenses__card--due'
                    : 'known-expenses__card'
                }
              >
                <div className="known-expenses__row">
                  <Field
                    grow
                    clearable={false}
                    label="Name"
                    autoComplete="off"
                    placeholder={`Expense ${index + 1}`}
                    value={expense.name}
                    onChange={(event) =>
                      updateExpense(expense.id, { name: event.target.value })
                    }
                  />
                  <Field
                    clearable={false}
                    label="Amount"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="500"
                    value={expense.amount}
                    onChange={(event) =>
                      updateExpense(expense.id, {
                        amount: formatInputAmount(event.target.value),
                      })
                    }
                  />
                  <Button
                    variant="danger"
                    className="known-expenses__remove"
                    aria-label={`Remove ${expense.name.trim() || `expense ${index + 1}`}`}
                    onClick={() => removeExpense(expense.id)}
                  >
                    ×
                  </Button>
                </div>

                <DateField
                  clearable
                  label="Due (optional)"
                  value={expense.dueDate}
                  onChange={(dueDate) => updateExpense(expense.id, { dueDate })}
                />

                {due ? (
                  <Text variant="meta" className="known-expenses__due-note">
                    Due or past — deduct from available sum, then clear or
                    remove.
                  </Text>
                ) : null}
              </Surface>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
