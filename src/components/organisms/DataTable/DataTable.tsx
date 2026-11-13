import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './DataTable.css'

interface DataTableProps {
  headers: ReactNode[]
  children: ReactNode
  className?: string
  minWidth?: string
}

export function DataTable({
  headers,
  children,
  className,
  minWidth = '36rem',
}: DataTableProps) {
  return (
    <div className={cn('ui-table-wrap', className)}>
      <table className="ui-table" style={{ minWidth }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface DataCellProps {
  children?: ReactNode
  primary?: ReactNode
  secondary?: ReactNode
  strong?: boolean
}

export function DataCell({
  children,
  primary,
  secondary,
  strong = false,
}: DataCellProps) {
  if (primary !== undefined) {
    return (
      <td className={cn(strong && 'ui-table__strong')}>
        <span className="ui-table__primary">{primary}</span>
        {secondary ? (
          <span className="ui-table__secondary">{secondary}</span>
        ) : null}
      </td>
    )
  }

  return <td className={cn(strong && 'ui-table__strong')}>{children}</td>
}
