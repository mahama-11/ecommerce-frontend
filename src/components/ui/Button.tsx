import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon-sm'

const baseClass = 'ecom-ui-button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ecom-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ecom-bg)] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--ecom-action-primary)] text-[var(--ecom-action-primary-text)] shadow-[var(--ecom-shadow-action)] hover:bg-[var(--ecom-action-primary-hover)]',
  secondary: 'border border-[var(--ecom-border-strong)] bg-[var(--ecom-surface-raised)] text-[var(--ecom-text-primary)] hover:border-[var(--ecom-border-bright)] hover:bg-[var(--ecom-surface-hover)]',
  ghost: 'text-[var(--ecom-text-secondary)] hover:bg-[var(--ecom-surface-hover)] hover:text-[var(--ecom-text-primary)]',
  quiet: 'border border-[var(--ecom-border)] bg-[var(--ecom-surface)] text-[var(--ecom-text-muted)] hover:border-[var(--ecom-border-strong)] hover:text-[var(--ecom-text-secondary)]',
  danger: 'border border-rose-300/25 bg-rose-500/12 text-rose-100 hover:border-rose-200/40 hover:bg-rose-500/18',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-[var(--ecom-radius-sm)] px-3 text-xs',
  md: 'h-9 rounded-[var(--ecom-radius-md)] px-4 text-sm',
  lg: 'h-11 rounded-[var(--ecom-radius-lg)] px-5 text-sm',
  'icon-sm': 'h-8 min-w-8 rounded-[var(--ecom-radius-sm)] px-2 text-xs',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({ className, variant = 'secondary', size = 'md', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(baseClass, variants[variant], sizes[size], className)} {...props} />
}

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function ButtonLink({ className, variant = 'secondary', size = 'md', ...props }: ButtonLinkProps) {
  return <Link className={cn(baseClass, variants[variant], sizes[size], className)} {...props} />
}

export type ExternalButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function ExternalButtonLink({ className, variant = 'secondary', size = 'md', ...props }: ExternalButtonLinkProps) {
  return <a className={cn(baseClass, variants[variant], sizes[size], className)} {...props} />
}
