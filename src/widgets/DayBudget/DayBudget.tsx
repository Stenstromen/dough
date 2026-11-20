import { useMemo } from 'react'
import {
  Button,
  DateField,
  Field,
  Metric,
  ResultPanel,
  Stack,
  Stat,
  StatGroup,
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
import { BudgetDeltas } from '../shared/BudgetDeltas'
import { BudgetSyncPanel } from '../shared/BudgetSyncPanel'
import { KnownExpensesEditor } from '../shared/KnownExpensesEditor'
import { useKnownExpenses } from '../shared/knownExpenses'
import { toKnownExpenses } from '../shared/toKnownExpenses'
import { adjustSum, calculateDayBudget } from './calculate'
import './DayBudget.css'

interface DayBudgetState {
  sumRaw: string
  startDate: string
  payday: string
}

const INITIAL_STATE: DayBudgetState = {
  sumRaw: '',
  startDate: toDateInputValue(new Date()),
  payday: toDateInputValue(defaultPayday()),
}

function isDayBudgetState(value: unknown): value is DayBudgetState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.sumRaw === 'string' &&
    typeof record.startDate === 'string' &&
    typeof record.payday === 'string'
  )
}

export function DayBudget() {
  const [state, setState] = usePersistedState(
    'dough:day-budget',
    INITIAL_STATE,
    isDayBudgetState,
  )
  const [knownExpenses, setKnownExpenses] = useKnownExpenses()

  const today = startOfDay(new Date())

  const result = useMemo(() => {
    const sum = parseAmount(state.sumRaw)
    const start = parseDateInput(state.startDate)
    const payday = parseDateInput(state.payday)
    if (sum === null || start === null || payday === null) {
      return null
    }

    return calculateDayBudget({
      sum,
      startDate: start,
      payday,
      referenceDate: today,
      expenses: toKnownExpenses(knownExpenses.expenses),
    })
  }, [state, knownExpenses.expenses, today])

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

  return (
    <WidgetFrame
      title="Day budget"
      description="Divide what's left until payday by the remaining days. Subtract upcoming known expenses first, then spend the daily amount."
    >
      <BudgetSyncPanel />

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

        <BudgetDeltas onDelta={applyDelta} />

        <Stack gap="md" columns="form-2" className="day-budget__dates">
          <div className="day-budget__date-field">
            <DateField
              label="From date"
              value={state.startDate}
              onChange={(startDate) =>
                setState((current) => ({
                  ...current,
                  startDate,
                }))
              }
            />
            <Button
              className="day-budget__today"
              variant="accent"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  startDate: toDateInputValue(new Date()),
                }))
              }
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
                label="Upcoming expenses"
                value={formatAmount(Math.round(result.upcomingExpenseTotal))}
              />
            </StatGroup>

            {result.dueExpenseCount > 0 ? (
              <Text variant="meta" className="day-budget__due-summary">
                {result.dueExpenseCount} due expense
                {result.dueExpenseCount === 1 ? '' : 's'} totaling{' '}
                {formatAmount(Math.round(result.dueExpenseTotal))}{' '}
                {result.dueExpenseCount === 1 ? 'is' : 'are'} highlighted and
                left out of the daily calculation — adjust the available sum
                first.
              </Text>
            ) : null}

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
                {result.upcomingExpenseTotal > 0
                  ? `, after ${formatAmount(Math.round(result.upcomingExpenseTotal))} in upcoming expenses`
                  : ''}
                .
              </Text>
            )}
          </>
        ) : null}
      </ResultPanel>

      <KnownExpensesEditor state={knownExpenses} onChange={setKnownExpenses} />
    </WidgetFrame>
  )
}
