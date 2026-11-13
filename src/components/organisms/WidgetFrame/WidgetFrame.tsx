import type { ReactNode } from 'react'
import { Text } from '../../atoms/Text/Text'
import { Stack } from '../../atoms/Stack/Stack'
import { cn } from '../../../lib/cn'
import './WidgetFrame.css'

interface WidgetFrameProps {
  title: string
  description: ReactNode
  children: ReactNode
  className?: string
}

export function WidgetFrame({
  title,
  description,
  children,
  className,
}: WidgetFrameProps) {
  return (
    <Stack gap="xl" className={cn('ui-widget-frame', className)}>
      <header className="ui-widget-frame__intro">
        <Text as="h2" variant="title">
          {title}
        </Text>
        <Text variant="lede">{description}</Text>
      </header>
      {children}
    </Stack>
  )
}
