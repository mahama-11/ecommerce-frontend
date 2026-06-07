import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Check, CheckCircle2, Circle, Clock, Download, Info, Loader2, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { AssetVariant, DecisionStep, VersionNode } from '@/types/production'

export function ProductionSectionCard({
  title,
  subtitle,
  children,
  className,
  actions,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5', className)}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-5 text-white/40">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </motion.section>
  )
}

export function DecisionOptionCard({
  option,
  selected,
  active,
  onSelect,
}: {
  option: DecisionStep['options'][number]
  selected: boolean
  active: boolean
  onSelect: () => void
}) {
  return (
    <Button
      data-testid="production-choice-submit"
      data-choice-id={option.id}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative !h-auto min-h-[86px] !items-start !justify-start !whitespace-normal rounded-xl border px-3.5 py-3 text-left transition',
        selected
          ? 'border-violet-400/40 bg-violet-400/[0.08]'
          : active
            ? 'border-white/[0.06] bg-white/[0.025] hover:border-white/[0.12] hover:bg-[var(--ecom-surface-hover)]'
            : 'border-white/[0.04] bg-white/[0.015] hover:border-white/[0.10] hover:bg-[var(--ecom-surface-hover)]',
      )}
    >
      <span className="flex min-w-0 items-center gap-2 pr-4">
        {option.icon && <span className="shrink-0 text-base leading-none">{option.icon}</span>}
        <span className={cn('min-w-0 break-words text-xs font-semibold leading-5', selected ? 'text-violet-200' : 'text-white/70')}>
          {option.label}
        </span>
      </span>
      {option.description && <span className="mt-1 block break-words text-[11px] font-normal leading-5 text-white/40">{option.description}</span>}
      {option.confidence != null && <span className={cn('mt-0.5 text-[9px] tabular-nums', selected ? 'text-violet-400/60' : 'text-white/20')}>{Math.round(option.confidence * 100)}%</span>}
      {selected && <div className="absolute right-1.5 top-1.5"><CheckCircle2 className="h-3 w-3 text-violet-400" /></div>}
    </Button>
  )
}

export function DecisionStepCard({
  step,
  isCurrent,
  onSelectOption,
  pendingLabel = '正在分析 SKU 与参考图，确认后生成选项...',
}: {
  step: DecisionStep
  isCurrent: boolean
  onSelectOption: (stepId: string, optionId: string) => void
  pendingLabel?: string
}) {
  const statusColor = { pending: 'text-white/20', active: 'text-violet-300', completed: 'text-emerald-400' }[step.status]
  const statusIcon = {
    pending: <Circle className="h-3.5 w-3.5" />,
    active: <Circle className="h-3.5 w-3.5 animate-pulse" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  }[step.status]
  const selectedOption = step.options.find((option) => option.id === step.selectedOptionId)
  return (
    <motion.div
      data-testid="production-choice-card"
      data-step-id={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border p-5 transition',
        isCurrent ? 'border-violet-400/30 bg-violet-400/[0.04]' : step.status === 'completed' ? 'border-emerald-400/15 bg-white/[0.015]' : 'border-white/[0.04] bg-white/[0.01] opacity-60',
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04]', statusColor)}>{statusIcon}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/45">决策项 {step.stepNumber}</span>
            {step.status === 'completed' && selectedOption && <span className="max-w-full break-words rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium leading-5 text-emerald-300">当前选择：{selectedOption.label}</span>}
          </div>
          <h4 className={cn('break-words text-sm font-semibold leading-6', statusColor)}>{step.title}</h4>
        </div>
      </div>
      {step.description && <p className="mb-4 text-xs leading-6 text-white/50">{step.description}</p>}
      {(isCurrent || step.status === 'completed') && step.options.length > 0 && (
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {step.options.map((option) => <DecisionOptionCard key={option.id} option={option} selected={option.id === step.selectedOptionId} active={isCurrent} onSelect={() => onSelectOption(step.id, option.id)} />)}
        </div>
      )}
      {step.status === 'pending' && step.options.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-white/15" />
          <span className="text-[10px] text-white/25">{pendingLabel}</span>
        </div>
      )}
    </motion.div>
  )
}

export function EditablePromptCard({
  value,
  dirty,
  onChange,
  onRestore,
  keywords,
  details,
}: {
  value: string
  dirty: boolean
  onChange: (value: string) => void
  onRestore: () => void
  keywords: string[]
  details: Array<{ label: string; value: string }>
}) {
  return (
    <div className="space-y-2 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.045] p-3">
      <div className="block space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-emerald-100/85">本次出图要求</span>
          <span className={dirty ? 'rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100/70' : 'rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-100/60'}>{dirty ? '已手动微调' : '可直接编辑'}</span>
        </div>
        <textarea
          data-testid="production-prompt-editor"
          aria-label="本次出图要求"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          placeholder="系统整理出的出图要求会自动填入这里；你可以直接改文案，点击开始生产时会按这里的内容提交。"
          className="min-h-[156px] w-full resize-y rounded-xl border border-emerald-300/15 bg-black/25 p-3 text-xs leading-6 text-white/80 outline-none placeholder:text-white/25 focus:border-cyan-300/35 focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] leading-5 text-white/40">
          <span>这里的最终文案会随本次生成任务一起提交。</span>
          <Button type="button" onClick={onRestore} className="!h-auto rounded-full px-2.5 py-1 text-cyan-200/65 hover:text-cyan-100">恢复系统方案</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-[10px] leading-5 text-white/48">
        <div><span className="text-white/28">风格关键词：</span>{keywords.length ? keywords.join('、') : '未返回'}</div>
        {details.map((detail) => <div key={detail.label}><span className="text-white/28">{detail.label}：</span>{detail.value}</div>)}
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function VersionIcon({ type }: { type: string }) {
  const icons: Record<string, ReactNode> = { init: <Sparkles className="h-3.5 w-3.5" />, default: <Clock className="h-3.5 w-3.5" /> }
  return <span className="text-white/30">{icons[type] ?? icons.default}</span>
}

export function VersionLineageItem({ node, active, index, onSelect }: { node: VersionNode; active: boolean; index: number; onSelect: () => void }) {
  const isCurrent = node.isCurrent
  return (
    <motion.div
      data-testid="production-version-card"
      data-version-id={node.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn('relative cursor-pointer rounded-xl border p-3 transition', active || isCurrent ? 'border-cyan-400/20 bg-cyan-400/[0.04]' : 'border-transparent bg-transparent hover:bg-[var(--ecom-surface-hover)]')}
    >
      <div className={cn('absolute -left-[calc(1rem-2px)] top-4 h-2 w-2 rounded-full border-2', isCurrent ? 'border-cyan-400 bg-cyan-400' : active ? 'border-cyan-400/50 bg-cyan-400/30' : 'border-white/10 bg-white/10')} />
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0"><VersionIcon type={node.id === 'v-init' ? 'init' : 'default'} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('break-words text-xs font-semibold leading-5', isCurrent ? 'text-cyan-300' : 'text-white/70')}>{node.label}</span>
            {isCurrent && <span className="rounded-full bg-cyan-400/10 px-1.5 py-0.5 text-[9px] text-cyan-300">当前</span>}
          </div>
          <p className="mt-0.5 text-[10px] text-white/30">{fmtDate(node.timestamp)}</p>
          <p className="mt-1 text-[11px] leading-5 text-white/48">{node.description}</p>
          <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-white/[0.035] px-2 py-1">
            <span className="text-[10px] text-white/40">SKU {node.skuBias}%</span>
            <span className="text-[10px] text-white/18">|</span>
            <span className="text-[10px] text-white/40">REF {node.refBias}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function VersionLineage({ nodes, activeId, onSelect, onCompare, onBranch }: { nodes: VersionNode[]; activeId: string | null; onSelect: (id: string) => void; onCompare: () => void; onBranch: () => void }) {
  return (
    <div className="flex max-h-[calc(100vh-10rem)] min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div><h3 className="text-sm font-semibold text-white">版本谱系</h3><p className="text-[10px] text-white/25">Version Lineage</p></div>
        <Button type="button" disabled={nodes.length === 0} onClick={onCompare} title="对比已有生成版本。" className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-2 py-1 text-[10px] text-cyan-200/65 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUpRight className="h-3 w-3" />对比模式</Button>
      </div>
      <div className="relative min-h-0 flex-1 space-y-1 overflow-y-auto pl-4 pr-1 scrollbar-thin">
        {nodes.length > 0 && <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.06]" />}
        {nodes.length === 0 && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-4 text-[11px] leading-relaxed text-amber-200/70">还没有可查看的生成版本。请先在策略配置页提交生产任务，等真实图片结果返回后再进入工坊。</div>}
        {nodes.map((node, index) => <VersionLineageItem key={node.id} node={node} active={node.id === activeId} index={index} onSelect={() => onSelect(node.id)} />)}
      </div>
      <Button type="button" disabled={nodes.length === 0} onClick={onBranch} title="基于当前版本继续生成一个新分支。" className="mt-3 flex w-full shrink-0 items-center justify-center gap-1 rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/[0.04] py-2 text-[11px] text-cyan-200/70 transition hover:border-cyan-400/35 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3.5 w-3.5" />新建分支</Button>
    </div>
  )
}

export function ResultAssetCard({ variant, index, isSelected, onToggle, onZoom, onDownload }: { variant: AssetVariant; index: number; isSelected: boolean; onToggle: () => void; onZoom: () => void; onDownload: () => void }) {
  const [hovered, setHovered] = useState(false)
  const title = String(variant.metadata?.template_name ?? variant.metadata?.template_id ?? variant.metadata?.version_id ?? `结果 ${index + 1}`)
  const subtitle = String(variant.metadata?.source_name ?? variant.metadata?.source_id ?? variant.metadata?.fanout_task_id ?? '')
  return (
    <motion.div data-testid="production-result-card" data-variant-id={variant.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={cn('group relative overflow-hidden rounded-xl border transition', isSelected ? 'border-cyan-400/30 bg-cyan-400/[0.02]' : 'border-white/[0.05] bg-white/[0.01] hover:border-white/10')}>
      <Button type="button" aria-pressed={isSelected} aria-label={`${isSelected ? '取消选择' : '选择'}生成结果 ${index + 1}`} onClick={(event) => { event.stopPropagation(); onToggle() }} className={cn('absolute right-2 top-2 z-10 h-7 rounded-full px-2 text-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition', isSelected ? 'border border-cyan-300/50 bg-cyan-300/20 text-cyan-100' : 'border border-white/12 bg-black/45 text-white/70 hover:border-cyan-300/35 hover:text-cyan-100')}>{isSelected ? <Check className="h-3 w-3" /> : null}<span>{isSelected ? '已选' : '选择'}</span></Button>
      <div role="button" tabIndex={0} aria-label={`选择变体 ${index + 1}`} className="relative aspect-square cursor-pointer overflow-hidden bg-white/[0.02]" onClick={onToggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onToggle() }}>
        <img src={variant.thumbnailUrl} alt={`Variant ${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <AnimatePresence>
          {hovered && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent pb-3"><div className="flex items-center gap-2"><Button type="button" aria-label={`查看生成结果 ${index + 1}`} onClick={(event) => { event.stopPropagation(); onZoom() }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"><Search className="h-3.5 w-3.5" /></Button><Button type="button" aria-label={`下载生成结果 ${index + 1}`} onClick={(event) => { event.stopPropagation(); onDownload() }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"><Download className="h-3.5 w-3.5" /></Button></div></motion.div>}
        </AnimatePresence>
      </div>
      <div className="px-2 py-1.5">
        <div className="line-clamp-2 break-words text-[10px] leading-4 text-white/40" title={title}>{title}</div>
        <div className="line-clamp-2 break-words text-[9px] leading-4 text-white/20" title={subtitle}>{subtitle}</div>
      </div>
    </motion.div>
  )
}

export function ProductionEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-6 text-center">
      <Info className="mb-2 h-8 w-8 text-amber-400/70" />
      <p className="text-xs font-semibold text-amber-300/90">{title}</p>
      <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-white/45">{description}</p>
    </div>
  )
}
