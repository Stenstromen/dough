import type { ReactNode } from 'react'
import { Text } from '../../atoms/Text/Text'
import { cn } from '../../../lib/cn'
import './BreakdownList.css'

interface BreakdownItem {
  id: string
  title: ReactNode
  meta?: ReactNode
  value: ReactNode
}

interface BreakdownListProps {
  items: BreakdownItem[]
  className?: string
}

export function BreakdownList({ items, className }: BreakdownListProps) {
  return (
    <ul className={cn('ui-breakdown', className)}>
      {items.map((item) => (
        <li key={item.id} className="ui-breakdown__row">
          <div>
            <Text variant="rowTitle">{item.title}</Text>
            {item.meta ? (
              <Text variant="meta" className="ui-breakdown__meta">
                {item.meta}
              </Text>
            ) : null}
          </div>
          <Text as="p" variant="rowValue">
            {item.value}
          </Text>
        </li>
      ))}
    </ul>
  )
}
