import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Download,
  Loader2,
  Send,
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
  MousePointerClick,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkshopStore } from '@/store/productionStore'
import * as productionApi from '@/services/production'
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
}: {
  nodes: VersionNode[]
  activeId: string | null
  onSelect: (id: string) => void
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
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] text-white/40 hover:text-white/60"
        >
          <ArrowUpRight className="h-3 w-3" />
          对比模式
        </button>
      </div>

      {/* Timeline */}
      <div className="relative space-y-1 pl-4">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.06]" />

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
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] py-2 text-[11px] text-white/25 transition hover:border-white/10 hover:text-white/40"
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
        <span className="text-[10px] text-white/30">
          1.2-{String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Variant Grid (Center) ───────────────────────────────────

function VariantGrid({
  variants,
  selectedIds,
  onToggle,
  onZoom,
  onDownload,
}: {
  variants: AssetVariant[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onZoom: (variant: AssetVariant) => void
  onDownload: (variant: AssetVariant) => void
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('全部版本')
  const [sort, setSort] = useState('最新优先')

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
              className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] py-1 pl-2 pr-6 text-[10px] text-white/50 outline-none"
            >
              <option>全部版本</option>
              <option>V1.2</option>
              <option>V1.1</option>
              <option>V1.0</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
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
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {variants.map((variant, idx) => (
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
          {variants.map((variant, idx) => (
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
                <span className="text-[11px] text-white/60">1.2-{String(idx + 1).padStart(2, '0')}</span>
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
          已选择 {selectedIds.length} / {variants.length} 张图片
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onToggle('__clear_all__')}
            className="text-[11px] text-cyan-400/60 hover:text-cyan-400"
          >
            清空选择
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Weight Control (Right Panel) ────────────────────────────

function WeightControl({
  weightParams,
  advancedExpanded,
  onWeightChange,
  onToggleAdvanced,
}: {
  weightParams: { skuBias: number; styleStrength: number; identityConsistency: number; creativeFreedom: number }
  advancedExpanded: boolean
  onWeightChange: (params: Partial<typeof weightParams>) => void
  onToggleAdvanced: () => void
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
        <span className="text-[10px] text-white/20">当前版本 V1.2</span>
      </div>

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
          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3 transition hover:bg-white/[0.04]"
        >
          <Download className="h-4 w-4 text-white/40" />
          <span className="text-[10px] text-white/40">批量下载</span>
          <span className="text-[8px] text-white/20">Batch Download</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-cyan-500/80 px-2 py-3 text-white transition hover:bg-cyan-500"
        >
          <RotateCw className="h-4 w-4" />
          <span className="text-[10px] font-medium">重新生成</span>
          <span className="text-[8px] text-white/70">Re-generate</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-3 transition hover:bg-white/[0.04]"
        >
          <Save className="h-4 w-4 text-white/40" />
          <span className="text-[10px] text-white/40">保存为模板</span>
          <span className="text-[8px] text-white/20">Save as Template</span>
        </button>
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

// ─── AI Assistant Bar ────────────────────────────────────────

function AiAssistantBar({
  input,
  onInputChange,
  onSend,
  sending,
}: {
  input: string
  onInputChange: (v: string) => void
  onSend: () => void
  sending: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
    >
      {/* Avatar */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-400/20">
          <Sparkles className="h-4 w-4 text-cyan-400/60" />
        </div>
        <span className="text-[8px] text-white/30">AI 助手</span>
        <span className="text-[7px] text-white/15">AI Assistant</span>
      </div>

      {/* Input */}
      <div className="min-w-0 flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={'输入指令进行优化（例如："让阴影更深一些"）'}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
        />
        <p className="text-[10px] text-white/15">
          Type instructions to refine (e.g., "Make the shadows deeper").
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )
          }
        </button>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/30 transition hover:bg-white/10 hover:text-white/50"
        >
          <MousePointerClick className="h-4 w-4" />
        </button>
      </div>
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
    aiAssistantInput,
    setProductId,
    setVariants,
    toggleVariantSelection,
    setSelectedVariantIds,
    setWeightParams,
    setAdvancedTuningExpanded,
    setAiAssistantInput,
    setActiveVersionId,
    reset,
  } = useWorkshopStore()

  const [zoomVariant, setZoomVariant] = useState<AssetVariant | null>(null)
  const [sendingAi, setSendingAi] = useState(false)

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
        .then((v) => {
          setVariants(v.length > 0 ? v : (isDevMode() ? MOCK_VARIANTS : []))
        })
        .catch(() => setVariants(isDevMode() ? MOCK_VARIANTS : []))
    } else {
      setVariants(isDevMode() ? MOCK_VARIANTS : [])
    }
  }, [productId, setVariants])

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

  // AI Assistant send
  const handleAiSend = useCallback(async () => {
    if (!aiAssistantInput.trim()) return
    const content = aiAssistantInput.trim()
    setAiAssistantInput('')
    setSendingAi(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSendingAi(false)
    toast.showToast(`已收到指令："${content}"，正在生成新版本...`, 'success')
  }, [aiAssistantInput, setAiAssistantInput, toast])

  // Download handler
  const handleDownload = useCallback((variant: AssetVariant) => {
    toast.showToast('开始下载...', 'info')
    const a = document.createElement('a')
    a.href = variant.assetUrl
    a.download = `variant-${variant.id}.jpg`
    a.click()
  }, [toast])

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
              onToggle={handleToggle}
              onZoom={(v) => setZoomVariant(v)}
              onDownload={handleDownload}
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
              advancedExpanded={advancedTuningExpanded}
              onWeightChange={setWeightParams}
              onToggleAdvanced={() => setAdvancedTuningExpanded(!advancedTuningExpanded)}
            />
          </motion.div>
        </div>
      </div>

      {/* ─── AI Assistant Bar ──────────────────────────────── */}
      <AiAssistantBar
        input={aiAssistantInput}
        onInputChange={setAiAssistantInput}
        onSend={handleAiSend}
        sending={sendingAi}
      />

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomVariant && (
          <ZoomModal variant={zoomVariant} onClose={() => setZoomVariant(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
