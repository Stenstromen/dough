import type { FormEvent } from 'react'
import {
  Badge,
  Field,
  Meter,
  Metric,
  ResultPanel,
  Stack,
  Stat,
  StatGroup,
  Text,
  WidgetFrame,
} from '../../components'
import {
  formatAmount,
  formatInputAmount,
  parseAmount,
} from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import './LtvCalculator.css'

interface LtvState {
  propertyRaw: string
  mortgageRaw: string
}

const INITIAL_LTV: LtvState = {
  propertyRaw: '',
  mortgageRaw: '',
}

function isLtvState(value: unknown): value is LtvState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.propertyRaw === 'string' &&
    typeof record.mortgageRaw === 'string'
  )
}

type RiskLevel = 'excellent' | 'good' | 'elevated' | 'high'

function getRisk(ltv: number): RiskLevel {
  if (ltv < 60) return 'excellent'
  if (ltv < 80) return 'good'
  if (ltv < 90) return 'elevated'
  return 'high'
}

const RISK_COPY: Record<RiskLevel, { label: string; hint: string }> = {
  excellent: {
    label: 'Strong equity',
    hint: 'Below 60% — typically the healthiest loan-to-value band.',
  },
  good: {
    label: 'Solid position',
    hint: '60–80% — common for conventional mortgages.',
  },
  elevated: {
    label: 'Higher leverage',
    hint: '80–90% — more sensitive to price drops; insurance may apply.',
  },
  high: {
    label: 'High leverage',
    hint: 'Above 90% — thin equity cushion if values soften.',
  },
}

export function LtvCalculator() {
  const [state, setState] = usePersistedState(
    'dough:ltv',
    INITIAL_LTV,
    isLtvState,
  )
  const { propertyRaw, mortgageRaw } = state

  const propertyValue = parseAmount(propertyRaw)
  const mortgageValue = parseAmount(mortgageRaw)

  const canCalculate =
    propertyValue !== null &&
    mortgageValue !== null &&
    propertyValue > 0

  const ltv = canCalculate ? (mortgageValue / propertyValue) * 100 : null
  const equity =
    canCalculate && propertyValue >= mortgageValue
      ? propertyValue - mortgageValue
      : canCalculate
        ? 0
        : null
  const risk = ltv !== null ? getRisk(ltv) : null
  const overLeveraged = canCalculate && mortgageValue > propertyValue
  const ready =
    ltv !== null &&
    propertyValue !== null &&
    mortgageValue !== null &&
    risk !== null

  return (
    <WidgetFrame
      title="Loan-to-value"
      description="Compare your mortgage to your property value. LTV shows how much of the home is financed versus owned outright."
    >
      <Stack
        as="form"
        gap="lg"
        columns="form-2"
        onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
      >
        <Field
          label="Property value"
          inputMode="decimal"
          autoComplete="off"
          inputSize="lg"
          placeholder="450 000"
          value={propertyRaw}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              propertyRaw: formatInputAmount(event.target.value),
            }))
          }
        />
        <Field
          label="Mortgage balance"
          inputMode="decimal"
          autoComplete="off"
          inputSize="lg"
          placeholder="320 000"
          value={mortgageRaw}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              mortgageRaw: formatInputAmount(event.target.value),
            }))
          }
        />
      </Stack>

      <ResultPanel
        ready={ready}
        placeholder="Enter property value and mortgage to see your ratio."
      >
        {ready ? (
          <>
            <Meter value={ltv} tone={risk} />

            <div className="ltv__headline">
              <Metric
                value={ltv.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: ltv % 1 === 0 ? 0 : 1,
                })}
                unit="%"
              />
              <Badge tone={risk}>{RISK_COPY[risk].label}</Badge>
            </div>

            <Text variant="muted">{RISK_COPY[risk].hint}</Text>

            <StatGroup>
              <Stat
                label="Equity"
                value={
                  overLeveraged
                    ? 'Underwater'
                    : equity !== null
                      ? formatAmount(equity)
                      : '—'
                }
              />
              <Stat
                label="Financed"
                value={`${formatAmount(mortgageValue)} of ${formatAmount(propertyValue)}`}
              />
            </StatGroup>
          </>
        ) : null}
      </ResultPanel>
    </WidgetFrame>
  )
}
