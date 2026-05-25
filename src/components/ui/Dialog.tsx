import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

type DialogSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export type DialogProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean
  title: ReactNode
  description?: ReactNode
  onClose?: () => void
  size?: DialogSize
  children: ReactNode
}

export function Dialog({ open = true, title, description, onClose, size = 'md', children, className, ...props }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ecom-dialog-title"
        aria-describedby={description ? 'ecom-dialog-description' : undefined}
        className={cn('w-full overflow-hidden rounded-[var(--ecom-radius-xl)] border border-[var(--ecom-border-strong)] bg-[var(--ecom-dialog-bg)] shadow-[var(--ecom-shadow-dialog)]', sizeClasses[size], className)}
        {...props}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--ecom-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 id="ecom-dialog-title" className="text-base font-semibold text-[var(--ecom-text-primary)]">{title}</h2>
            {description ? <p id="ecom-dialog-description" className="mt-1 text-sm text-[var(--ecom-text-secondary)]">{description}</p> : null}
          </div>
          {onClose ? <Button variant="ghost" size="icon-sm" aria-label="Close Dialog" onClick={onClose}>×</Button> : null}
        </header>
        <div className="px-5 py-4">{children}</div>
      </section>
    </div>
  )
}
