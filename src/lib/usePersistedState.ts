import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { SYNC_APPLY_EVENT, SYNC_PERSIST_EVENT } from './sync/types'

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function dispatchPersist(key: string): void {
  window.dispatchEvent(
    new CustomEvent(SYNC_PERSIST_EVENT, {
      detail: { key },
    }),
  )
}

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  isValid?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    const stored = readStored<unknown>(key, initialValue)
    if (isValid) {
      return isValid(stored) ? stored : initialValue
    }
    return (stored as T) ?? initialValue
  })
  const skipPersistEventRef = useRef(true)

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      if (skipPersistEventRef.current) {
        skipPersistEventRef.current = false
        return
      }
      dispatchPersist(key)
    } catch {
      // Ignore quota / private-mode failures.
    }
  }, [key, value])

  useEffect(() => {
    function rehydrateFromStorage() {
      const stored = readStored<unknown>(key, initialValue)
      const next = isValid
        ? isValid(stored)
          ? stored
          : initialValue
        : ((stored as T) ?? initialValue)
      setValue((current) => {
        try {
          if (JSON.stringify(current) === JSON.stringify(next)) return current
        } catch {
          // Fall through and apply.
        }
        return next
      })
    }

    function onSyncApply(event: Event) {
      if (!(event instanceof CustomEvent)) return
      const keys = (event.detail as { keys?: unknown } | undefined)?.keys
      if (!Array.isArray(keys) || !keys.includes(key)) return
      rehydrateFromStorage()
    }

    function onStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) return
      if (event.key !== key && event.key !== null) return
      rehydrateFromStorage()
    }

    window.addEventListener(SYNC_APPLY_EVENT, onSyncApply)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SYNC_APPLY_EVENT, onSyncApply)
      window.removeEventListener('storage', onStorage)
    }
  }, [key, initialValue, isValid])

  return [value, setValue]
}
