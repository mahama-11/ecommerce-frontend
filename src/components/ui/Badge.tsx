import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'cyan' | 'emerald' | 'amber' | 'rose'
type BadgeVariant = 'soft' | 'outline' | 'solid'

const toneVariantClasses: Record<BadgeTone, Record<BadgeVariant, string>> = {
  neutral: {
    soft: 'border-white/10 bg-white/[0.06] text-[var(--ecom-text-secondary)]',
    outline: 'border-white/15 bg-transparent text-[var(--ecom-text-secondary)]',
    solid: 'border-white/20 bg-white/15 text-white',
  },
  cyan: {
    soft: 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100',
    outline: 'border-cyan-300/35 bg-transparent text-cyan-100',
    solid: 'border-cyan-200/60 bg-cyan-300 text-slate-950',
  },
  emerald: {
    soft: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100',
    outline: 'border-emerald-300/35 bg-transparent text-emerald-100',
    solid: 'border-emerald-200/60 bg-emerald-300 text-slate-950',
  },
  amber: {
    soft: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100',
    outline: 'border-amber-300/35 bg-transparent text-amber-100',
    solid: 'border-amber-200/60 bg-amber-300 text-slate-950',
  },
  rose: {
    soft: 'border-rose-300/20 bg-rose-300/[0.08] text-rose-100',
    outline: 'border-rose-300/35 bg-transparent text-rose-100',
    solid: 'border-rose-200/60 bg-rose-300 text-slate-950',
  },
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ className, tone = 'neutral', variant = 'soft', children, ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]', toneVariantClasses[tone][variant], className)} {...props}>
      {children}
    </span>
  )
}
