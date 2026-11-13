import { useMemo, useState } from 'react'
import {
  Button,
  DataCell,
  DataTable,
  Field,
  Metric,
  ResultPanel,
  Stack,
  Surface,
  Text,
  WidgetFrame,
} from '../../components'
import {
  formatInputDecimal,
  formatMoney,
  formatPercent,
  parseDecimal,
} from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import {
  calculateFinancing,
  DEFAULT_VISIBLE_MONTHS,
  type PlanSummary,
} from './calculate'
import './FinancingPlanner.css'

interface PlannerState {
  amountFinanced: string
  setupFee: string
  monthlyAdminFee: string
  targetPayments: string
  originalInstallment: string
  adjustedInstallment: string
  nominalAnnualRate: string
  monthlyRateOverride: string
}

const INITIAL_STATE: PlannerState = {
  amountFinanced: '16 990,00',
  setupFee: '299,00',
  monthlyAdminFee: '39,00',
  targetPayments: '24',
  originalInstallment: '824,00',
  adjustedInstallment: '1 500,00',
  nominalAnnualRate: '9,9900',
  monthlyRateOverride: '',
}

function isPlannerState(value: unknown): value is PlannerState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.amountFinanced === 'string' &&
    typeof record.setupFee === 'string' &&
    typeof record.monthlyAdminFee === 'string' &&
    typeof record.targetPayments === 'string' &&
    typeof record.originalInstallment === 'string' &&
    typeof record.adjustedInstallment === 'string' &&
    typeof record.nominalAnnualRate === 'string' &&
    typeof record.monthlyRateOverride === 'string'
  )
}

type ScheduleView = 'original' | 'adjusted'

function ComparisonRow({
  label,
  original,
  adjusted,
  emphasize = false,
  highlight = false,
}: {
  label: string
  original: string
  adjusted: string
  emphasize?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={[
        'financing__compare-row',
        emphasize ? 'financing__compare-row--emphasize' : '',
        highlight ? 'financing__compare-row--highlight' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{label}</span>
      <span>{original}</span>
      <span>{adjusted}</span>
    </div>
  )
}

function moneyOrDash(value: number, clearedHint = false): string {
  if (clearedHint) return formatMoney(0)
  return formatMoney(value)
}

function planClearedLabel(plan: PlanSummary): string {
  return plan.cleared ? String(plan.paymentsToClear) : `${plan.paymentsToClear}+`
}

export function FinancingPlanner() {
  const [state, setState] = usePersistedState(
    'dough:financing',
    INITIAL_STATE,
    isPlannerState,
  )
  const [scheduleView, setScheduleView] = useState<ScheduleView>('original')
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  function updateField<K extends keyof PlannerState>(key: K, raw: string) {
    setState((current) => ({
      ...current,
      [key]: formatInputDecimal(raw),
    }))
  }

  const result = useMemo(() => {
    const amountFinanced = parseDecimal(state.amountFinanced)
    const setupFee = parseDecimal(state.setupFee) ?? 0
    const monthlyAdminFee = parseDecimal(state.monthlyAdminFee) ?? 0
    const targetPayments = parseDecimal(state.targetPayments)
    const originalInstallment = parseDecimal(state.originalInstallment)
    const adjustedInstallment = parseDecimal(state.adjustedInstallment)
    const nominalAnnualRate = parseDecimal(state.nominalAnnualRate)
    const monthlyRateOverride = parseDecimal(state.monthlyRateOverride)

    if (
      amountFinanced === null ||
      targetPayments === null ||
      originalInstallment === null ||
      nominalAnnualRate === null
    ) {
      return null
    }

    return calculateFinancing({
      amountFinanced,
      setupFee,
      monthlyAdminFee,
      targetPayments: Math.round(targetPayments),
      originalInstallment,
      adjustedInstallment,
      nominalAnnualRate,
      monthlyRateOverride,
    })
  }, [state])

  const hasAdjusted = result?.adjusted !== null && result?.adjusted !== undefined

  const activePlan =
    result === null
      ? null
      : scheduleView === 'adjusted' && result.adjusted
        ? result.adjusted
        : result.original

  const visibleRows = activePlan
    ? showFullSchedule
      ? activePlan.schedule
      : activePlan.schedule.slice(0, DEFAULT_VISIBLE_MONTHS)
    : []

  const hiddenCount = activePlan
    ? Math.max(0, activePlan.schedule.length - DEFAULT_VISIBLE_MONTHS)
    : 0

  return (
    <WidgetFrame
      title="Financing payment planner"
      description="Compare an original financing plan with a higher adjusted installment. All amounts are in SEK, including the monthly admin fee."
    >
      <div className="financing__layout">
        <Surface variant="panel" className="financing__inputs">
          <Text variant="section">Your inputs</Text>
          <Stack gap="md">
            <Field
              label="Amount financed"
              inputMode="decimal"
              autoComplete="off"
              value={state.amountFinanced}
              onChange={(event) =>
                updateField('amountFinanced', event.target.value)
              }
            />
            <Field
              label="Setup fee paid upfront"
              inputMode="decimal"
              autoComplete="off"
              value={state.setupFee}
              onChange={(event) => updateField('setupFee', event.target.value)}
            />
            <div className="financing__computed">
              <Text variant="label">Monthly interest rate used</Text>
              <Text variant="rowTitle">
                {result
                  ? formatPercent(result.monthlyRatePercent, 4)
                  : '—'}
              </Text>
            </div>
            <Field
              label="Monthly admin fee"
              inputMode="decimal"
              autoComplete="off"
              value={state.monthlyAdminFee}
              onChange={(event) =>
                updateField('monthlyAdminFee', event.target.value)
              }
            />
            <Field
              label="Target number of payments"
              inputMode="numeric"
              autoComplete="off"
              value={state.targetPayments}
              onChange={(event) =>
                updateField('targetPayments', event.target.value)
              }
            />
            <Field
              label="Original installment"
              inputMode="decimal"
              autoComplete="off"
              value={state.originalInstallment}
              onChange={(event) =>
                updateField('originalInstallment', event.target.value)
              }
            />
            <Field
              label="Adjusted monthly installment (optional)"
              inputMode="decimal"
              autoComplete="off"
              value={state.adjustedInstallment}
              onChange={(event) =>
                updateField('adjustedInstallment', event.target.value)
              }
            />
          </Stack>

          <div className="financing__computed financing__computed--accent">
            <Text variant="label">Installment for target term</Text>
            <Text variant="rowTitle">
              {result ? formatMoney(result.installmentForTargetTerm) : '—'}
            </Text>
          </div>

          <Text variant="meta">
            Original installment is required. Add an adjusted installment to
            compare a higher payment. Leave monthly rate override blank to
            derive it from the nominal annual rate ÷ 12.
          </Text>
        </Surface>

        <ResultPanel
          ready={result !== null}
          placeholder="Enter financed amount, rates, and the original installment to see the plan."
          className="financing__compare-panel"
        >
          {result ? (
            <div className="financing__compare">
              <Text variant="section">Repayment comparison</Text>
              <div className="financing__compare-head">
                <span>Metric</span>
                <span>Original</span>
                <span>Adjusted</span>
              </div>
              <ComparisonRow
                label="Monthly installment"
                original={formatMoney(result.original.monthlyInstallment)}
                adjusted={
                  result.adjusted
                    ? formatMoney(result.adjusted.monthlyInstallment)
                    : '—'
                }
              />
              <ComparisonRow
                label="Payments to clear balance"
                original={planClearedLabel(result.original)}
                adjusted={
                  result.adjusted ? planClearedLabel(result.adjusted) : '—'
                }
              />
              <ComparisonRow
                label="Total interest"
                original={formatMoney(result.original.totalInterest)}
                adjusted={
                  result.adjusted
                    ? formatMoney(result.adjusted.totalInterest)
                    : '—'
                }
              />
              <ComparisonRow
                label="Total admin fees"
                original={formatMoney(result.original.totalAdminFees)}
                adjusted={
                  result.adjusted
                    ? formatMoney(result.adjusted.totalAdminFees)
                    : '—'
                }
              />
              <ComparisonRow
                label="Total repaid incl. setup fee"
                original={formatMoney(result.original.totalRepaidInclSetup)}
                adjusted={
                  result.adjusted
                    ? formatMoney(result.adjusted.totalRepaidInclSetup)
                    : '—'
                }
                emphasize
              />
              <ComparisonRow
                label="Financing cost"
                original={formatMoney(result.original.financingCost)}
                adjusted={
                  result.adjusted
                    ? formatMoney(result.adjusted.financingCost)
                    : '—'
                }
                emphasize
                highlight
              />
              <ComparisonRow
                label="Balance after target term"
                original={moneyOrDash(result.original.balanceAfterTargetTerm)}
                adjusted={
                  result.adjusted
                    ? moneyOrDash(result.adjusted.balanceAfterTargetTerm)
                    : '—'
                }
              />
              <ComparisonRow
                label="Balance after 600 months"
                original={moneyOrDash(result.original.balanceAfterMaxTerm)}
                adjusted={
                  result.adjusted
                    ? moneyOrDash(result.adjusted.balanceAfterMaxTerm)
                    : '—'
                }
              />
              <ComparisonRow
                label="Savings with adjusted payment"
                original="—"
                adjusted={
                  result.savings !== null ? formatMoney(result.savings) : '—'
                }
                emphasize
                highlight
              />
            </div>
          ) : null}
        </ResultPanel>
      </div>

      <Surface variant="panel">
        <Text variant="section">Interest rate inputs</Text>
        <Stack gap="md" columns="form-2" className="financing__rates">
          <Field
            label="Nominal annual rate %"
            inputMode="decimal"
            autoComplete="off"
            value={state.nominalAnnualRate}
            onChange={(event) =>
              updateField('nominalAnnualRate', event.target.value)
            }
          />
          <Field
            label="Monthly rate override % (optional)"
            inputMode="decimal"
            autoComplete="off"
            value={state.monthlyRateOverride}
            onChange={(event) =>
              updateField('monthlyRateOverride', event.target.value)
            }
          />
        </Stack>
        <div className="financing__computed">
          <Text variant="label">Nominal annual rate used</Text>
          <Text variant="rowTitle">
            {result ? formatPercent(result.annualRateUsedPercent, 4) : '—'}
          </Text>
        </div>
      </Surface>

      <ResultPanel
        ready={activePlan !== null && activePlan.schedule.length > 0}
        placeholder="A payment schedule appears once the plan can be calculated."
      >
        {activePlan ? (
          <>
            <div className="financing__schedule-head">
              <Metric
                label="Payment schedule"
                value={formatMoney(
                  activePlan.schedule.reduce((sum, row) => sum + row.payment, 0),
                )}
              />
              {hasAdjusted ? (
                <div
                  className="financing__schedule-toggle"
                  role="group"
                  aria-label="Schedule plan"
                >
                  <Button
                    variant={scheduleView === 'original' ? 'accent' : 'ghost'}
                    onClick={() => {
                      setScheduleView('original')
                      setShowFullSchedule(false)
                    }}
                  >
                    Original
                  </Button>
                  <Button
                    variant={scheduleView === 'adjusted' ? 'accent' : 'ghost'}
                    onClick={() => {
                      setScheduleView('adjusted')
                      setShowFullSchedule(false)
                    }}
                  >
                    Adjusted
                  </Button>
                </div>
              ) : null}
            </div>

            <Text variant="meta">
              Showing {visibleRows.length} of {activePlan.schedule.length}{' '}
              payment{activePlan.schedule.length === 1 ? '' : 's'}
              {activePlan.cleared ? '' : ' (balance not cleared within 600 months)'}
              .
            </Text>

            <DataTable
              headers={[
                'Month',
                'Interest',
                'Principal',
                'Admin fee',
                'Payment',
                'Remaining',
              ]}
            >
              {visibleRows.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.month}</th>
                  <DataCell>{formatMoney(row.interest)}</DataCell>
                  <DataCell>{formatMoney(row.principal)}</DataCell>
                  <DataCell>{formatMoney(row.adminFee)}</DataCell>
                  <DataCell strong>{formatMoney(row.payment)}</DataCell>
                  <DataCell>{formatMoney(row.remaining)}</DataCell>
                </tr>
              ))}
            </DataTable>

            {hiddenCount > 0 ? (
              <Button
                variant="accent"
                className="financing__reveal"
                onClick={() => setShowFullSchedule((current) => !current)}
              >
                {showFullSchedule
                  ? 'Show first 12 months'
                  : `Show remaining ${hiddenCount} payments`}
              </Button>
            ) : null}
          </>
        ) : null}
      </ResultPanel>
    </WidgetFrame>
  )
}
