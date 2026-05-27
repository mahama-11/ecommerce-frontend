import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'

type Action = { label: string; onClick?: () => void; disabled?: boolean; href?: string }
type Step = { label: string; desc?: string; status?: 'done' | 'active' | 'locked' }
type Asset = { label: string; desc?: string; status?: 'ready' | 'needed' | 'optional' }
type Tool = { id: string; title: string; desc?: string; icon?: ReactNode; active?: boolean; recommended?: boolean; disabled?: boolean; onClick?: () => void }

function actionButton(action?: Action, className?: string) {
  if (!action) return null
  return <Button type="button" onClick={action.onClick} disabled={action.disabled} className={cn('rounded-2xl px-5 py-3 text-sm', className)}>{action.label}</Button>
}

export function ProductHeroStage({ eyebrow, title, description, objectLabel, objectValue, primaryAction, secondary, children, className }: HTMLAttributes<HTMLElement> & {
  eyebrow?: string; title: string; description?: string; objectLabel?: string; objectValue?: string; primaryAction?: Action; secondary?: ReactNode; children?: ReactNode
}) {
  return <section data-composition="product-hero-stage" className={cn('relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.045))] p-6 shadow-[0_32px_110px_rgba(0,0,0,.42)] sm:p-8', className)}>
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-3 text-xs font-semibold uppercase tracking-[.24em] text-cyan-100/65">{eyebrow}</div> : null}
        <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">{description}</p> : null}
        {objectValue ? <div className="mt-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-sm text-white/72"><span className="text-white/38">{objectLabel}</span><span className="min-w-0 break-words font-medium text-white">{objectValue}</span></div> : null}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
        {actionButton(primaryAction, 'bg-white text-black hover:bg-cyan-50')}
        {secondary}
      </div>
    </div>
    {children ? <div className="mt-7">{children}</div> : null}
  </section>
}

export function WorkflowProgressRail({ steps, className }: HTMLAttributes<HTMLDivElement> & { steps: Step[] }) {
  return <div data-composition="workflow-progress-rail" className={cn('flex flex-col gap-2 rounded-[24px] border border-white/8 bg-white/[.035] p-3 sm:flex-row', className)}>
    {steps.map((step, index) => <div key={`${step.label}-${index}`} className={cn('min-w-0 flex-1 rounded-2xl px-3 py-3', step.status === 'active' ? 'bg-cyan-300/[.10] text-cyan-50' : step.status === 'done' ? 'bg-emerald-300/[.08] text-emerald-50/85' : 'bg-white/[.035] text-white/45')}>
      <div className="text-xs font-semibold">{String(index + 1).padStart(2, '0')} · {step.label}</div>
      {step.desc ? <div className="mt-1 truncate text-xs opacity-65">{step.desc}</div> : null}
    </div>)}
  </div>
}

export function VisualOutcomePreview({ title, subtitle, selectedLabel, className }: HTMLAttributes<HTMLDivElement> & { title: string; subtitle?: string; selectedLabel?: string }) {
  return <div data-composition="visual-outcome-preview" className={cn('relative min-h-[260px] overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_62%_18%,rgba(99,102,241,.24),transparent_28%),radial-gradient(circle_at_18%_70%,rgba(16,185,129,.18),transparent_30%),rgba(255,255,255,.055)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]', className)}>
    <div className="absolute inset-8 rounded-[28px] border border-dashed border-white/12" />
    <div className="absolute right-8 top-8 h-28 w-24 rotate-6 rounded-[24px] border border-white/12 bg-white/[.08] shadow-2xl" />
    <div className="absolute bottom-8 left-8 h-32 w-44 -rotate-3 rounded-[26px] border border-cyan-200/20 bg-cyan-200/[.10] shadow-2xl" />
    <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between">
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle ? <p className="mt-2 max-w-sm text-xs leading-5 text-white/52">{subtitle}</p> : null}
      </div>
      <div className="inline-flex w-fit rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/62">{selectedLabel}</div>
    </div>
  </div>
}

export function ProductAssetStrip({ assets, className }: HTMLAttributes<HTMLDivElement> & { assets: Asset[] }) {
  return <div data-composition="product-asset-strip" className={cn('grid gap-2 sm:grid-cols-3', className)}>
    {assets.map(asset => <div key={asset.label} className={cn('rounded-2xl px-3 py-3', asset.status === 'ready' ? 'bg-emerald-300/[.08] text-emerald-50' : asset.status === 'needed' ? 'bg-amber-300/[.08] text-amber-50' : 'bg-white/[.045] text-white/62')}>
      <div className="text-xs font-semibold">{asset.label}</div>
      {asset.desc ? <div className="mt-1 text-[11px] leading-5 opacity-65">{asset.desc}</div> : null}
    </div>)}
  </div>
}

export function RecommendedToolRail({ tools, className }: HTMLAttributes<HTMLDivElement> & { tools: Tool[] }) {
  return <div data-composition="recommended-tool-rail" className={cn('grid gap-3 md:grid-cols-3', className)}>
    {tools.map(tool => <Button key={tool.id} type="button" onClick={tool.onClick} disabled={tool.disabled} className={cn('group h-auto min-h-[132px] w-full items-stretch justify-start whitespace-normal rounded-[24px] border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60', tool.active ? 'border-cyan-200/40 bg-cyan-200/[.12] shadow-[0_20px_60px_rgba(34,211,238,.10)]' : 'border-white/10 bg-white/[.045] hover:-translate-y-0.5 hover:bg-[var(--ecom-surface-hover)]', tool.disabled && 'cursor-not-allowed opacity-45')}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/20 text-xl">{tool.icon}</div>
        <div className="min-w-0">
          {tool.recommended ? <div className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-100/70">Recommended</div> : null}
          <div className="break-words text-sm font-semibold leading-snug text-white/90">{tool.title}</div>
          {tool.desc ? <div className="mt-2 text-xs leading-5 text-white/46">{tool.desc}</div> : null}
        </div>
      </div>
    </Button>)}
  </div>
}

export function GenerationActionDock({ primaryAction, note, className }: HTMLAttributes<HTMLDivElement> & { primaryAction?: Action; note?: string }) {
  return <div data-composition="generation-action-dock" className={cn('rounded-[24px] border border-white/10 bg-white/[.055] p-4', className)}>
    {actionButton(primaryAction, 'w-full bg-white text-black hover:bg-cyan-50')}
    {note ? <div className="mt-3 text-xs leading-5 text-white/45">{note}</div> : null}
  </div>
}

export function ResultDestinationCard({ title, description, className }: HTMLAttributes<HTMLDivElement> & { title: string; description?: string }) {
  return <div data-composition="result-destination-card" className={cn('rounded-[24px] border border-emerald-200/15 bg-emerald-200/[.07] p-4 text-emerald-50/82', className)}>
    <div className="text-sm font-semibold">{title}</div>
    {description ? <p className="mt-2 text-xs leading-5 opacity-70">{description}</p> : null}
  </div>
}

export function ToolCategoryCarousel({ title, children, className }: HTMLAttributes<HTMLDivElement> & { title: string; children: ReactNode }) {
  return <section data-composition="tool-category-carousel" className={cn('space-y-3', className)}><h2 className="text-sm font-semibold text-white/82">{title}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div></section>
}

export function SoftInspectorPanel({ title, children, className }: HTMLAttributes<HTMLDivElement> & { title: string; children?: ReactNode }) {
  return <aside data-composition="soft-inspector-panel" className={cn('rounded-[30px] border border-white/10 bg-white/[.06] p-5 shadow-[0_20px_80px_rgba(0,0,0,.30)]', className)}>
    <div className="mb-4 text-sm font-semibold text-white/90">{title}</div>
    {children}
  </aside>
}
