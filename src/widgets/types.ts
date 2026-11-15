import type { ComponentType } from 'react'

export type WidgetId = 'ltv' | 'mortgage' | 'financing' | 'budget' | 'day-budget'

export interface WidgetDefinition {
  id: WidgetId
  name: string
  shortName: string
  description: string
  Component: ComponentType
}
