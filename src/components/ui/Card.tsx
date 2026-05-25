import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type CardSurface = 'default' | 'raised' | 'subtle'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const surfaceClasses: Record<CardSurface, string> = {
  default: 'border-[var(--ecom-border)] bg-[var(--ecom-surface)]',
  raised: 'border-[var(--ecom-border-strong)] bg-[var(--ecom-surface-raised)] shadow-[var(--ecom-shadow-card)]',
  subtle: 'border-[var(--ecom-border)] bg-[var(--ecom-surface-muted)]',
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  surface?: CardSurface
  padding?: CardPadding
  children: ReactNode
}

export function Card({ className, surface = 'default', padding = 'md', children, ...props }: CardProps) {
  return (
    <section className={cn('rounded-[var(--ecom-radius-xl)] border text-[var(--ecom-text-primary)]', surfaceClasses[surface], paddingClasses[padding], className)} {...props}>
      {children}
    </section>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('mb-4 space-y-1', className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return <h3 className={cn('text-base font-semibold text-[var(--ecom-text-primary)]', className)} {...props}>{children}</h3>
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }) {
  return <p className={cn('text-sm leading-relaxed text-[var(--ecom-text-secondary)]', className)} {...props}>{children}</p>
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('space-y-3', className)} {...props}>{children}</div>
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('mt-4 flex items-center justify-end gap-2', className)} {...props}>{children}</div>
}
