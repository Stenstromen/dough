import { useState } from 'react'
import { Button, Field, Stack, Text } from '../../components'
import { useBudgetSync } from '../../lib/sync/useBudgetSync'
import { usePersistedState } from '../../lib/usePersistedState'
import './BudgetSyncPanel.css'

function formatSyncTime(value: number | null): string {
  if (value === null) return 'Never'
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return new Date(value).toLocaleTimeString()
  }
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function BudgetSyncPanel() {
  const sync = useBudgetSync()
  const [hidden, setHidden] = usePersistedState(
    'dough:sync-panel-hidden',
    false,
    isBoolean,
  )
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await sync.copyPairingCode()
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function handleJoin() {
    const joined = await sync.join(joinCode)
    if (joined) {
      setJoinCode('')
      setShowJoin(false)
    }
  }

  if (sync.active && hidden) {
    return (
      <section
        className="budget-sync budget-sync--collapsed"
        aria-label="Budget sync"
      >
        <div className="budget-sync__collapsed">
          <div className="budget-sync__collapsed-status">
            <span className="budget-sync__dot" aria-hidden="true" />
            <Text variant="meta" className="budget-sync__collapsed-label">
              Sync active
              {sync.status === 'syncing'
                ? ' · Syncing…'
                : sync.error
                  ? ' · Error'
                  : ''}
            </Text>
          </div>
          <div className="budget-sync__actions">
            <Button variant="ghost" onClick={() => setHidden(false)}>
              Show
            </Button>
            <Button
              variant="accent"
              disabled={sync.status === 'syncing'}
              onClick={() => void sync.refresh()}
            >
              {sync.status === 'syncing' ? 'Syncing…' : 'Refresh'}
            </Button>
          </div>
        </div>
        {sync.error ? (
          <Text variant="meta" className="budget-sync__error">
            {sync.error}
          </Text>
        ) : null}
      </section>
    )
  }

  return (
    <section className="budget-sync" aria-label="Budget sync">
      <div className="budget-sync__head">
        <div className="budget-sync__titles">
          <Text variant="section">Sync</Text>
          <Text variant="meta">
            Keep day budget, week budget, and known expenses aligned across
            devices.
          </Text>
        </div>
        {sync.active ? (
          <div className="budget-sync__head-actions">
            <Text variant="meta" className="budget-sync__id">
              {sync.truncatedId}
            </Text>
            <Button variant="ghost" onClick={() => setHidden(true)}>
              Hide
            </Button>
          </div>
        ) : null}
      </div>

      {sync.active ? (
        <Stack gap="md">
          <Field
            label="Pairing code"
            value={sync.pairingCode ?? ''}
            readOnly
            clearable={false}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="budget-sync__actions">
            <Button variant="accent" onClick={() => void handleCopy()}>
              {copied ? 'Copied' : 'Copy pairing code'}
            </Button>
            <Button
              variant="accent"
              disabled={sync.status === 'syncing'}
              onClick={() => void sync.refresh()}
            >
              {sync.status === 'syncing' ? 'Syncing…' : 'Refresh'}
            </Button>
            <Button variant="danger" onClick={sync.deactivate}>
              Disable
            </Button>
          </div>
          <Text variant="meta">
            Last pull {formatSyncTime(sync.lastPulledAt)} · Last push{' '}
            {formatSyncTime(sync.lastPushedAt)}
            {sync.status === 'syncing' ? ' · Syncing…' : ''}
          </Text>
          {sync.error ? (
            <Text variant="meta" className="budget-sync__error">
              {sync.error}
            </Text>
          ) : null}
        </Stack>
      ) : (
        <Stack gap="md">
          <div className="budget-sync__actions">
            <Button
              variant="accent"
              disabled={sync.status === 'syncing'}
              onClick={() => void sync.activate()}
            >
              Enable sync
            </Button>
            <Button
              variant="ghost"
              aria-expanded={showJoin}
              onClick={() => setShowJoin((open) => !open)}
            >
              {showJoin ? 'Cancel join' : 'Join with pairing code'}
            </Button>
          </div>

          {showJoin ? (
            <Stack gap="md">
              <Field
                label="Pairing code"
                value={joinCode}
                autoComplete="off"
                spellCheck={false}
                placeholder="uuid.secret"
                onChange={(event) => setJoinCode(event.target.value)}
              />
              <div className="budget-sync__actions">
                <Button
                  variant="accent"
                  disabled={!joinCode.trim() || sync.status === 'syncing'}
                  onClick={() => void handleJoin()}
                >
                  Join
                </Button>
              </div>
            </Stack>
          ) : null}

          {sync.error ? (
            <Text variant="meta" className="budget-sync__error">
              {sync.error}
            </Text>
          ) : null}
        </Stack>
      )}
    </section>
  )
}
