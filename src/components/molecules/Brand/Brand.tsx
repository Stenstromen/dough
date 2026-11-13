import { cn } from '../../../lib/cn'
import './Brand.css'

interface BrandProps {
  className?: string
  compact?: boolean
}

export function Brand({ className, compact = false }: BrandProps) {
  return (
    <div className={cn('ui-brand', compact && 'ui-brand--compact', className)}>
      <span className="ui-brand__mark" aria-hidden="true" />
      <div className="ui-brand__text">
        <p className="ui-brand__name">Dough</p>
        <p className="ui-brand__tag">Finance widgets</p>
      </div>
    </div>
  )
}
