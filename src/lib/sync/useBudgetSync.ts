import { useCallback, useEffect, useRef, useState } from 'react'
import { getSync, putSync, SyncApiError } from './api'
import {
  decodePairingCode,
  encodePairingCode,
  generateSyncCredentials,
  type SyncCredentials,
} from './credentials'
import {
  applyRemotePayload,
  buildSyncPayload,
  contentHash,
  readBudgetSyncContent,
} from './storage'
import {
  SYNC_CONFIG_KEY,
  SYNC_DATA_KEYS,
  SYNC_PERSIST_EVENT,
  type BudgetSyncPayload,
} from './types'

const PULL_INTERVAL_MS = 15 * 60 * 1000
const PUSH_DEBOUNCE_MS = 500

export interface SyncConfig {
  active: boolean
  id: string
  clientSecret: string
  localUpdatedAt: number
  lastPulledAt: number | null
  lastPushedAt: number | null
}

export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface BudgetSyncController {
  active: boolean
  status: SyncStatus
  error: string | null
  pairingCode: string | null
  truncatedId: string | null
  lastPulledAt: number | null
  lastPushedAt: number | null
  activate: () => Promise<void>
  join: (pairingCode: string) => Promise<boolean>
  deactivate: () => void
  refresh: () => Promise<void>
  copyPairingCode: () => Promise<boolean>
}

const INACTIVE_CONFIG: SyncConfig = {
  active: false,
  id: '',
  clientSecret: '',
  localUpdatedAt: 0,
  lastPulledAt: null,
  lastPushedAt: null,
}

function readConfig(): SyncConfig {
  try {
    const raw = window.localStorage.getItem(SYNC_CONFIG_KEY)
    if (!raw) return INACTIVE_CONFIG
    const parsed = JSON.parse(raw) as Partial<SyncConfig>
    if (
      typeof parsed.active !== 'boolean' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.clientSecret !== 'string'
    ) {
      return INACTIVE_CONFIG
    }
    return {
      active: parsed.active,
      id: parsed.id,
      clientSecret: parsed.clientSecret,
      localUpdatedAt:
        typeof parsed.localUpdatedAt === 'number' ? parsed.localUpdatedAt : 0,
      lastPulledAt:
        typeof parsed.lastPulledAt === 'number' ? parsed.lastPulledAt : null,
      lastPushedAt:
        typeof parsed.lastPushedAt === 'number' ? parsed.lastPushedAt : null,
    }
  } catch {
    return INACTIVE_CONFIG
  }
}

function writeConfig(config: SyncConfig): void {
  window.localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config))
}

function truncateId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function isSyncPersistEvent(event: Event): boolean {
  if (!(event instanceof CustomEvent)) return false
  const key = (event.detail as { key?: unknown } | undefined)?.key
  return typeof key === 'string' && SYNC_DATA_KEYS.includes(key as never)
}

export function useBudgetSync(): BudgetSyncController {
  const [config, setConfig] = useState<SyncConfig>(() =>
    typeof window === 'undefined' ? INACTIVE_CONFIG : readConfig(),
  )
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const configRef = useRef(config)
  const lastSyncedHashRef = useRef<string | null>(null)
  const pushTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const skipNextPullRef = useRef(false)
  const recoveredSessionRef = useRef<string | null>(null)

  useEffect(() => {
    configRef.current = config
  }, [config])

  const persistConfig = useCallback((next: SyncConfig) => {
    configRef.current = next
    writeConfig(next)
    setConfig(next)
  }, [])

  const rememberSynced = useCallback((payload: BudgetSyncPayload) => {
    lastSyncedHashRef.current = contentHash({
      dayBudget: payload.dayBudget,
      weekBudget: payload.weekBudget,
      knownExpenses: payload.knownExpenses,
    })
  }, [])

  const runPush = useCallback(
    async (override?: SyncConfig) => {
      const current = override ?? configRef.current
      if (!current.active || !current.id || !current.clientSecret) return
      if (inFlightRef.current) return

      const content = readBudgetSyncContent()
      const hash = contentHash(content)
      if (
        lastSyncedHashRef.current !== null &&
        hash === lastSyncedHashRef.current &&
        current.lastPushedAt !== null
      ) {
        return
      }

      const updatedAt = Math.max(current.localUpdatedAt, Date.now())
      const payload: BudgetSyncPayload = {
        updatedAt,
        ...content,
      }

      inFlightRef.current = true
      setStatus('syncing')
      setError(null)
      try {
        const saved = await putSync(current.id, current.clientSecret, payload)
        rememberSynced(saved)
        persistConfig({
          ...current,
          localUpdatedAt: saved.updatedAt,
          lastPushedAt: Date.now(),
        })
        setStatus('idle')
      } catch (err) {
        if (err instanceof SyncApiError && err.status === 409 && err.payload) {
          applyRemotePayload(err.payload)
          rememberSynced(err.payload)
          persistConfig({
            ...current,
            localUpdatedAt: err.payload.updatedAt,
            lastPulledAt: Date.now(),
          })
          setStatus('idle')
          setError(null)
        } else {
          setStatus('error')
          setError(err instanceof Error ? err.message : 'Push failed')
        }
      } finally {
        inFlightRef.current = false
      }
    },
    [persistConfig, rememberSynced],
  )

  const schedulePush = useCallback(() => {
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current)
    }
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null
      void runPush()
    }, PUSH_DEBOUNCE_MS)
  }, [runPush])

  const runPull = useCallback(
    async (override?: SyncConfig): Promise<boolean> => {
      const current = override ?? configRef.current
      if (!current.active || !current.id || !current.clientSecret) return false
      if (inFlightRef.current) return false

      inFlightRef.current = true
      setStatus('syncing')
      setError(null)
      try {
        const remote = await getSync(current.id, current.clientSecret)
        if (remote.updatedAt > current.localUpdatedAt) {
          applyRemotePayload(remote)
          rememberSynced(remote)
          persistConfig({
            ...current,
            localUpdatedAt: remote.updatedAt,
            lastPulledAt: Date.now(),
          })
        } else {
          rememberSynced(buildSyncPayload(current.localUpdatedAt))
          persistConfig({
            ...current,
            lastPulledAt: Date.now(),
          })
        }
        setStatus('idle')
        return true
      } catch (err) {
        if (err instanceof SyncApiError && err.status === 404) {
          persistConfig({
            ...current,
            lastPulledAt: Date.now(),
          })
          setStatus('idle')
          setError(null)
          return true
        }
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Pull failed')
        return false
      } finally {
        inFlightRef.current = false
      }
    },
    [persistConfig, rememberSynced],
  )

  useEffect(() => {
    function onPersist(event: Event) {
      if (!configRef.current.active) return
      if (!isSyncPersistEvent(event)) return

      const content = readBudgetSyncContent()
      const hash = contentHash(content)
      if (
        lastSyncedHashRef.current !== null &&
        hash === lastSyncedHashRef.current
      ) {
        return
      }

      const next: SyncConfig = {
        ...configRef.current,
        localUpdatedAt: Date.now(),
      }
      persistConfig(next)
      schedulePush()
    }

    window.addEventListener(SYNC_PERSIST_EVENT, onPersist)
    return () => window.removeEventListener(SYNC_PERSIST_EVENT, onPersist)
  }, [persistConfig, schedulePush])

  useEffect(() => {
    if (!config.active) return
    if (skipNextPullRef.current) {
      skipNextPullRef.current = false
    } else {
      void runPull()
    }

    const timer = window.setInterval(() => {
      void runPull()
    }, PULL_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [config.active, config.id, config.clientSecret, runPull])

  useEffect(() => {
    if (!config.active) {
      recoveredSessionRef.current = null
      return
    }
    const sessionKey = `${config.id}:${config.clientSecret}`
    if (recoveredSessionRef.current === sessionKey) return
    recoveredSessionRef.current = sessionKey

    if (
      config.lastPushedAt === null ||
      config.localUpdatedAt > config.lastPushedAt
    ) {
      schedulePush()
    }
  }, [
    config.active,
    config.id,
    config.clientSecret,
    config.lastPushedAt,
    config.localUpdatedAt,
    schedulePush,
  ])

  useEffect(() => {
    return () => {
      if (pushTimerRef.current !== null) {
        window.clearTimeout(pushTimerRef.current)
      }
    }
  }, [])

  const activate = useCallback(async () => {
    const credentials = generateSyncCredentials()
    const now = Date.now()
    const next: SyncConfig = {
      active: true,
      id: credentials.id,
      clientSecret: credentials.clientSecret,
      localUpdatedAt: now,
      lastPulledAt: null,
      lastPushedAt: null,
    }
    skipNextPullRef.current = true
    persistConfig(next)
    setError(null)
    await runPush(next)
  }, [persistConfig, runPush])

  const join = useCallback(
    async (pairingCode: string) => {
      const credentials = decodePairingCode(pairingCode)
      if (!credentials) {
        setStatus('error')
        setError('Invalid pairing code')
        return false
      }
      const next: SyncConfig = {
        active: true,
        id: credentials.id,
        clientSecret: credentials.clientSecret,
        localUpdatedAt: 0,
        lastPulledAt: null,
        lastPushedAt: null,
      }
      skipNextPullRef.current = true
      persistConfig(next)
      setError(null)
      const ok = await runPull(next)
      if (!ok) {
        persistConfig(INACTIVE_CONFIG)
        return false
      }
      return true
    },
    [persistConfig, runPull],
  )

  const deactivate = useCallback(() => {
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current)
      pushTimerRef.current = null
    }
    skipNextPullRef.current = false
    lastSyncedHashRef.current = null
    persistConfig(INACTIVE_CONFIG)
    setStatus('idle')
    setError(null)
  }, [persistConfig])

  const refresh = useCallback(async () => {
    await runPull()
  }, [runPull])

  const copyPairingCode = useCallback(async () => {
    const current = configRef.current
    if (!current.active) return false
    const code = encodePairingCode({
      id: current.id,
      clientSecret: current.clientSecret,
    } satisfies SyncCredentials)
    try {
      await navigator.clipboard.writeText(code)
      return true
    } catch {
      return false
    }
  }, [])

  const pairingCode = config.active
    ? encodePairingCode({
        id: config.id,
        clientSecret: config.clientSecret,
      })
    : null

  return {
    active: config.active,
    status,
    error,
    pairingCode,
    truncatedId: config.active ? truncateId(config.id) : null,
    lastPulledAt: config.lastPulledAt,
    lastPushedAt: config.lastPushedAt,
    activate,
    join,
    deactivate,
    refresh,
    copyPairingCode,
  }
}
