import type { FormEvent } from 'react'
import {
  Field,
  Metric,
  ResultPanel,
  Stack,
  Text,
  WidgetFrame,
} from '../../components'
import { formatAmount, formatInputAmount, parseAmount } from '../../lib/format'
import { usePersistedState } from '../../lib/usePersistedState'
import { allocateBudget503020 } from './calculate'
import './Budget503020.css'

interface BudgetState {
  incomeRaw: string
}

const INITIAL_STATE: BudgetState = {
  incomeRaw: '',
}

function isBudgetState(value: unknown): value is BudgetState {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.incomeRaw === 'string'
}

export function Budget503020() {
  const [state, setState] = usePersistedState(
    'dough:budget-50-30-20',
    INITIAL_STATE,
    isBudgetState,
  )

  const income = parseAmount(state.incomeRaw)
  const result = income !== null ? allocateBudget503020(income) : null
  const ready = result !== null

  return (
    <WidgetFrame
      title="50 / 30 / 20 budget"
      description="Split take-home pay into needs, wants, and savings. Use after-tax income for the clearest monthly targets."
    >
      <Stack
        as="form"
        gap="lg"
        onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
      >
        <Field
          label="Monthly take-home income"
          inputMode="numeric"
          autoComplete="off"
          inputSize="lg"
          placeholder="35 000"
          value={state.incomeRaw}
          onChange={(event) =>
            setState({
              incomeRaw: formatInputAmount(event.target.value),
            })
          }
        />
      </Stack>

      <ResultPanel
        ready={ready}
        placeholder="Enter your monthly take-home income to see the 50/30/20 split."
      >
        {ready && result ? (
          <>
            <Metric
              label="Monthly plan"
              value={formatAmount(Math.round(result.income))}
            />

            <div
              className="budget__bar"
              aria-hidden="true"
              title="50% needs · 30% wants · 20% savings"
            >
              <span className="budget__bar-needs" />
              <span className="budget__bar-wants" />
              <span className="budget__bar-savings" />
            </div>

            <ul className="budget__list">
              {result.allocations.map((bucket) => (
                <li
                  key={bucket.id}
                  className={`budget__item budget__item--${bucket.id}`}
                >
                  <div className="budget__item-head">
                    <div>
                      <Text variant="rowTitle">
                        {bucket.percentLabel} · {bucket.label}
                      </Text>
                      <Text variant="meta" className="budget__item-desc">
                        {bucket.description}
                      </Text>
                    </div>
                    <Text as="p" variant="rowValue">
                      {formatAmount(Math.round(bucket.amount))}
                    </Text>
                  </div>
                  <Text variant="meta">{bucket.note}</Text>
                </li>
              ))}
            </ul>

            <Text variant="meta">
              Treat the split as a guide, not a hard law — high housing markets
              often push needs above 50%. Keep minimum loan payments in needs,
              and put any extra repayments in the savings bucket.
            </Text>
          </>
        ) : null}
      </ResultPanel>
    </WidgetFrame>
  )
}
