import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EcomShell({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('min-h-screen bg-[var(--ecom-bg)] text-[var(--ecom-text-primary)]', className)} {...props}>
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-[var(--ecom-accent-cyan-soft)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-[var(--ecom-accent-emerald-soft)] blur-3xl" />
      </div>
      {children}
    </div>
  )
}

export function EcomHeader({ className, children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <header className={cn('sticky top-0 z-40 border-b border-[var(--ecom-border)] bg-[var(--ecom-header-bg)] backdrop-blur-xl', className)} {...props}>
      <div className="mx-auto flex h-[52px] max-w-[1440px] items-center justify-between gap-4 px-5">
        {children}
      </div>
    </header>
  )
}

export function EcomNavPill({ className, active = false, children, ...props }: HTMLAttributes<HTMLSpanElement> & { active?: boolean; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--ecom-radius-sm)] px-3 py-1.5 text-xs font-medium transition', active ? 'bg-[var(--ecom-surface-active)] text-[var(--ecom-text-primary)]' : 'text-[var(--ecom-text-muted)] hover:bg-[var(--ecom-surface-hover)] hover:text-[var(--ecom-text-primary)]', className)} {...props}>
      {children}
    </span>
  )
}

export function EcomCommandDialog({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--ecom-radius-xl)] border border-[var(--ecom-border-strong)] bg-[var(--ecom-dialog-bg)] shadow-[var(--ecom-shadow-dialog)]">
        {children}
      </div>
    </div>
  )
}
