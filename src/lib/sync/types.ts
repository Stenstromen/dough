export interface BudgetSyncPayload {
  updatedAt: number
  dayBudget: unknown
  weekBudget: unknown
  knownExpenses: unknown
}

export interface BudgetSyncContent {
  dayBudget: unknown
  weekBudget: unknown
  knownExpenses: unknown
}

export const DAY_BUDGET_KEY = 'dough:day-budget'
export const WEEK_BUDGET_KEY = 'dough:week-budget'
export const KNOWN_EXPENSES_SYNC_KEY = 'dough:known-expenses'
export const SYNC_CONFIG_KEY = 'dough:sync-config'
export const SYNC_APPLY_EVENT = 'dough:sync-apply'
export const SYNC_PERSIST_EVENT = 'dough:persist'

export const SYNC_DATA_KEYS = [
  DAY_BUDGET_KEY,
  WEEK_BUDGET_KEY,
  KNOWN_EXPENSES_SYNC_KEY,
] as const

export type SyncDataKey = (typeof SYNC_DATA_KEYS)[number]
