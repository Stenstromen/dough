import { Button } from '../../components'
import './budgetDeltas.css'

const POSITIVE_DELTAS = [1000, 100, 10, 1] as const
const NEGATIVE_DELTAS = [-1000, -100, -10, -1] as const

interface BudgetDeltasProps {
  onDelta: (delta: number) => void
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta)
}

export function BudgetDeltas({ onDelta }: BudgetDeltasProps) {
  return (
    <div className="budget-deltas" role="group" aria-label="Quick sum update">
      <div className="budget-deltas__row" aria-label="Increase sum">
        {POSITIVE_DELTAS.map((delta) => (
          <Button
            key={delta}
            className="budget-deltas__button"
            variant="accent"
            onClick={() => onDelta(delta)}
          >
            {formatDelta(delta)}
          </Button>
        ))}
      </div>
      <div className="budget-deltas__row" aria-label="Decrease sum">
        {NEGATIVE_DELTAS.map((delta) => (
          <Button
            key={delta}
            className="budget-deltas__button"
            variant="ghost"
            onClick={() => onDelta(delta)}
          >
            {formatDelta(delta)}
          </Button>
        ))}
      </div>
    </div>
  )
}
