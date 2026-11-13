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
    name: 'Monthly payment',
    shortName: 'Pay',
    description: 'Split loans & 12-month plan',
    Component: MortgagePayment,
  },
  {
    id: 'financing',
    name: 'Financing planner',
    shortName: 'Plan',
    description: 'Compare original vs adjusted',
    Component: FinancingPlanner,
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
