import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DateField,
  Field,
  Metric,
  ResultPanel,
  Stack,
  Stat,
  StatGroup,
  Surface,
  Text,
  WidgetFrame,
} from '../../components'
import {
  defaultPayday,
  parseDateInput,
  startOfDay,
  toDateInputValue,
} from '../../lib/dates'
import { formatAmount, formatInputAmount, parseAmount } from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import { adjustSum, calculateDayBudget } from './calculate'
import './DayBudget.css'

interface ExpenseDraft {
  id: string
  name: string
  amount: string
}

interface DayBudgetState {
  sumRaw: string
  payday: string
  expenses: ExpenseDraft[]
  nextExpenseNumber: number
}

const QUICK_DELTAS = [-1000, -100, -10, 10, 100, 1000] as const

const INITIAL_STATE: DayBudgetState = {
  sumRaw: '',
  payday: toDateInputValue(defaultPayday()),
  expenses: [],
  nextExpenseNumber: 1,
}

function isExpenseDraft(value: unknown): value is ExpenseDraft {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.amount === 'string'
  )
}

function isDayBudgetState(value: unknown): value is DayBudgetState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.sumRaw === 'string' &&
    typeof record.payday === 'string' &&
    Array.isArray(record.expenses) &&
    record.expenses.every(isExpenseDraft) &&
    typeof record.nextExpenseNumber === 'number'
  )
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta)
}

export function DayBudget() {
  const [state, setState] = usePersistedState(
    'dough:day-budget',
    INITIAL_STATE,
    isDayBudgetState,
  )
  const [startDate, setStartDate] = useState(() =>
    toDateInputValue(new Date()),
  )

  useEffect(() => {
    const today = new Date()
    setStartDate(toDateInputValue(today))

    setState((current) => {
      const payday = parseDateInput(current.payday)
      if (!payday || startOfDay(payday) < startOfDay(today)) {
        return {
          ...current,
          payday: toDateInputValue(defaultPayday(today)),
        }
      }
      return current
    })
  }, [setState])

  const result = useMemo(() => {
    const sum = parseAmount(state.sumRaw)
    const start = parseDateInput(startDate)
    const payday = parseDateInput(state.payday)
    if (sum === null || start === null || payday === null) {
      return null
    }

    return calculateDayBudget({
      sum,
      startDate: start,
      payday,
      expenses: state.expenses.flatMap((expense) => {
        const amount = parseAmount(expense.amount)
        if (amount === null || amount <= 0) return []
        return [
          {
            id: expense.id,
            name: expense.name.trim() || 'Expense',
            amount,
          },
        ]
      }),
    })
  }, [state, startDate])

  function setSumFromNumber(next: number) {
    setState((current) => ({
      ...current,
      sumRaw: next === 0 ? '' : formatInputAmount(String(Math.round(next))),
    }))
  }

  function applyDelta(delta: number) {
    const current = parseAmount(state.sumRaw) ?? 0
    setSumFromNumber(adjustSum(current, delta))
  }

  function addExpense() {
    setState((current) => ({
      ...current,
      nextExpenseNumber: current.nextExpenseNumber + 1,
      expenses: [
        ...current.expenses,
        {
          id: `expense-${current.nextExpenseNumber}`,
          name: '',
          amount: '',
        },
      ],
    }))
  }

  function updateExpense(id: string, patch: Partial<ExpenseDraft>) {
    setState((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...patch } : expense,
      ),
    }))
  }

  function removeExpense(id: string) {
    setState((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== id),
    }))
  }

  return (
    <WidgetFrame
      title="Day budget"
      description="Divide what's left until payday by the remaining days. Subtract known expenses first, then spend the daily amount."
    >
      <Stack gap="lg">
        <Field
          label="Available sum"
          inputMode="numeric"
          autoComplete="off"
          inputSize="lg"
          placeholder="8 000"
          value={state.sumRaw}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              sumRaw: formatInputAmount(event.target.value),
            }))
          }
        />

        <div className="day-budget__deltas" role="group" aria-label="Quick sum update">
          {QUICK_DELTAS.map((delta) => (
            <Button
              key={delta}
              className="day-budget__delta"
              variant={delta < 0 ? 'ghost' : 'accent'}
              onClick={() => applyDelta(delta)}
            >
              {formatDelta(delta)}
            </Button>
          ))}
        </div>

        <Stack gap="md" columns="form-2" className="day-budget__dates">
          <div className="day-budget__date-field">
            <DateField
              label="From date"
              value={startDate}
              onChange={setStartDate}
            />
            <Button
              className="day-budget__today"
              variant="accent"
              onClick={() => setStartDate(toDateInputValue(new Date()))}
            >
              Today
            </Button>
          </div>

          <DateField
            label="Payday"
            value={state.payday}
            onChange={(payday) =>
              setState((current) => ({
                ...current,
                payday,
              }))
            }
          />
        </Stack>
      </Stack>

      <Stack gap="md">
        <div className="day-budget__expenses-head">
          <Text variant="section">Known expenses</Text>
          <Button variant="accent" onClick={addExpense}>
            Add expense
          </Button>
        </div>

        {state.expenses.length === 0 ? (
          <Text variant="meta">
            Add bills or set-asides to subtract before calculating the daily
            budget.
          </Text>
        ) : (
          <Stack gap="md">
            {state.expenses.map((expense, index) => (
              <Surface
                as="section"
                key={expense.id}
                variant="panel"
                className="day-budget__expense"
              >
                <div className="day-budget__expense-row">
                  <Field
                    grow
                    label="Name"
                    autoComplete="off"
                    placeholder={`Expense ${index + 1}`}
                    value={expense.name}
                    onChange={(event) =>
                      updateExpense(expense.id, { name: event.target.value })
                    }
                  />
                  <Field
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
                    className="day-budget__remove"
                    onClick={() => removeExpense(expense.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Surface>
            ))}
          </Stack>
        )}
      </Stack>

      <ResultPanel
        ready={result !== null}
        placeholder="Enter an available sum and payday to see your daily budget."
      >
        {result ? (
          <>
            <Metric
              label="Daily budget"
              value={formatAmount(Math.round(result.dailyBudget))}
            />

            <StatGroup>
              <Stat
                label="Days remaining"
                value={String(result.daysRemaining)}
              />
              <Stat
                label="After expenses"
                value={formatAmount(Math.round(result.available))}
              />
              <Stat
                label="Known expenses"
                value={formatAmount(Math.round(result.expenseTotal))}
              />
            </StatGroup>

            {result.paydayIsPast ? (
              <Text variant="meta">
                Payday is before the from date — showing a one-day budget until
                you pick a future payday.
              </Text>
            ) : (
              <Text variant="meta">
                {formatAmount(Math.round(result.available))} left over{' '}
                {result.daysRemaining} day
                {result.daysRemaining === 1 ? '' : 's'} until payday
                {result.expenseTotal > 0
                  ? `, after ${formatAmount(Math.round(result.expenseTotal))} in known expenses`
                  : ''}
                .
              </Text>
            )}
          </>
        ) : null}
      </ResultPanel>
    </WidgetFrame>
  )
}
