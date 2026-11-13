import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'
import './Text.css'

type TextVariant =
  | 'title'
  | 'lede'
  | 'section'
  | 'label'
  | 'body'
  | 'muted'
  | 'meta'
  | 'metric'
  | 'metricUnit'
  | 'rowTitle'
  | 'rowValue'

type TextTag = 'p' | 'h2' | 'h3' | 'span' | 'div'

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag
  variant?: TextVariant
  children: ReactNode
}

export function Text({
  as: Tag = 'p',
  variant = 'body',
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag className={cn('ui-text', `ui-text--${variant}`, className)} {...props}>
      {children}
    </Tag>
  )
}
