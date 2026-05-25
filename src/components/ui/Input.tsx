import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type InputTone = 'default' | 'danger' | 'success'
type InputSize = 'sm' | 'md' | 'lg'

const toneClasses: Record<InputTone, string> = {
  default: 'border-[var(--ecom-border-strong)] focus-visible:border-[var(--ecom-border-bright)] focus-visible:ring-[var(--ecom-focus-ring)]',
  danger: 'border-rose-300/35 focus-visible:border-rose-200/60 focus-visible:ring-rose-300/45',
  success: 'border-emerald-300/30 focus-visible:border-emerald-200/55 focus-visible:ring-emerald-300/40',
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 rounded-[var(--ecom-radius-sm)] px-2.5 text-xs',
  md: 'h-9 rounded-[var(--ecom-radius-md)] px-3 text-sm',
  lg: 'h-11 rounded-[var(--ecom-radius-lg)] px-4 text-sm',
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  tone?: InputTone
  inputSize?: InputSize
  label?: ReactNode
  error?: ReactNode
  helperText?: ReactNode
}

export function Input({ className, tone = 'default', inputSize = 'md', label, error, helperText, id, name, type = 'text', ...props }: InputProps) {
  const describedBy = error ? `${id ?? name}-error` : helperText ? `${id ?? name}-helper` : undefined
  const input = (
    <input
      id={id}
      name={name}
      type={type}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy}
      className={cn(
        'w-full border bg-[var(--ecom-surface)] text-[var(--ecom-text-primary)] placeholder:text-[var(--ecom-text-faint)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ecom-bg)] disabled:cursor-not-allowed disabled:opacity-50',
        toneClasses[error ? 'danger' : tone],
        sizeClasses[inputSize],
        className,
      )}
      {...props}
    />
  )
  if (!label && !error && !helperText) return input
  return (
    <label className="block space-y-1.5 text-sm text-[var(--ecom-text-secondary)]">
      {label ? <span className="font-medium text-[var(--ecom-text-primary)]">{label}</span> : null}
      {input}
      {error ? <span id={`${id ?? name}-error`} className="block text-xs text-rose-200" role="alert">{error}</span> : null}
      {!error && helperText ? <span id={`${id ?? name}-helper`} className="block text-xs text-[var(--ecom-text-muted)]">{helperText}</span> : null}
    </label>
  )
}
