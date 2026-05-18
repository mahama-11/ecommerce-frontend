import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Download,
  Loader2,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  RotateCw,
  Save,
  Plus,
  X,
  Clock,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkshopStore } from '@/store/productionStore'
import * as productionApi from '@/services/production'
import { createExportPackage } from '@/services/product'
import { useToastStore } from '@/store/toastStore'
import type { AssetVariant, VersionNode } from '@/types/production'
import { isDevMode } from '@/mocks/productionDemo'

// ─── Mock Variant Images (placeholder URLs) ──────────────────

const VARIANT_THUMBS = [
  'https://picsum.photos/seed/workshop1/400/400',
  'https://picsum.photos/seed/workshop2/400/400',
  'https://picsum.photos/seed/workshop3/400/400',
  'https://picsum.photos/seed/workshop4/400/400',
  'https://picsum.photos/seed/workshop5/400/400',
  'https://picsum.photos/seed/workshop6/400/400',
  'https://picsum.photos/seed/workshop7/400/400',
  'https://picsum.photos/seed/workshop8/400/400',
]

const MOCK_VARIANTS: AssetVariant[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `var-1.2-${String(i + 1).padStart(2, '0')}`,
  intentId: 'intent-1.2',
  assetUrl: VARIANT_THUMBS[i],
  thumbnailUrl: VARIANT_THUMBS[i],
  width: 1024,
  height: 1024,
  status: 'ready',
  score: [92, 88, 85, 90, 87, 83, 91, 89][i],
  metadata: { version: 'V1.2' },
  createdAt: new Date(Date.now() - (7 - i) * 60000).toISOString(),
}))

// ─── Format Date ─────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Version Icon ────────────────────────────────────────────

function VersionIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    init: <Sparkles className="h-3.5 w-3.5" />,
    default: <Clock className="h-3.5 w-3.5" />,
  }
  return (
    <span className="text-white/30">{icons[type] ?? icons.default}</span>
  )
}

// ─── Version Lineage (Left Panel) ────────────────────────────

function VersionLineage({
  nodes,
  activeId,
  onSelect,
  onCompare,
  onBranch,
}: {
  nodes: VersionNode[]
  activeId: string | null
  onSelect: (id: string) => void
  onCompare: () => void
  onBranch: () => void
}) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">版本谱系</h3>
          <p className="text-[10px] text-white/25">Version Lineage</p>
        </div>
        <button
          type="button"
          disabled={nodes.length === 0}
          onClick={onCompare}
          title="对比已有生成版本。"
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-2 py-1 text-[10px] text-cyan-200/65 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUpRight className="h-3 w-3" />
          对比模式
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-1 pl-4">
        {/* Vertical line */}
        {nodes.length > 0 && <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.06]" />}

        {nodes.length === 0 && (
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-4 text-[11px] leading-relaxed text-amber-200/70">
            还没有可查看的生成版本。请先在策略配置页提交生产任务，等真实图片结果返回后再进入工坊。
          </div>
        )}

        {nodes.map((node, idx) => {
          const isActive = node.id === activeId
          const isCurrent = node.isCurrent

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(node.id)}
              className={`relative cursor-pointer rounded-xl border p-3 transition ${
                isActive || isCurrent
                  ? 'border-cyan-400/20 bg-cyan-400/[0.04]'
                  : 'border-transparent bg-transparent hover:bg-white/[0.02]'
              }`}
            >
              {/* Dot on timeline */}
              <div
                className={`absolute -left-[calc(1rem-2px)] top-4 h-2 w-2 rounded-full border-2 ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-400'
                    : isActive
                      ? 'border-cyan-400/50 bg-cyan-400/30'
                      : 'border-white/10 bg-white/10'
                }`}
              />

              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">
                  <VersionIcon type={node.id === 'v-init' ? 'init' : 'default'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium ${isCurrent ? 'text-cyan-400' : 'text-white/60'}`}>
                      {node.label}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-cyan-400/10 px-1 py-0.5 text-[8px] text-cyan-400">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[9px] text-white/25">{fmtDate(node.timestamp)}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/40">{node.description}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-white/[0.03] px-1.5 py-0.5">
                    <span className="text-[9px] text-white/30">SKU {node.skuBias}%</span>
                    <span className="text-[9px] text-white/15">|</span>
                    <span className="text-[9px] text-white/30">REF {node.refBias}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* New branch button */}
      <button
        type="button"
        disabled={nodes.length === 0}
        onClick={onBranch}
        title="基于当前版本继续生成一个新分支。"
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/[0.04] py-2 text-[11px] text-cyan-200/70 transition hover:border-cyan-400/35 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        新建分支
      </button>
    </div>
  )
}

// ─── Variant Card ────────────────────────────────────────────

function VariantCard({
  variant,
  index,
  isSelected,
  onToggle,
  onZoom,
  onDownload,
}: {
  variant: AssetVariant
  index: number
  isSelected: boolean
  onToggle: () => void
  onZoom: () => void
  onDownload: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden rounded-xl border transition ${
        isSelected
          ? 'border-cyan-400/30 bg-cyan-400/[0.02]'
          : 'border-white/[0.05] bg-white/[0.01] hover:border-white/10'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition ${
          isSelected
            ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-400'
            : 'border-white/10 bg-black/30 text-transparent hover:border-white/20'
        }`}
      >
        <Check className="h-3 w-3" />
      </button>

      {/* Image */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden bg-white/[0.02]"
        onClick={onToggle}
      >
        <img
          src={variant.thumbnailUrl}
          alt={`Variant ${index + 1}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay actions */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent pb-3"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onZoom()
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload()
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <div className="px-2 py-1.5">
        <div className="truncate text-[10px] text-white/40">
          {String(variant.metadata?.template_name ?? variant.metadata?.template_id ?? variant.metadata?.version_id ?? `结果 ${index + 1}`)}
        </div>
        <div className="truncate text-[9px] text-white/20">
          {String(variant.metadata?.source_name ?? variant.metadata?.source_id ?? variant.metadata?.fanout_task_id ?? '')}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Variant Grid (Center) ───────────────────────────────────

function VariantGrid({
  variants,
  selectedIds,
  busy,
  onToggle,
  onZoom,
  onDownload,
  onFinalize,
}: {
  variants: AssetVariant[]
  selectedIds: string[]
  busy: boolean
  onToggle: (id: string) => void
  onZoom: (variant: AssetVariant) => void
  onDownload: (variant: AssetVariant) => void
  onFinalize: () => void
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('全部版本')
  const [sort, setSort] = useState('最新优先')
  const templateOptions = Array.from(new Set(variants.map(v => String(v.metadata?.template_name ?? v.metadata?.template_id ?? '')).filter(Boolean)))
  const sourceOptions = Array.from(new Set(variants.map(v => String(v.metadata?.source_name ?? v.metadata?.source_id ?? '')).filter(Boolean)))
  const filteredVariants = variants.filter((variant) => {
    if (filter === '全部版本') return true
    return filter === String(variant.metadata?.template_name ?? variant.metadata?.template_id ?? '')
      || filter === String(variant.metadata?.source_name ?? variant.metadata?.source_id ?? '')
  })

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">
            生成结果（{variants.length}）
          </h3>
          <p className="text-[10px] text-white/25">Generation Results</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded p-1 transition ${viewMode === 'grid' ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/50'}`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded p-1 transition ${viewMode === 'list' ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/50'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={variants.length === 0}
              className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] py-1 pl-2 pr-6 text-[10px] text-white/50 outline-none"
            >
              <option>全部版本</option>
              {templateOptions.map((option) => <option key={`tpl-${option}`}>{option}</option>)}
              {sourceOptions.map((option) => <option key={`src-${option}`}>{option}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              disabled={variants.length === 0}
              className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] py-1 pl-2 pr-6 text-[10px] text-white/50 outline-none"
            >
              <option>最新优先</option>
              <option>评分优先</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {variants.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-6 text-center">
          <Info className="mb-2 h-8 w-8 text-amber-400/70" />
          <p className="text-xs font-semibold text-amber-300/90">暂时没有可迭代的图片</p>
          <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-white/45">
            还没有真实生成结果。系统不会用占位图冒充结果；请回到策略配置页提交生产，等待图片返回后再进入。
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVariants.map((variant, idx) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              index={idx}
              isSelected={selectedIds.includes(variant.id)}
              onToggle={() => onToggle(variant.id)}
              onZoom={() => onZoom(variant)}
              onDownload={() => onDownload(variant)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVariants.map((variant, idx) => (
            <div
              key={variant.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] p-2"
            >
              <img
                src={variant.thumbnailUrl}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-white/60">{String(variant.metadata?.version_id ?? variant.id).slice(0, 18)} · {String(idx + 1).padStart(2, '0')}</span>
              </div>
              <button
                type="button"
                onClick={() => onToggle(variant.id)}
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  selectedIds.includes(variant.id)
                    ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-400'
                    : 'border-white/10 text-transparent'
                }`}
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selection counter */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30">
          已选择 {selectedIds.length} / {filteredVariants.length} 张图片
        </span>
        <div className="flex items-center gap-3">
          {selectedIds.length === 0 && variants.length > 0 && (
            <button
              type="button"
              onClick={() => filteredVariants.forEach((variant) => onToggle(variant.id))}
              className="text-[11px] text-cyan-400/60 hover:text-cyan-400"
            >
              全选真实资产
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onToggle('__clear_all__')}
              className="text-[11px] text-cyan-400/60 hover:text-cyan-400"
            >
              清空选择
            </button>
          )}
          <button
            type="button"
            disabled={selectedIds.length === 0 || busy}
            onClick={onFinalize}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-white/30"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            定稿回流
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Weight Control (Right Panel) ────────────────────────────

function WeightControl({
  weightParams,
  hasVersions,
  activeVersionLabel,
  busy,
  advancedExpanded,
  onWeightChange,
  onToggleAdvanced,
  onBatchDownload,
  onRegenerate,
  onSaveTemplate,
}: {
  weightParams: { skuBias: number; styleStrength: number; identityConsistency: number; creativeFreedom: number }
  hasVersions: boolean
  activeVersionLabel: string | null
  busy: boolean
  advancedExpanded: boolean
  onWeightChange: (params: Partial<typeof weightParams>) => void
  onToggleAdvanced: () => void
  onBatchDownload: () => void
  onRegenerate: () => void
  onSaveTemplate: () => void
}) {
  const refPercent = 100 - weightParams.skuBias

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">版本控制台</h3>
          <p className="text-[10px] text-white/25">Version Control</p>
        </div>
        <span className="text-[10px] text-white/20">{hasVersions && activeVersionLabel ? `当前版本 ${activeVersionLabel}` : 'No active version'}</span>
      </div>

      {!hasVersions && (
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-3 text-[11px] leading-relaxed text-amber-200/70">
          Controls are disabled until real generation versions are available.
        </div>
      )}

      {/* Weight Re-iteration */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <h4 className="text-[11px] font-medium text-white/60">权重再迭代</h4>
          <span className="text-[9px] text-white/20">Weight Re-iteration</span>
          <Info className="h-3 w-3 text-white/15" />
        </div>

        {/* Bias display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/30">身份一致性（SKU）</p>
            <p className="text-sm font-semibold text-cyan-400">{weightParams.skuBias}%</p>
            <p className="text-[9px] text-white/20">Identity Consistency</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/30">风格迁移（参考图）</p>
            <p className="text-sm font-semibold text-violet-400">{refPercent}%</p>
            <p className="text-[9px] text-white/20">Style Transfer (Reference)</p>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-violet-500 transition-all duration-300"
              style={{ width: `${weightParams.skuBias}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weightParams.skuBias}
            disabled={!hasVersions}
            onChange={(e) => onWeightChange({ skuBias: Number(e.target.value) })}
            className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
          />
          {/* Thumb indicator */}
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white/30 bg-[#1a1d29] shadow-lg transition-all"
            style={{ left: `calc(${weightParams.skuBias}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] text-white/20">
          <span>0%</span>
          <span className="text-white/15">向左更像 SKU 本体，向右更偏向参考图风格</span>
          <span>100%</span>
        </div>
      </div>

      {/* Advanced Tuning (Collapsible) */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01]">
        <button
          type="button"
          disabled={!hasVersions}
          onClick={onToggleAdvanced}
          className="flex w-full items-center justify-between px-3 py-2.5"
        >
          <div className="flex items-center gap-1">
            <h4 className="text-[11px] font-medium text-white/60">高级微调</h4>
            <span className="text-[9px] text-white/20">Advanced Tuning</span>
          </div>
          {advancedExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-white/20" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-white/20" />
          )}
        </button>

        <AnimatePresence>
          {advancedExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-white/[0.03] px-3 py-3">
                {/* Style Strength */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">风格强度（Style Strength）</span>
                    <span className="text-[10px] tabular-nums text-white/40">{weightParams.styleStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weightParams.styleStrength}
                    disabled={!hasVersions}
                    onChange={(e) => onWeightChange({ styleStrength: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                  />
                </div>

                {/* Identity Consistency */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">身份一致性（ID Consistency）</span>
                    <span className="text-[10px] tabular-nums text-white/40">{weightParams.identityConsistency.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weightParams.identityConsistency}
                    disabled={!hasVersions}
                    onChange={(e) => onWeightChange({ identityConsistency: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                  />
                </div>

                {/* Creative Freedom */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">创意自由度（Creative Freedom）</span>
                    <span className="text-[10px] tabular-nums text-white/40">{weightParams.creativeFreedom.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weightParams.creativeFreedom}
                    disabled={!hasVersions}
                    onChange={(e) => onWeightChange({ creativeFreedom: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-cyan-400"
                  />
                </div>

                <p className="text-[9px] text-white/15">高级参数将在重新生成时生效</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={!hasVersions || busy}
          onClick={onBatchDownload}
          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4 text-white/40" />
          <span className="text-[10px] text-white/40">批量下载</span>
          <span className="text-[8px] text-white/20">Selected or all real assets</span>
        </button>
        <button
          type="button"
          disabled={!hasVersions || busy}
          onClick={onRegenerate}
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-cyan-500/80 px-2 py-3 text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          <span className="text-[10px] font-medium">重新生成</span>
          <span className="text-[8px] text-white/70">Re-generate</span>
        </button>
        <button
          type="button"
          disabled={!hasVersions || busy}
          onClick={onSaveTemplate}
          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] px-2 py-3 transition hover:bg-amber-400/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-4 w-4 text-amber-200/50" />
          <span className="text-[10px] text-white/40">保存为模板</span>
          <span className="text-[8px] text-white/20">真实结果保存</span>
        </button>
      </div>
    </div>
  )
}


// ─── Compare Panel ─────────────────────────────────────────────

function ComparePanel({
  nodes,
  onClose,
}: {
  nodes: VersionNode[]
  onClose: () => void
}) {
  if (nodes.length === 0) return null
  return (
    <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">版本对比</h3>
          <p className="text-[10px] text-white/30">对比已有生成版本</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-white/50 hover:text-white">关闭</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {nodes.map((node) => (
          <div key={node.id} className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200">{node.label}</span>
              <span className="text-[9px] text-white/25">{fmtDate(node.timestamp)}</span>
            </div>
            <p className="text-[10px] leading-relaxed text-white/45">{node.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-lg bg-white/[0.03] p-2 text-white/45">SKU Bias <b className="text-cyan-300">{node.skuBias}%</b></div>
              <div className="rounded-lg bg-white/[0.03] p-2 text-white/45">REF Bias <b className="text-violet-300">{node.refBias}%</b></div>
              <div className="rounded-lg bg-white/[0.03] p-2 text-white/45">Style <b className="text-white/70">{node.weightParams.styleStrength.toFixed(2)}</b></div>
              <div className="rounded-lg bg-white/[0.03] p-2 text-white/45">Creative <b className="text-white/70">{node.weightParams.creativeFreedom.toFixed(2)}</b></div>
            </div>
            <p className="mt-3 break-all text-[9px] text-white/20">{node.id}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Zoom Modal ──────────────────────────────────────────────

function ZoomModal({
  variant,
  onClose,
}: {
  variant: AssetVariant | null
  onClose: () => void
}) {
  if (!variant) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={variant.assetUrl}
          alt=""
          className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export default function WorkshopPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const toast = useToastStore()

  const {
    productId,
    variants,
    selectedVariantIds,
    versionNodes,
    activeVersionId,
    weightParams,
    advancedTuningExpanded,
    setProductId,
    setVariants,
    toggleVariantSelection,
    setSelectedVariantIds,
    setWeightParams,
    setAdvancedTuningExpanded,
    isComparing,
    compareVersionIds,
    setIsComparing,
    setCompareVersionIds,
    setVersionNodes,
    setActiveVersionId,
    reset,
  } = useWorkshopStore()

  const [zoomVariant, setZoomVariant] = useState<AssetVariant | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const hasGenerationVersions = versionNodes.length > 0
  const activeVersionLabel = versionNodes.find((node) => node.id === activeVersionId)?.version ?? versionNodes.at(-1)?.version ?? null
  const selectedVariants = variants.filter((variant) => selectedVariantIds.includes(variant.id))
  const compareNodes = compareVersionIds
    .map((versionId) => versionNodes.find((node) => node.id === versionId))
    .filter((node): node is VersionNode => Boolean(node))



  // Sync URL param → store
  useEffect(() => {
    if (id && id !== productId) {
      reset()
      setProductId(id)
    }
    return () => {}
  }, [id, productId, setProductId, reset])

  // Load backend variants. Only dev=1 may show placeholder variants.
  useEffect(() => {
    if (productId) {
      productionApi.listVariants(productId)
        .then(async (v) => {
          setVariants(v.length > 0 ? v : (isDevMode() ? MOCK_VARIANTS : []))
          const nodes = isDevMode() ? [] : await productionApi.listGenerationVersions(productId)
          setVersionNodes(nodes)
          setActiveVersionId(nodes.find((node) => node.isCurrent)?.id ?? nodes.at(-1)?.id ?? null)
          if (nodes.length > 0) {
            setWeightParams(nodes.find((node) => node.isCurrent)?.weightParams ?? nodes[nodes.length - 1].weightParams)
          }
        })
        .catch(() => {
          setVariants(isDevMode() ? MOCK_VARIANTS : [])
          if (!isDevMode()) {
            setVersionNodes([])
            setActiveVersionId(null)
          }
        })
    } else {
      setVariants(isDevMode() ? MOCK_VARIANTS : [])
      if (!isDevMode()) {
        setVersionNodes([])
        setActiveVersionId(null)
      }
    }
  }, [productId, setVariants, setVersionNodes, setActiveVersionId, setWeightParams])

  // Clear all selection
  const handleToggle = useCallback(
    (variantId: string) => {
      if (variantId === '__clear_all__') {
        setSelectedVariantIds([])
      } else {
        toggleVariantSelection(variantId)
      }
    },
    [toggleVariantSelection, setSelectedVariantIds],
  )

  // Handle version select
  const handleVersionSelect = useCallback(
    (versionId: string) => {
      setActiveVersionId(versionId)
      const node = versionNodes.find((n) => n.id === versionId)
      if (node) {
        setWeightParams(node.weightParams)
      }
    },
    [versionNodes, setActiveVersionId, setWeightParams],
  )


  const handleCompare = useCallback(() => {
    if (versionNodes.length === 0) return
    const active = versionNodes.find((node) => node.id === activeVersionId) ?? versionNodes.at(-1)
    const parent = active?.parentId ? versionNodes.find((node) => node.id === active.parentId) : undefined
    const previous = versionNodes.slice().reverse().find((node) => node.id !== active?.id)
    const ids = [parent?.id, active?.id, previous?.id].filter((id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index).slice(0, 2)
    setCompareVersionIds(ids.length > 0 ? ids : versionNodes.slice(-2).map((node) => node.id))
    setIsComparing(true)
  }, [versionNodes, activeVersionId, setCompareVersionIds, setIsComparing])

  const handleBranch = useCallback(async () => {
    if (!productId || !activeVersionId) return
    setActionBusy(true)
    try {
      const result = await productionApi.createBranchGenerationVersion(
        productId,
        activeVersionId,
        weightParams,
        'Workshop branch regeneration',
      )
      toast.showToast(`已提交真实分支出图任务：${result.versionId}，等待 result asset 回调...`, 'info')
      await productionApi.waitForGenerationResult(productId, result.versionId)
      toast.showToast(`真实分支出图完成：${result.versionId}`, 'success')
      const [nextVariants, nextNodes] = await Promise.all([
        productionApi.listVariants(productId),
        productionApi.listGenerationVersions(productId),
      ])
      setVariants(nextVariants)
      setVersionNodes(nextNodes)
      setActiveVersionId(nextNodes.find((node) => node.isCurrent)?.id ?? nextNodes.at(-1)?.id ?? null)
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Branch generation failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }, [productId, activeVersionId, weightParams, setVariants, setVersionNodes, setActiveVersionId, toast])


  // Download handler
  const handleDownload = useCallback((variant: AssetVariant) => {
    toast.showToast('开始下载...', 'info')
    const a = document.createElement('a')
    a.href = variant.assetUrl
    a.download = `variant-${variant.id.replace(/[^a-zA-Z0-9_-]/g, '-')}.jpg`
    a.rel = 'noopener'
    a.click()
  }, [toast])

  const handleBatchDownload = useCallback(() => {
    const targets = selectedVariants.length > 0 ? selectedVariants : variants
    if (targets.length === 0) {
      toast.showToast('还没有可下载的真实图片结果。', 'error')
      return
    }
    targets.forEach((variant) => handleDownload(variant))
    toast.showToast(`已开始下载 ${targets.length} 个真实结果资产`, 'success')
  }, [selectedVariants, variants, handleDownload, toast])

  const handleSaveTemplate = useCallback(async () => {
    if (!productId) return
    const target = selectedVariants[0] ?? variants.find((variant) => variant.status === 'selected') ?? variants[0]
    if (!target) {
      toast.showToast('还没有可保存为模板的真实图片结果。', 'error')
      return
    }
    setActionBusy(true)
    try {
      const result = await productionApi.saveVariantAsTemplate(productId, target.id, `Workshop template ${target.id.split(':').at(-1) ?? ''}`)
      toast.showToast(`已保存真实模板：${result.templateId}`, 'success')
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Save as template failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }, [productId, selectedVariants, variants, toast])

  const handleFinalize = useCallback(async () => {
    if (!productId || selectedVariantIds.length === 0) return
    setActionBusy(true)
    try {
      const result = await productionApi.finalizeAssets({ productId, variantIds: selectedVariantIds, assetRoles: {} })
      if (result.assetRelationIds.length > 0) {
        const pkg = await createExportPackage({
          productIds: [productId],
          platform: 'ecommerce',
          site: 'download-center',
          locale: 'zh-CN',
          format: 'zip',
          assetRelationIds: result.assetRelationIds,
        })
        toast.showToast(`已回流 Product Center：${result.assetIds.length} 个资产，并创建下载包 ${pkg.id}`, 'success')
      } else {
        toast.showToast(`已回流 Product Center：${result.assetIds.length} 个资产；下载包等待资产关系返回后创建`, 'success')
      }
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Final asset adoption failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }, [productId, selectedVariantIds, toast])

  const handleRegenerate = useCallback(async () => {
    if (!productId || !activeVersionId) return
    setActionBusy(true)
    try {
      const result = await productionApi.createWorkshopGenerationVersion(
        productId,
        activeVersionId,
        weightParams,
        'Workshop regeneration',
        'workshop_regenerate',
      )
      toast.showToast(`已提交真实重生成任务：${result.versionId}，等待 result asset 回调...`, 'info')
      await productionApi.waitForGenerationResult(productId, result.versionId)
      toast.showToast(`真实重生成完成：${result.versionId}`, 'success')
      const [nextVariants, nextNodes] = await Promise.all([
        productionApi.listVariants(productId),
        productionApi.listGenerationVersions(productId),
      ])
      setVariants(nextVariants)
      setVersionNodes(nextNodes)
      setActiveVersionId(nextNodes.find((node) => node.isCurrent)?.id ?? nextNodes.at(-1)?.id ?? null)
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Regenerate failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }, [productId, activeVersionId, weightParams, setVariants, setVersionNodes, setActiveVersionId, toast])

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {t('production.workshop.title')}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {t('production.workshop.subtitle')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── 3-Column Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── Left Column: Version Lineage (3 cols) ───────── */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <VersionLineage
              nodes={versionNodes}
              activeId={activeVersionId}
              onSelect={handleVersionSelect}
              onCompare={handleCompare}
              onBranch={handleBranch}
            />
          </motion.div>
        </div>

        {/* ─── Center Column: Variant Grid (6 cols) ────────── */}
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <VariantGrid
              variants={variants}
              selectedIds={selectedVariantIds}
              busy={actionBusy}
              onToggle={handleToggle}
              onZoom={(v) => setZoomVariant(v)}
              onDownload={handleDownload}
              onFinalize={handleFinalize}
            />
          </motion.div>
        </div>

        {/* ─── Right Column: Control Panel (3 cols) ────────── */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="min-h-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <WeightControl
              weightParams={weightParams}
              hasVersions={hasGenerationVersions}
              activeVersionLabel={activeVersionLabel}
              busy={actionBusy}
              advancedExpanded={advancedTuningExpanded}
              onWeightChange={setWeightParams}
              onToggleAdvanced={() => setAdvancedTuningExpanded(!advancedTuningExpanded)}
              onBatchDownload={handleBatchDownload}
              onRegenerate={handleRegenerate}
              onSaveTemplate={handleSaveTemplate}
            />
          </motion.div>
        </div>
      </div>

      {isComparing && (
        <ComparePanel nodes={compareNodes} onClose={() => setIsComparing(false)} />
      )}

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomVariant && (
          <ZoomModal variant={zoomVariant} onClose={() => setZoomVariant(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
