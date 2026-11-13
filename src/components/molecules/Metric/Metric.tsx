import type { ReactNode } from 'react'
import { Text } from '../../atoms/Text/Text'
import { cn } from '../../../lib/cn'
import './Metric.css'

interface MetricProps {
  value: ReactNode
  unit?: ReactNode
  label?: ReactNode
  className?: string
}

export function Metric({ value, unit, label, className }: MetricProps) {
  return (
    <div className={cn('ui-metric', className)}>
      {label ? <Text variant="section">{label}</Text> : null}
      <p className="ui-metric__value">
        <Text as="span" variant="metric">
          {value}
        </Text>
        {unit ? (
          <Text as="span" variant="metricUnit">
            {unit}
          </Text>
        ) : null}
      </p>
    </div>
  )
}
