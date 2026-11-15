import type { ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import { Brand } from '../../molecules/Brand/Brand'
import { cn } from '../../../lib/cn'
import './AppShell.css'

export interface ShellNavItem {
  id: string
  name: string
  shortName: string
  description: string
}

interface AppShellProps {
  items: ShellNavItem[]
  activeId: string
  onNavigate: (id: string) => void
  children: ReactNode
}

export function AppShell({
  items,
  activeId,
  onNavigate,
  children,
}: AppShellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const titleId = useId()
  const active = items.find((item) => item.id === activeId) ?? items[0]

  useEffect(() => {
    if (!pickerOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPickerOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen])

  function selectWidget(id: string) {
    onNavigate(id)
    setPickerOpen(false)
  }

  return (
    <div className="ui-shell">
      <div className="ui-shell__glow" aria-hidden="true" />
      <div className="ui-shell__grain" aria-hidden="true" />

      <aside className="ui-shell__rail" aria-label="Widgets">
        <Brand />

        <nav className="ui-shell__nav" aria-label="Switch widget">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                className={cn('ui-shell__nav-item', isActive && 'is-active')}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <span className="ui-shell__nav-name">{item.name}</span>
                <span className="ui-shell__nav-desc">{item.description}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="ui-shell__stage">
        <div className="ui-shell__stage-inner">
          <header className="ui-shell__mobile-brand">
            <Brand compact />
          </header>
          {children}
        </div>
      </main>

      <div className="ui-shell__mobile-nav">
        <button
          type="button"
          className="ui-shell__picker-trigger"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
        >
          <span className="ui-shell__picker-copy">
            <span className="ui-shell__picker-label">Widget</span>
            <span className="ui-shell__picker-name">{active.name}</span>
            <span className="ui-shell__picker-desc">{active.description}</span>
          </span>
          <span className="ui-shell__picker-action">
            Switch
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6.5 8 10.5 12 6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      {pickerOpen ? (
        <div className="ui-shell__sheet" role="presentation">
          <button
            type="button"
            className="ui-shell__sheet-backdrop"
            aria-label="Close widget picker"
            onClick={() => setPickerOpen(false)}
          />
          <div
            className="ui-shell__sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="ui-shell__sheet-handle" aria-hidden="true" />
            <div className="ui-shell__sheet-head">
              <h2 id={titleId} className="ui-shell__sheet-title">
                Choose widget
              </h2>
              <button
                type="button"
                className="ui-shell__sheet-close"
                onClick={() => setPickerOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="ui-shell__sheet-nav" aria-label="Switch widget">
              {items.map((item) => {
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'ui-shell__sheet-item',
                      isActive && 'is-active',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => selectWidget(item.id)}
                  >
                    <span className="ui-shell__sheet-item-text">
                      <span className="ui-shell__sheet-item-name">
                        {item.name}
                      </span>
                      <span className="ui-shell__sheet-item-desc">
                        {item.description}
                      </span>
                    </span>
                    <span className="ui-shell__sheet-item-short">
                      {item.shortName}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  )
}
