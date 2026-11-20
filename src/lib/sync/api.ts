import type { BudgetSyncPayload } from './types'

export class SyncApiError extends Error {
  readonly status: number
  readonly payload: BudgetSyncPayload | null

  constructor(
    message: string,
    status: number,
    payload: BudgetSyncPayload | null = null,
  ) {
    super(message)
    this.name = 'SyncApiError'
    this.status = status
    this.payload = payload
  }
}

function authHeaders(clientSecret: string): HeadersInit {
  return {
    authorization: `Bearer ${clientSecret}`,
    accept: 'application/json',
  }
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function asPayload(value: unknown): BudgetSyncPayload | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.updatedAt !== 'number') return null
  return {
    updatedAt: record.updatedAt,
    dayBudget: record.dayBudget,
    weekBudget: record.weekBudget,
    knownExpenses: record.knownExpenses,
  }
}

export async function getSync(
  id: string,
  clientSecret: string,
): Promise<BudgetSyncPayload> {
  const response = await fetch(`/api/sync/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: authHeaders(clientSecret),
  })
  const body = await parseJson(response)
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Sync GET failed (${response.status})`
    throw new SyncApiError(message, response.status, asPayload(body))
  }
  const payload = asPayload(body)
  if (!payload) {
    throw new SyncApiError('Invalid sync response', response.status)
  }
  return payload
}

export async function putSync(
  id: string,
  clientSecret: string,
  payload: BudgetSyncPayload,
): Promise<BudgetSyncPayload> {
  const response = await fetch(`/api/sync/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: {
      ...authHeaders(clientSecret),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const body = await parseJson(response)
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Sync POST failed (${response.status})`
    throw new SyncApiError(message, response.status, asPayload(body))
  }
  const next = asPayload(body)
  if (!next) {
    throw new SyncApiError('Invalid sync response', response.status)
  }
  return next
}
