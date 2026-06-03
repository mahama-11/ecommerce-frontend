import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { EcomShell } from '@/components/ui/EcomShell'

type ShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

function ShellFrame({
  children,
  className,
  eyebrow,
  title,
  description,
  actions,
  variant,
  ...props
}: ShellProps & { variant: string }) {
  return (
    <EcomShell className={cn('overflow-x-hidden', className)} {...props} data-page-shell={variant}>
      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-8 lg:px-8">
        {(eyebrow || title || description || actions) && (
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ecom-text-faint)]">{eyebrow}</p>}
              {title && <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--ecom-text-primary)] md:text-5xl">{title}</h1>}
              {description && <p className="max-w-3xl text-sm leading-6 text-[var(--ecom-text-secondary)] md:text-base">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
          </header>
        )}
        {children}
      </main>
    </EcomShell>
  )
}

export function MarketingShell(props: ShellProps) {
  return <ShellFrame {...props} variant="marketing-page" />
}

export function WorkspaceShell(props: ShellProps) {
  return <ShellFrame {...props} variant="workspace-home" />
}

export function ObjectDetailShell(props: ShellProps) {
  return <ShellFrame {...props} variant="object-detail" />
}

export function ProductionStationShell(props: ShellProps) {
  return <ShellFrame {...props} variant="production-station" />
}

export function LibraryManagementShell(props: ShellProps) {
  return <ShellFrame {...props} variant="library-management" />
}

export function SettingsShell(props: ShellProps) {
  return <ShellFrame {...props} variant="settings-admin" />
}

export const PAGE_TYPE_SHELLS = {
  'marketing-page': MarketingShell,
  'workspace-home': WorkspaceShell,
  'object-detail': ObjectDetailShell,
  'production-station': ProductionStationShell,
  'library-management': LibraryManagementShell,
  'settings-admin': SettingsShell,
} as const
