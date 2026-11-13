import { useId, useMemo } from 'react'
import {
  BreakdownList,
  Button,
  Checkbox,
  DataCell,
  DataTable,
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
  formatAmount,
  formatInputAmount,
  formatInputRate,
  parseAmount,
  parseRate,
} from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import { buildSchedule, type LoanPartInput } from './schedule'
import './MortgagePayment.css'

interface PartDraft {
  id: string
  name: string
  balance: string
  rate: string
  amortize: boolean
  amortizeAmount: string
}

interface MortgageState {
  parts: PartDraft[]
  sameInterest: boolean
  nextPartNumber: number
}

const INITIAL_PARTS: PartDraft[] = [
  {
    id: 'part-1',
    name: 'Part A',
    balance: '',
    rate: '',
    amortize: true,
    amortizeAmount: '',
  },
  {
    id: 'part-2',
    name: 'Part B',
    balance: '',
    rate: '',
    amortize: false,
    amortizeAmount: '',
  },
]

const INITIAL_MORTGAGE: MortgageState = {
  parts: INITIAL_PARTS,
  sameInterest: false,
  nextPartNumber: 3,
}

function isPartDraft(value: unknown): value is PartDraft {
  if (!value || typeof value !== 'object') return false
  const part = value as Record<string, unknown>
  return (
    typeof part.id === 'string' &&
    typeof part.name === 'string' &&
    typeof part.balance === 'string' &&
    typeof part.rate === 'string' &&
    typeof part.amortize === 'boolean' &&
    typeof part.amortizeAmount === 'string'
  )
}

function isMortgageState(value: unknown): value is MortgageState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    Array.isArray(record.parts) &&
    record.parts.length > 0 &&
    record.parts.every(isPartDraft) &&
    typeof record.sameInterest === 'boolean' &&
    typeof record.nextPartNumber === 'number'
  )
}

function createPart(
  nextPartNumber: number,
  partial?: Partial<PartDraft>,
): PartDraft {
  return {
    id: `part-${nextPartNumber}`,
    name: '',
    balance: '',
    rate: '',
    amortize: false,
    amortizeAmount: '',
    ...partial,
  }
}

function partLabel(part: PartDraft, index: number): string {
  const trimmed = part.name.trim()
  return trimmed || `Part ${index + 1}`
}

export function MortgagePayment() {
  const baseId = useId()
  const [state, setState] = usePersistedState(
    'dough:mortgage',
    INITIAL_MORTGAGE,
    isMortgageState,
  )
  const { parts, sameInterest } = state
  const sharedInterestId = `${baseId}-same-interest`

  const parsedParts: LoanPartInput[] = useMemo(
    () =>
      parts.flatMap((part, index) => {
        const balance = parseAmount(part.balance)
        const annualRate = parseRate(part.rate)
        if (balance === null || annualRate === null || balance <= 0) {
          return []
        }

        const monthlyAmortization = part.amortize
          ? (parseAmount(part.amortizeAmount) ?? 0)
          : 0

        return [
          {
            id: part.id,
            name: partLabel(part, index),
            balance,
            annualRate,
            amortize: part.amortize,
            monthlyAmortization,
          },
        ]
      }),
    [parts],
  )

  const schedule = useMemo(
    () => (parsedParts.length > 0 ? buildSchedule(parsedParts, 12) : []),
    [parsedParts],
  )

  const firstMonth = schedule[0] ?? null
  const ready = firstMonth !== null

  function updatePart(id: string, patch: Partial<PartDraft>) {
    setState((current) => ({
      ...current,
      parts: current.parts.map((part) =>
        part.id === id ? { ...part, ...patch } : part,
      ),
    }))
  }

  function updateRate(id: string, rate: string) {
    setState((current) => ({
      ...current,
      parts: current.sameInterest
        ? current.parts.map((part) => ({ ...part, rate }))
        : current.parts.map((part) =>
            part.id === id ? { ...part, rate } : part,
          ),
    }))
  }

  function toggleSameInterest(enabled: boolean) {
    setState((current) => {
      if (!enabled) {
        return { ...current, sameInterest: false }
      }

      const sharedRate =
        current.parts.find((part) => part.rate.trim() !== '')?.rate ?? ''

      return {
        ...current,
        sameInterest: true,
        parts: current.parts.map((part) => ({ ...part, rate: sharedRate })),
      }
    })
  }

  function removePart(id: string) {
    setState((current) =>
      current.parts.length <= 1
        ? current
        : {
            ...current,
            parts: current.parts.filter((part) => part.id !== id),
          },
    )
  }

  function addPart() {
    setState((current) => ({
      ...current,
      nextPartNumber: current.nextPartNumber + 1,
      parts: [
        ...current.parts,
        createPart(current.nextPartNumber, {
          name: `Part ${current.parts.length + 1}`,
          rate: current.sameInterest ? (current.parts[0]?.rate ?? '') : '',
          amortize: false,
        }),
      ],
    }))
  }

  return (
    <WidgetFrame
      title="Monthly payment"
      description="Split a mortgage into parts with their own rates, choose what you amortize each month, and see the cost for the next twelve months."
    >
      <Stack gap="lg">
        {parts.map((part, index) => (
          <Surface as="section" key={part.id} variant="panel">
            <div className="mortgage__part-head">
              <Field
                grow
                label="Name"
                autoComplete="off"
                placeholder={`Part ${index + 1}`}
                value={part.name}
                onChange={(event) =>
                  updatePart(part.id, { name: event.target.value })
                }
              />
              {parts.length > 1 ? (
                <Button variant="danger" onClick={() => removePart(part.id)}>
                  Remove
                </Button>
              ) : null}
            </div>

            <Stack gap="md" columns="part-grid">
              <Field
                label="Mortgage size"
                inputMode="numeric"
                autoComplete="off"
                placeholder="1 200 000"
                value={part.balance}
                onChange={(event) =>
                  updatePart(part.id, {
                    balance: formatInputAmount(event.target.value),
                  })
                }
              />

              <Stack gap="sm">
                <Field
                  label="Interest %"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="4.5"
                  value={part.rate}
                  onChange={(event) =>
                    updateRate(part.id, formatInputRate(event.target.value))
                  }
                />
                {index === 0 && parts.length > 1 ? (
                  <Checkbox
                    id={sharedInterestId}
                    tone="muted"
                    label="Same interest for all parts"
                    checked={sameInterest}
                    onChange={(event) =>
                      toggleSameInterest(event.target.checked)
                    }
                  />
                ) : null}
              </Stack>
            </Stack>

            <Stack gap="md">
              <Checkbox
                id={`${baseId}-${part.id}-amortize`}
                label="Amortize this part monthly"
                checked={part.amortize}
                onChange={(event) =>
                  updatePart(part.id, { amortize: event.target.checked })
                }
              />
              {part.amortize ? (
                <Field
                  label="Monthly amortization"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="5 000"
                  value={part.amortizeAmount}
                  onChange={(event) =>
                    updatePart(part.id, {
                      amortizeAmount: formatInputAmount(event.target.value),
                    })
                  }
                />
              ) : null}
            </Stack>
          </Surface>
        ))}

        <Button variant="accent" className="mortgage__add" onClick={addPart}>
          Add another part
        </Button>
      </Stack>

      <ResultPanel
        ready={ready}
        placeholder="Enter at least one part with size and interest to see payments."
      >
        {ready && firstMonth ? (
          <>
            <Stack gap="lg" columns="auto-2">
              <Metric
                label="Total this month"
                value={formatAmount(Math.round(firstMonth.totalPayment))}
              />
              <StatGroup>
                <Stat
                  label="Interest"
                  value={formatAmount(Math.round(firstMonth.totalInterest))}
                />
                <Stat
                  label="Amortization"
                  value={formatAmount(
                    Math.round(firstMonth.totalAmortization),
                  )}
                />
              </StatGroup>
            </Stack>

            <div>
              <Text variant="section" className="mortgage__section">
                Per part
              </Text>
              <BreakdownList
                items={firstMonth.parts.map((part) => ({
                  id: part.id,
                  title: part.name,
                  meta:
                    part.amortization > 0
                      ? `Interest ${formatAmount(Math.round(part.interest))} · Amortization ${formatAmount(Math.round(part.amortization))}`
                      : `Interest ${formatAmount(Math.round(part.interest))} · Interest only`,
                  value: formatAmount(Math.round(part.payment)),
                }))}
              />
            </div>

            <div>
              <Text variant="section" className="mortgage__section">
                Payment plan · next 12 months
              </Text>
              <DataTable
                headers={[
                  'Month',
                  ...parsedParts.map((part) => part.name),
                  'Total',
                  'Remaining',
                ]}
              >
                {schedule.map((month) => {
                  const remaining = month.parts.reduce(
                    (sum, part) => sum + part.closingBalance,
                    0,
                  )
                  return (
                    <tr key={month.monthIndex}>
                      <th scope="row">{month.label}</th>
                      {month.parts.map((part) => (
                        <DataCell
                          key={part.id}
                          primary={formatAmount(Math.round(part.payment))}
                          secondary={
                            part.amortization > 0
                              ? `${formatAmount(Math.round(part.interest))} int · ${formatAmount(Math.round(part.amortization))} am`
                              : `${formatAmount(Math.round(part.interest))} int`
                          }
                        />
                      ))}
                      <DataCell strong>
                        {formatAmount(Math.round(month.totalPayment))}
                      </DataCell>
                      <DataCell>
                        {formatAmount(Math.round(remaining))}
                      </DataCell>
                    </tr>
                  )
                })}
              </DataTable>
            </div>
          </>
        ) : null}
      </ResultPanel>
    </WidgetFrame>
  )
}
