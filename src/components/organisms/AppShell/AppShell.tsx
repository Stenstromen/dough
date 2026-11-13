import type { ReactNode } from 'react'
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
                className={cn(
                  'ui-shell__nav-item',
                  isActive && 'is-active',
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <span className="ui-shell__nav-name">{item.name}</span>
                <span className="ui-shell__nav-desc">{item.description}</span>
              </button>
            )
          })}
        </nav>

        <p className="ui-shell__footer">Add more widgets anytime</p>
      </aside>

      <main className="ui-shell__stage">
        <div className="ui-shell__stage-inner">
          <header className="ui-shell__mobile-brand">
            <Brand compact />
          </header>
          {children}
        </div>
      </main>

      <nav className="ui-shell__dock" aria-label="Switch widget">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              className={cn('ui-shell__dock-item', isActive && 'is-active')}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className="ui-shell__dock-short">{item.shortName}</span>
              <span className="ui-shell__dock-name">{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
