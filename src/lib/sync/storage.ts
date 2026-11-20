import {
  DAY_BUDGET_KEY,
  KNOWN_EXPENSES_SYNC_KEY,
  SYNC_APPLY_EVENT,
  SYNC_DATA_KEYS,
  WEEK_BUDGET_KEY,
  type BudgetSyncContent,
  type BudgetSyncPayload,
  type SyncDataKey,
} from './types'

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function readBudgetSyncContent(): BudgetSyncContent {
  return {
    dayBudget: readJson(DAY_BUDGET_KEY),
    weekBudget: readJson(WEEK_BUDGET_KEY),
    knownExpenses: readJson(KNOWN_EXPENSES_SYNC_KEY),
  }
}

export function contentHash(content: BudgetSyncContent): string {
  return JSON.stringify({
    dayBudget: content.dayBudget,
    weekBudget: content.weekBudget,
    knownExpenses: content.knownExpenses,
  })
}

export function buildSyncPayload(updatedAt: number): BudgetSyncPayload {
  return {
    updatedAt,
    ...readBudgetSyncContent(),
  }
}

export function applyRemotePayload(payload: BudgetSyncPayload): SyncDataKey[] {
  const writes: Array<[SyncDataKey, unknown]> = [
    [DAY_BUDGET_KEY, payload.dayBudget],
    [WEEK_BUDGET_KEY, payload.weekBudget],
    [KNOWN_EXPENSES_SYNC_KEY, payload.knownExpenses],
  ]

  const changed: SyncDataKey[] = []
  for (const [key, value] of writes) {
    if (value === null || value === undefined) continue
    const next = JSON.stringify(value)
    const previous = window.localStorage.getItem(key)
    if (previous === next) continue
    window.localStorage.setItem(key, next)
    changed.push(key)
  }

  window.dispatchEvent(
    new CustomEvent(SYNC_APPLY_EVENT, {
      detail: { keys: changed.length > 0 ? changed : [...SYNC_DATA_KEYS] },
    }),
  )

  return changed
}
