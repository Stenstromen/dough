import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
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

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore quota / private-mode failures.
    }
  }, [key, value])

  return [value, setValue]
}
