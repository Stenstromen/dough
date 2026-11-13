import { AppShell } from './components'
import { usePersistedState } from './lib/usePersistedState'
import { defaultWidgetId, getWidget, widgets } from './widgets/registry'
import type { WidgetId } from './widgets/types'

function isWidgetId(value: unknown): value is WidgetId {
  return (
    typeof value === 'string' &&
    widgets.some((widget) => widget.id === value)
  )
}

function App() {
  const [activeId, setActiveId] = usePersistedState(
    'dough:active-widget',
    defaultWidgetId,
    isWidgetId,
  )
  const active = getWidget(activeId)
  const ActiveWidget = active.Component

  return (
    <AppShell
      items={widgets}
      activeId={activeId}
      onNavigate={(id) => setActiveId(id as WidgetId)}
    >
      <ActiveWidget />
    </AppShell>
  )
}

export default App
