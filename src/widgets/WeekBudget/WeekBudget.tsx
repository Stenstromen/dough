import { useMemo, useState } from 'react'
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
  formatDateDisplay,
  parseDateInput,
  startOfDay,
  toDateInputValue,
} from '../../lib/dates'
import {
  formatAmount,
  formatInputAmount,
  formatMoney,
  parseAmount,
} from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import { adjustSum } from '../DayBudget/calculate'
import { BudgetDeltas } from '../shared/BudgetDeltas'
import { BudgetSyncPanel } from '../shared/BudgetSyncPanel'
import { KnownExpensesEditor } from '../shared/KnownExpensesEditor'
import { useKnownExpenses } from '../shared/knownExpenses'
import { toKnownExpenses } from '../shared/toKnownExpenses'
import {
  calculate7525,
  calculateWeekBudget,
  clampPeriodDays,
  DEFAULT_PERIOD_DAYS,
  MAX_PERIOD_DAYS,
  MIN_PERIOD_DAYS,
} from './calculate'
import './WeekBudget.css'

interface WeekBudgetState {
  sumRaw: string
  startDate: string
  payday: string
  periodDays: number
  /** Balance left at the end of the budgeting period */
  endBalanceRaw: string
}

const INITIAL_STATE: WeekBudgetState = {
  sumRaw: '',
  startDate: toDateInputValue(new Date()),
  payday: toDateInputValue(defaultPayday()),
  periodDays: DEFAULT_PERIOD_DAYS,
  endBalanceRaw: '',
}

function isWeekBudgetState(value: unknown): value is WeekBudgetState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.sumRaw === 'string' &&
    typeof record.startDate === 'string' &&
    typeof record.payday === 'string' &&
    typeof record.periodDays === 'number' &&
    (typeof record.endBalanceRaw === 'string' ||
      record.endBalanceRaw === undefined ||
      typeof record.spentRaw === 'string' ||
      record.spentRaw === undefined ||
      typeof record.balanceRaw === 'string' ||
      record.balanceRaw === undefined)
  )
}

function normalizeWeekBudgetState(
  value: WeekBudgetState & { spentRaw?: string; balanceRaw?: string },
): WeekBudgetState {
  return {
    sumRaw: value.sumRaw,
    startDate: value.startDate,
    payday: value.payday,
    periodDays: clampPeriodDays(value.periodDays),
    endBalanceRaw:
      value.endBalanceRaw ?? value.spentRaw ?? value.balanceRaw ?? '',
  }
}

function pluralDays(count: number): string {
  return `${count} day${count === 1 ? '' : 's'}`
}

export function WeekBudget() {
  const [state, setState] = usePersistedState(
    'dough:week-budget',
    INITIAL_STATE,
    isWeekBudgetState,
  )
  const [knownExpenses, setKnownExpenses] = useKnownExpenses()
  const [show7525, setShow7525] = useState(false)

  const today = startOfDay(new Date())
  const normalized = normalizeWeekBudgetState(state)

  const result = useMemo(() => {
    const sum = parseAmount(normalized.sumRaw)
    const start = parseDateInput(normalized.startDate)
    const payday = parseDateInput(normalized.payday)
    if (sum === null || start === null || payday === null) {
      return null
    }

    return calculateWeekBudget({
      sum,
      startDate: start,
      payday,
      referenceDate: today,
      periodDays: normalized.periodDays,
      expenses: toKnownExpenses(knownExpenses.expenses),
    })
  }, [normalized, knownExpenses.expenses, today])

  const rule7525 = useMemo(() => {
    if (!show7525 || !result) return null
    const availableSum = parseAmount(normalized.sumRaw)
    const endBalance = parseAmount(normalized.endBalanceRaw)
    if (availableSum === null || endBalance === null) return null
    return calculate7525({
      weeklyBudget: result.weekBudget,
      availableSum,
      endBalance,
      upcomingExpenseTotal: result.upcomingExpenseTotal,
    })
  }, [show7525, result, normalized.sumRaw, normalized.endBalanceRaw])

  function setSumFromNumber(next: number) {
    setState((current) => ({
      ...normalizeWeekBudgetState(current),
      sumRaw: next === 0 ? '' : formatInputAmount(String(Math.round(next))),
    }))
  }

  function applyDelta(delta: number) {
    const current = parseAmount(normalized.sumRaw) ?? 0
    setSumFromNumber(adjustSum(current, delta))
  }

  function applyEndBalanceDelta(delta: number) {
    const current = parseAmount(normalized.endBalanceRaw) ?? 0
    const next = adjustSum(current, delta)
    patchState({
      endBalanceRaw: next === 0 ? '' : formatInputAmount(String(Math.round(next))),
    })
  }

  function patchState(patch: Partial<WeekBudgetState>) {
    setState((current) =>
      normalizeWeekBudgetState({
        ...normalizeWeekBudgetState(current),
        ...patch,
      }),
    )
  }

  return (
    <WidgetFrame
      title="Week budget"
      description="Plan a week-sized slice of what's left until payday. Upcoming known expenses stay reserved, then spend the weekly amount — and at the end, move 25% of anything unspent to savings."
    >
      <BudgetSyncPanel />

      <Stack gap="lg">
        <Field
          label="Available sum"
          inputMode="numeric"
          autoComplete="off"
          inputSize="lg"
          placeholder="8 000"
          value={normalized.sumRaw}
          onChange={(event) =>
            patchState({ sumRaw: formatInputAmount(event.target.value) })
          }
        />

        <BudgetDeltas onDelta={applyDelta} />

        <Stack gap="md" columns="form-2" className="week-budget__dates">
          <div className="week-budget__date-field">
            <DateField
              label="From date"
              value={normalized.startDate}
              onChange={(startDate) => patchState({ startDate })}
            />
            <Button
              className="week-budget__today"
              variant="accent"
              onClick={() =>
                patchState({ startDate: toDateInputValue(new Date()) })
              }
            >
              Today
            </Button>
          </div>

          <DateField
            label="Payday"
            value={normalized.payday}
            onChange={(payday) => patchState({ payday })}
          />
        </Stack>

        <div className="week-budget__period">
          <div className="week-budget__period-head">
            <Text variant="section">Budgeting period</Text>
            <Text variant="body" className="week-budget__period-value">
              {pluralDays(normalized.periodDays)}
            </Text>
          </div>
          <input
            className="week-budget__slider"
            type="range"
            min={MIN_PERIOD_DAYS}
            max={MAX_PERIOD_DAYS}
            step={1}
            value={normalized.periodDays}
            aria-label="Budgeting period in days"
            onChange={(event) =>
              patchState({ periodDays: Number(event.target.value) })
            }
          />
          <div className="week-budget__period-scale" aria-hidden="true">
            {[MIN_PERIOD_DAYS, 7, MAX_PERIOD_DAYS].map((mark) => (
              <span
                key={mark}
                style={{
                  left: `${((mark - MIN_PERIOD_DAYS) / (MAX_PERIOD_DAYS - MIN_PERIOD_DAYS)) * 100}%`,
                }}
              >
                {mark}
              </span>
            ))}
          </div>
        </div>
      </Stack>

      <ResultPanel
        ready={result !== null}
        placeholder="Enter an available sum and payday to see your weekly budget."
      >
        {result ? (
          <>
            <Metric
              label="Week budget"
              value={formatAmount(Math.round(result.weekBudget))}
            />

            <StatGroup>
              <Stat
                label="Per day"
                value={formatAmount(Math.round(result.dailyBudget))}
              />
              <Stat
                label="Period days"
                value={String(result.periodDays)}
              />
              <Stat
                label="Period ends"
                value={formatDateDisplay(result.periodEndDate)}
              />
              <Stat
                label="Days until payday"
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
              <Text variant="meta" className="week-budget__due-summary">
                {result.dueExpenseCount} due expense
                {result.dueExpenseCount === 1 ? '' : 's'} totaling{' '}
                {formatAmount(Math.round(result.dueExpenseTotal))}{' '}
                {result.dueExpenseCount === 1 ? 'is' : 'are'} highlighted and
                left out of the weekly calculation — adjust the available sum
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
                {`Spend about ${formatAmount(Math.round(result.dailyBudget))} per day, or ${formatAmount(Math.round(result.weekBudget))} over the next ${pluralDays(result.periodDays)}${
                  result.upcomingExpenseTotal > 0
                    ? `, after reserving ${formatAmount(Math.round(result.upcomingExpenseTotal))} for upcoming expenses`
                    : ''
                }.`}
              </Text>
            )}
          </>
        ) : null}
      </ResultPanel>

      <Stack gap="md" className="week-budget__rule">
        <div className="week-budget__rule-head">
          <Text variant="section">75 / 25 rule</Text>
          <Button
            variant="accent"
            aria-expanded={show7525}
            onClick={() => setShow7525((open) => !open)}
          >
            {show7525 ? 'Hide 75 / 25' : 'Calculate 75 / 25'}
          </Button>
        </div>

        {show7525 ? (
          <>
            <Text variant="meta">
              Spending is inferred as start available sum minus end balance,
              after reserved known expenses. 25% of anything still unspent versus
              the weekly budget moves to savings; 75% stays in the account.
            </Text>

            {!result ? (
              <Text variant="meta">
                Enter an available sum and payday first so the weekly budget is
                known.
              </Text>
            ) : (
              <>
                <StatGroup>
                  <Stat
                    label="Daily allowance"
                    value={formatAmount(Math.round(result.dailyBudget))}
                  />
                  <Stat
                    label="Period days"
                    value={String(result.periodDays)}
                  />
                  <Stat
                    label="Weekly spending budget"
                    value={formatAmount(Math.round(result.weekBudget))}
                  />
                  <Stat
                    label="Reserved expenses"
                    value={formatAmount(
                      Math.round(result.upcomingExpenseTotal),
                    )}
                  />
                </StatGroup>

                <Field
                  label="Balance at end of period"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="2 130"
                  value={normalized.endBalanceRaw}
                  onChange={(event) =>
                    patchState({
                      endBalanceRaw: formatInputAmount(event.target.value),
                    })
                  }
                />
                <BudgetDeltas onDelta={applyEndBalanceDelta} />

                {rule7525 ? (
                  <>
                    <StatGroup>
                      <Stat
                        label="Derived spending"
                        value={formatAmount(
                          Math.round(rule7525.actualSpending),
                        )}
                      />
                      <Stat
                        label="Unspent allowance"
                        value={formatAmount(
                          Math.round(rule7525.unspentAllowance),
                        )}
                      />
                      <Stat
                        label="75% remains in account"
                        value={formatMoney(rule7525.retainedSurplus, 1)}
                      />
                    </StatGroup>

                    {rule7525.hasUnspent ? (
                      <div className="week-budget__savings">
                        <Metric
                          label="Savings transfer (25%)"
                          value={formatMoney(rule7525.savingsTransfer, 1)}
                        />
                        <div
                          className="week-budget__split"
                          role="img"
                          aria-label="25% to savings, 75% remains in account"
                        >
                          <div className="week-budget__split-savings" />
                          <div className="week-budget__split-retain" />
                        </div>
                        <div className="week-budget__split-labels">
                          <Text variant="meta">25% to savings</Text>
                          <Text variant="meta">75% remains in account</Text>
                        </div>
                      </div>
                    ) : (
                      <Text variant="meta">
                        {rule7525.unspentAllowance < 0
                          ? 'Spending is above the weekly budget — nothing left to move to savings.'
                          : 'No unspent allowance left to split.'}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text variant="meta">
                    Enter the balance left at the end of the period to see the
                    75 / 25 split.
                  </Text>
                )}
              </>
            )}
          </>
        ) : (
          <Text variant="meta">
            Optional: after the period, enter the remaining balance and move 25%
            of what you did not spend to savings.
          </Text>
        )}
      </Stack>

      <KnownExpensesEditor state={knownExpenses} onChange={setKnownExpenses} />
    </WidgetFrame>
  )
}
