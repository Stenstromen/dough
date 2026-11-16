import { Budget503020 } from './Budget503020/Budget503020'
import { DayBudget } from './DayBudget/DayBudget'
import { FinancingPlanner } from './FinancingPlanner/FinancingPlanner'
import { LtvCalculator } from './LtvCalculator/LtvCalculator'
import { MortgagePayment } from './MortgagePayment/MortgagePayment'
import type { WidgetDefinition, WidgetId } from './types'

export const widgets: WidgetDefinition[] = [
  {
    id: 'ltv',
    name: 'Loan-to-value',
    shortName: 'LTV',
    description: 'Property value vs mortgage',
    Component: LtvCalculator,
  },
  {
    id: 'mortgage',
    name: 'Mortgage payment plan',
    shortName: 'Loan',
    description: 'Split parts & 12-month plan',
    Component: MortgagePayment,
  },
  {
    id: 'financing',
    name: 'Financing planner',
    shortName: 'Plan',
    description: 'Compare original vs adjusted',
    Component: FinancingPlanner,
  },
  {
    id: 'budget',
    name: '50 / 30 / 20',
    shortName: '50/30',
    description: 'Needs, wants & savings',
    Component: Budget503020,
  },
  {
    id: 'day-budget',
    name: 'Day budget',
    shortName: 'Day',
    description: 'Spendable per day to payday',
    Component: DayBudget,
  },
]

export const defaultWidgetId: WidgetId = 'ltv'

export function getWidget(id: WidgetId): WidgetDefinition {
  const widget = widgets.find((entry) => entry.id === id)
  if (!widget) {
    return widgets[0]
  }
  return widget
}
