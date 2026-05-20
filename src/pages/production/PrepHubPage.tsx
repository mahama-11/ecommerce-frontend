/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Upload,
  Package,
  Image,
  BrainCircuit,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  RotateCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Tag,
  SkipForward,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrepStore } from '@/store/productionStore'
import * as productionApi from '@/services/production'
import { MOCK_SOURCES } from '@/mocks/productionDemo'
import { useToastStore } from '@/store/toastStore'
import type {
  DualTrackParsing,
  LlmDecisionTreeResult,
  DecisionStep,
  ParsedAttribute,
  ImageUnderstandingProviderCode,
} from '@/types/production'

// ─── Polling helper ──────────────────────────────────────────
function usePolling<T>(
  fetcher: () => Promise<T>,
  shouldPoll: (data: T) => boolean,
  intervalMs = 2000,
  maxDurationMs = 180000,
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startedAtRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const fetcherRef = useRef(fetcher)
  const shouldPollRef = useRef(shouldPoll)

  useEffect(() => {
    fetcherRef.current = fetcher
    shouldPollRef.current = shouldPoll
  }, [fetcher, shouldPoll])

  const start = useCallback(async () => {
    if (inFlightRef.current) return
    if (!startedAtRef.current) startedAtRef.current = Date.now()
    inFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
      if (shouldPollRef.current(result)) {
        if (Date.now() - startedAtRef.current > maxDurationMs) {
          throw new Error(`图片解析等待超时：本次识别还没有完成，请稍后重试。`)
        }
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => void start(), intervalMs)
      } else {
        startedAtRef.current = null
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Polling error')
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [intervalMs, maxDurationMs])

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    startedAtRef.current = null
    inFlightRef.current = false
  }, [])

  useEffect(() => stop, [stop])

  return { data, error, loading, start, stop, setData }
}

const ATTRIBUTE_LABEL_ZH: Record<string, string> = {
  product_geometry: '商品形态',
  geometry: '商品形态',
  material: '材质',
  style: '风格',
  scene: '场景',
  brand_constraints: '品牌约束',
  lighting: '光线',
  composition: '构图',
  color: '色彩',
  props: '道具元素',
  background: '背景',
  reference_composition: '参考图构图',
  scene_reference: '参考图场景',
  analysis_limitation: '识别提醒',
  unverified_visual_claim: '待确认视觉点',
}

function localizeAttributeLabel(attr: ParsedAttribute, language: string): string {
  const raw = (attr.label || attr.key || '').trim()
  const normalized = raw.toLowerCase().replace(/\s+/g, '_')
  const mapped = ATTRIBUTE_LABEL_ZH[normalized] || ATTRIBUTE_LABEL_ZH[attr.key]
  if (mapped) return mapped
  if (!language.toLowerCase().startsWith('zh')) return raw
  return raw.replace(/_/g, ' ')
}

function localizeAttributeValue(value: unknown, language: string): string {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '')
  const sanitized = text
    .replace(/Manifest-declared SKU visual asset; geometry analysis pending runtime image bytes/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Manifest-declared SKU asset; geometry not extractable without image bytes\.?/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/Requested element:\s*product geometry analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为商品主体，但外形细节还需要在生成前再次确认。')
    .replace(/Requested element:\s*material analysis pending visual byte ingestion for asset_[A-Za-z0-9_-]+/gi, '当前图片可以作为材质参考，但具体材质还需要确认。')
    .replace(/Reference asset available:\s*asset_[A-Za-z0-9_-]+\s*\([^)]*\)\s*for comparative visual analysis/gi, '参考图已就绪，可用于对比风格、场景和构图。')
    .replace(/All visual facts unverified:.*$/gi, '当前还有部分视觉细节无法自动确认，请以你上传的商品图为准。')
    .replace(/visual byte ingestion/gi, '图片细节识别')
    .replace(/comparative visual analysis/gi, '视觉对比')
    .replace(/bounding boxes requested but cannot be generated without pixel data/gi, '细节位置还需要图片内容确认')
    .replace(/image bytes/gi, '图片内容')
    .replace(/runtime/gi, '生成服务')
    .replace(/backend/gi, '系统')
    .replace(/Manifest/gi, '图片信息')
    .replace(/SKU asset/gi, '商品图片')
    .replace(/contract[-_ ]needed/gi, '暂不可用')
    .replace(/prompt[_ ]plan/gi, '生成方案')
  if (!language.toLowerCase().startsWith('zh')) return sanitized
  return sanitized
    .replace(/industrial workshop/gi, '工业车间')
    .replace(/warm backlight/gi, '暖色逆光')
    .replace(/low angle/gi, '低角度')
    .replace(/metallic/gi, '金属质感')
    .replace(/minimal/gi, '极简')
    .replace(/white background/gi, '白色背景')
    .replace(/Manifest-declared SKU asset; geometry not extractable without image bytes\.?/gi, '已识别为当前商品图片；系统会在生成时以实物图为准。')
    .replace(/geometry not extractable without image bytes\.?/gi, '图片细节不足，建议确认商品外形。')
    .replace(/backend/gi, '系统')
    .replace(/runtime/gi, '生成服务')
    .replace(/contract[-_ ]needed/gi, '暂不可用')
    .replace(/prompt[_ ]plan/gi, '生成方案')
    .replace(/Manifest/gi, '图片信息')
    .replace(/SKU asset/gi, '商品图片')
}

// ─── Upload Zone Component ──────────────────────────────────

function UploadZone({
  title,
  icon: Icon,
  iconColor,
  hint,
  sources,
  uploading,
  onDrop,
  onFileInput,
  onRemove,
  inputRef,
  testId,
}: {
  title: string
  icon: typeof Upload
  iconColor: string
  hint: string
  sources: { id: string; url: string; thumbnailUrl?: string; name?: string; type: string }[]
  uploading: boolean
  onDrop: (e: React.DragEvent) => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  testId?: string
}) {
  return (
    <div data-testid={testId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          {title}
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-normal text-white/30">
            {sources.length}
          </span>
        </h3>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`min-h-[132px] cursor-pointer rounded-lg border border-dashed border-white/[0.08] text-center transition hover:border-white/20 hover:bg-white/[0.01] ${sources.length > 0 ? 'p-2' : 'flex flex-col items-center justify-center'}`}
      >
        {sources.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03]"
              >
                <img
                  src={src.thumbnailUrl || src.url}
                  alt={src.name || ''}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(src.id)
                  }}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/70 opacity-0 transition group-hover:opacity-100 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                  <span className="line-clamp-1 text-[9px] text-white/65">
                    {src.name || src.type}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] text-white/25">
              <Upload className="mb-1 h-4 w-4" />
              <span className="text-[9px]">继续添加/替换</span>
            </div>
          </div>
        ) : uploading ? (
          <Loader2 className="mb-1.5 h-6 w-6 animate-spin text-white/30" />
        ) : (
          <>
            <Upload className="mb-1.5 h-6 w-6 text-white/15" />
            <p className="text-[11px] text-white/30">{hint}</p>
          </>
        )}
        <input
          data-testid={testId ? `${testId}-input` : undefined}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
      </div>
    </div>
  )
}

// ─── Interactive Decision Step Card ──────────────────────────

function DecisionStepCard({
  step,
  isCurrent,
  onSelectOption,
}: {
  step: DecisionStep
  isCurrent: boolean
  onSelectOption: (stepId: string, optionId: string) => void
}) {
  const { t } = useTranslation()

  const statusColor = {
    pending: 'text-white/20',
    active: 'text-violet-300',
    completed: 'text-emerald-400',
  }[step.status]

  const statusIcon = {
    pending: <Circle className="h-3.5 w-3.5" />,
    active: <Circle className="h-3.5 w-3.5 animate-pulse" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  }[step.status]

  const selectedOption = step.options.find((o) => o.id === step.selectedOptionId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border p-4 transition ${
        isCurrent
          ? 'border-violet-400/30 bg-violet-400/[0.04]'
          : step.status === 'completed'
            ? 'border-emerald-400/15 bg-white/[0.015]'
            : 'border-white/[0.04] bg-white/[0.01] opacity-60'
      }`}
    >
      {/* Step header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex items-center justify-center ${statusColor}`}>
          {statusIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white/30">
              决策项 {step.stepNumber}
            </span>
            {step.status === 'completed' && selectedOption && (
              <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                当前选择：{selectedOption.label}
              </span>
            )}
          </div>
          <h4 className={`text-xs font-semibold ${statusColor}`}>
            {step.title}
          </h4>
        </div>
      </div>

      {/* Description */}
      {step.description && (
        <p className="mb-3 text-[10px] leading-relaxed text-white/35">
          {step.description}
        </p>
      )}

      {/* Options grid */}
      {(isCurrent || step.status === 'completed') && step.options.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {step.options.map((option) => {
            const isSelected = option.id === step.selectedOptionId
            return (
              <button
                key={option.id}
                type="button"
                disabled={false}
                onClick={() => onSelectOption(step.id, option.id)}
                className={`group relative flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left transition ${
                  isSelected
                    ? 'border-violet-400/40 bg-violet-400/[0.08]'
                    : isCurrent
                      ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.10] hover:bg-white/[0.03]'
                }`}
              >
                {option.icon && (
                  <span className="text-sm">{option.icon}</span>
                )}
                <span className={`text-[11px] font-medium ${
                  isSelected ? 'text-violet-300' : 'text-white/60'
                }`}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-[9px] text-white/25">{option.description}</span>
                )}
                {option.confidence != null && (
                  <span className={`mt-0.5 text-[9px] tabular-nums ${
                    isSelected ? 'text-violet-400/60' : 'text-white/20'
                  }`}>
                    {Math.round(option.confidence * 100)}%
                  </span>
                )}
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute right-1.5 top-1.5">
                    <CheckCircle2 className="h-3 w-3 text-violet-400" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Pending placeholder */}
      {step.status === 'pending' && step.options.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-white/15" />
          <span className="text-[10px] text-white/25">
            {t('production.prep.pending')}
          </span>
        </div>
      )}
    </motion.div>
  )
}


// ─── Attribute Row (read-only display) ──────────────────────

type AttentionDecision = 'keep' | 'replace' | 'drop' | 'crop'


function decisionFromOptionId(optionId?: string): AttentionDecision | undefined {
  if (!optionId) return undefined
  if (optionId.endsWith(':drop')) return 'drop'
  if (optionId.endsWith(':crop')) return 'crop'
  if (optionId.endsWith(':replace')) return 'replace'
  if (optionId.endsWith(':keep')) return 'keep'
  return undefined
}

function AttributeRow({ attr, decision }: { attr: ParsedAttribute; decision?: AttentionDecision }) {
  const { i18n } = useTranslation()
  const roleLabel = attr.sourceRole === 'sku' ? 'SKU' : attr.sourceRole === 'reference' ? 'REF' : attr.source
  const label = localizeAttributeLabel(attr, i18n.language)
  const value = localizeAttributeValue(attr.value, i18n.language)
  const decisionLabel = decision === 'keep'
    ? '已纳入出图要求'
    : decision === 'replace'
      ? '以当前 SKU 替换主体'
      : decision === 'crop'
        ? '局部/裁剪纳入出图要求'
      : decision === 'drop'
        ? '已排除，不进入出图要求'
        : '待确认取舍'
  const decisionClass = decision === 'keep'
    ? 'border-violet-300/15 bg-violet-400/10 text-violet-100/75'
    : decision === 'replace'
      ? 'border-cyan-300/15 bg-cyan-400/10 text-cyan-100/75'
      : decision === 'drop'
        ? 'border-slate-300/10 bg-white/[0.035] text-white/35'
        : 'border-amber-300/15 bg-amber-400/10 text-amber-100/70'
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
      <div className="mb-1 flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/70" title={label}>
          {label}
        </span>
        <span
          className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${
            attr.source === 'comfyui'
              ? 'bg-cyan-400/10 text-cyan-400'
              : 'bg-amber-400/10 text-amber-400'
          }`}
        >
          {roleLabel}
        </span>
      </div>
      <p className="mb-2 line-clamp-2 break-words text-[11px] leading-relaxed text-white/45" title={value}>
        {value}
      </p>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium ${decisionClass}`}>
        {decisionLabel}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export default function PrepHubPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToastStore()

  const {
    productId,
    sources,
    parsing,
    decisionTree,
    globalDriftBias,
    setProductId,
    addSource,
    setSources,
    setParsing,
    setDecisionTree,
    setGlobalDriftBias,
    reset,
  } = usePrepStore()

  // Derived source groups
  const skuSources = sources.filter((s) => s.type === 'sku_image')
  const refSources = sources.filter((s) => s.type === 'reference_image')

  // Sync URL param → store
  useEffect(() => {
    if (id && id !== productId) {
      reset()
      setProductId(id)
    }
    return () => {}
  }, [id, productId, setProductId, reset])

  useEffect(() => {
    if (!productId || sources.length > 0) return
    let cancelled = false
    productionApi.listParsingSources(productId)
      .then((items) => {
        if (cancelled) return
        items.forEach((source) => addSource(source))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [productId, sources.length, addSource])

  const hydratedProductRef = useRef<string | null>(null)
  useEffect(() => {
    if (!productId || parsing || decisionTree) return
    if (hydratedProductRef.current === productId) return
    hydratedProductRef.current = productId
    let cancelled = false
    Promise.all([
      productionApi.getParsingResult(productId),
      productionApi.getDecisionTree(productId),
    ])
      .then(([result, tree]) => {
        if (cancelled || result.status === 'idle') return
        setParsing(result)
        if (result.status === 'succeeded' && tree.status !== 'idle') setDecisionTree(tree)
      })
      .catch(() => {
        if (hydratedProductRef.current === productId) hydratedProductRef.current = null
      })
    return () => {
      cancelled = true
    }
  }, [productId, parsing, decisionTree, setParsing, setDecisionTree])

  // ─── File upload ────────────────────────────────────────
  const skuInputRef = useRef<HTMLInputElement>(null)
  const refInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [understandingProvider, setUnderstandingProvider] = useState<ImageUnderstandingProviderCode>('comfyui_bridge')

  const handleFiles = useCallback(
    async (files: FileList | File[], sourceType: 'sku_image' | 'reference_image') => {
      if (!productId) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          try {
            productionApi.validateParsingSourceFile(file)
          } catch (validationError) {
            toast.showToast(validationError instanceof Error ? validationError.message : '图片格式或大小不符合要求', 'error')
            continue
          }
          const source = await productionApi.uploadParsingSource(productId, file, sourceType)
          addSource({ ...source, type: sourceType })
        }
      } catch (e) {
        toast.showToast(e instanceof Error ? e.message : 'Upload failed', 'error')
      } finally {
        setUploading(false)
      }
    },
    [productId, addSource, toast],
  )

  const onDropSku = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      void handleFiles(e.dataTransfer.files, 'sku_image')
    },
    [handleFiles],
  )

  const onDropRef = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      void handleFiles(e.dataTransfer.files, 'reference_image')
    },
    [handleFiles],
  )

  const onFileInputSku = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) void handleFiles(e.target.files, 'sku_image')
      e.target.value = ''
    },
    [handleFiles],
  )

  const onFileInputRef = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) void handleFiles(e.target.files, 'reference_image')
      e.target.value = ''
    },
    [handleFiles],
  )

  const handleRemoveSource = useCallback(async (sourceId: string) => {
    if (!productId) return
    const target = sources.find((source) => source.id === sourceId || source.assetId === sourceId || source.sourceReferenceId === sourceId)
    if (!target) return
    const previous = sources
    const next = sources.filter((source) => source.id !== sourceId && source.assetId !== sourceId && source.sourceReferenceId !== sourceId)
    setSources(next)
    try {
      await productionApi.removeParsingSource(productId, target)
      if (next.length === 0) {
        setParsing(null)
        setDecisionTree(null)
      }
    } catch (e) {
      setSources(previous)
      toast.showToast(e instanceof Error ? e.message : '删除图片失败，请稍后重试。', 'error')
    }
  }, [productId, sources, setSources, setParsing, setDecisionTree, toast])

  // ─── Parsing ────────────────────────────────────────────
  const parsingPoll = usePolling<DualTrackParsing>(
    () => productionApi.getParsingResult(productId!),
    (d) => d.status === 'parsing',
  )

  const autoPollingProductRef = useRef<string | null>(null)
  useEffect(() => {
    if (!productId || parsing?.status !== 'parsing' || parsingPoll.error) {
      if (parsing?.status !== 'parsing') autoPollingProductRef.current = null
      return
    }
    if (autoPollingProductRef.current === productId) return
    autoPollingProductRef.current = productId
    parsingPoll.start()
  }, [productId, parsing?.status, parsingPoll.error, parsingPoll.start])

  // ─── Dev mode: auto-fill mock sources & trigger parsing ──
  const devAutoFilled = useRef(false)
  useEffect(() => {
    if (
      import.meta.env.DEV &&
      window.location.search.includes('dev=1') &&
      productId &&
      sources.length === 0 &&
      !parsing &&
      !devAutoFilled.current
    ) {
      devAutoFilled.current = true
      MOCK_SOURCES.forEach((s) => addSource(s))
      setTimeout(async () => {
        try {
          await productionApi.startParsing({
            productId,
            sourceIds: MOCK_SOURCES.map((s) => s.id),
            tracks: ['comfyui', 'third_party'],
            providerCode: understandingProvider,
          })
          parsingPoll.start()
        } catch { /* ignore */ }
      }, 300)
    }
  }, [productId, sources.length, parsing, addSource, parsingPoll, understandingProvider])

  const startParsing = useCallback(async () => {
    if (!productId) return
    if (skuSources.length === 0 || refSources.length === 0) {
      toast.showToast('请先上传一张商品图和一张参考图，再开始解析。', 'error')
      return
    }
    try {
      setParsing({
        status: 'parsing',
        primaryTrack: 'third_party',
        mergedAttributes: [],
        conflicts: [],
        thirdPartyResult: { track: 'third_party', status: 'parsing', attributes: [] },
      })
      await productionApi.startParsing({
        productId,
        sourceIds: sources.map((s) => s.id),
        tracks: ['comfyui', 'third_party'],
        providerCode: understandingProvider,
      })
      parsingPoll.start()
    } catch (e) {
      const message = e instanceof Error ? e.message : '解析失败，请稍后重试。'
      setParsing({
        status: 'failed',
        primaryTrack: 'third_party',
        mergedAttributes: [],
        conflicts: [],
        thirdPartyResult: { track: 'third_party', status: 'failed', attributes: [], error: message },
      })
      toast.showToast(message, 'error')
    }
  }, [productId, sources, skuSources.length, refSources.length, parsingPoll, setParsing, toast, understandingProvider])

  // Sync poll results into store
  useEffect(() => {
    if (parsingPoll.data) setParsing(parsingPoll.data)
  }, [parsingPoll.data, setParsing])

  // ─── Decision tree ──────────────────────────────────────
  const treePoll = usePolling<LlmDecisionTreeResult>(
    () => productionApi.getDecisionTree(productId!),
    (d) => d.status === 'evaluating',
  )

  const decisionHydratingProductRef = useRef<string | null>(null)
  useEffect(() => {
    if (!productId || parsing?.status !== 'succeeded' || decisionTree) {
      if (parsing?.status !== 'succeeded') decisionHydratingProductRef.current = null
      return
    }
    if (decisionHydratingProductRef.current === productId) return
    decisionHydratingProductRef.current = productId
    let cancelled = false
    productionApi.getDecisionTree(productId)
      .then((tree) => {
        if (!cancelled && tree.status !== 'idle') setDecisionTree(tree)
      })
      .catch(() => {
        if (decisionHydratingProductRef.current === productId) decisionHydratingProductRef.current = null
      })
    return () => {
      cancelled = true
    }
  }, [productId, parsing?.status, decisionTree, setDecisionTree])

  useEffect(() => {
    if (treePoll.data) setDecisionTree(treePoll.data)
  }, [treePoll.data, setDecisionTree])

  // ─── Interactive decision tree step selection ───────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [decisionTreeSkipped, setDecisionTreeSkipped] = useState(false)
  const [sessionSelections, setSessionSelections] = useState<Record<string, string>>({})
  const [usePreviousSelections, setUsePreviousSelections] = useState(true)


  useEffect(() => {
    setSessionSelections({})
    setUsePreviousSelections(true)
    setCurrentStepIndex(0)
  }, [productId])

  const decisionProgress = useMemo(() => {
    const total = decisionTree?.steps?.length ?? 0
    const answered = Object.keys(sessionSelections).length
    const historicalAnswered = decisionTree?.steps?.filter((step) => step.selectedOptionId).length ?? 0
    const effectiveAnswered = Math.max(answered, historicalAnswered)
    return {
      total,
      answered: effectiveAnswered,
      historicalAnswered,
      remaining: Math.max(total - effectiveAnswered, 0),
      complete: total > 0 && effectiveAnswered >= total,
      percent: total > 0 ? Math.round((effectiveAnswered / total) * 100) : 0,
    }
  }, [decisionTree?.steps, sessionSelections, usePreviousSelections])

  const displaySteps = useMemo(() => {
    const rawSteps = decisionTree?.steps ?? []
    return rawSteps.map((step, idx) => {
      const sessionOptionId = sessionSelections[step.id]
      const selectedOptionId = sessionOptionId ?? step.selectedOptionId
      const isAnswered = Boolean(selectedOptionId)
      const firstUnansweredIndex = rawSteps.findIndex((candidate) => {
        const candidateSelected = sessionSelections[candidate.id] ?? candidate.selectedOptionId
        return !candidateSelected
      })
      const activeIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : Math.min(currentStepIndex, rawSteps.length - 1)
      return {
        ...step,
        selectedOptionId,
        status: isAnswered ? 'completed' as const : idx === activeIndex ? 'active' as const : 'pending' as const,
      }
    })
  }, [decisionTree?.steps, sessionSelections, currentStepIndex])

  useEffect(() => {
    if (displaySteps.length === 0) return
    if (currentStepIndex >= displaySteps.length) {
      setCurrentStepIndex(displaySteps.length - 1)
      return
    }
    const current = displaySteps[currentStepIndex]
    const nextUnanswered = displaySteps.findIndex((step, idx) => idx > currentStepIndex && !step.selectedOptionId)
    if (current?.selectedOptionId && nextUnanswered >= 0) setCurrentStepIndex(nextUnanswered)
  }, [displaySteps, currentStepIndex])

  const handleSelectOption = useCallback(
    async (stepId: string, optionId: string) => {
      if (!decisionTree?.steps || !productId) return
      const decision = optionId.endsWith(':replace') ? 'replace' : optionId.endsWith(':drop') ? 'drop' : 'keep'
      const targetAssetId = decision === 'replace' ? skuSources[0]?.assetId : undefined
      if (decision === 'replace' && !targetAssetId) {
        toast.showToast('选择“换成我的商品”前，请先上传商品图。', 'error')
        return
      }

      const previousSelections = sessionSelections
      const previousUsePreviousSelections = usePreviousSelections
      const optimisticSelections = { ...sessionSelections, [stepId]: optionId }
      const rawSteps = decisionTree.steps ?? []
      const currentIdx = rawSteps.findIndex((s) => s.id === stepId)
      const nextPending = rawSteps.findIndex((candidate, i) => {
        if (i <= currentIdx) return false
        const selected = optimisticSelections[candidate.id] ?? candidate.selectedOptionId
        return !selected
      })
      setUsePreviousSelections(false)
      setSessionSelections(optimisticSelections)
      setCurrentStepIndex(nextPending >= 0 ? nextPending : Math.max(currentIdx, 0))

      const currentStep = decisionTree.steps.find((step) => step.id === stepId)
      const currentOption = currentStep?.options.find((option) => option.id === optionId)
      try {
        await productionApi.updateAttentionDecision(productId, stepId, decision, targetAssetId, currentOption)
        const [updatedParsing, updatedTree] = await Promise.all([
          productionApi.getParsingResult(productId),
          productionApi.getDecisionTree(productId),
        ])
        setParsing(updatedParsing)
        setDecisionTree(updatedTree)
      } catch (e) {
        setUsePreviousSelections(previousUsePreviousSelections)
        setSessionSelections(previousSelections)
        setCurrentStepIndex(Math.max(currentIdx, 0))
        toast.showToast(e instanceof Error ? e.message : '保存选择失败，请重试。', 'error')
        return
      }
    },
    [decisionTree, productId, skuSources, sessionSelections, usePreviousSelections, setParsing, setDecisionTree, toast],
  )

  // ─── Navigate to Sandbox ────────────────────────────────
  const goToSandbox = () => {
    if (productId) navigate(`/products/${productId}/production/sandbox`)
  }

  const handleSkipDecisionTree = () => {
    if (window.confirm(t('production.prep.skipDecisionTreeConfirm'))) {
      setDecisionTreeSkipped(true)
    }
  }

  const commitDriftBias = useCallback(async (value: number = globalDriftBias) => {
    if (!productId) return
    try {
      await productionApi.updateDriftControl(productId, value)
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Failed to persist attribute drift control', 'error')
    }
  }, [productId, globalDriftBias, toast])

  const handleDriftBiasChange = useCallback((value: number) => {
    setGlobalDriftBias(value)
  }, [setGlobalDriftBias])

  const isParsing = !parsingPoll.error && (parsing?.status === 'parsing' || parsingPoll.loading)
  const isEvaluating = decisionTree?.status === 'evaluating' || treePoll.loading

  // Parse button
  const hasSources = sources.length > 0
  const hasSkuSource = skuSources.length > 0
  const hasReferenceSource = refSources.length > 0
  const dualTrackReady = hasSkuSource && hasReferenceSource
  const dualTrackBlocker = !hasSkuSource
    ? '请先上传一张商品图。'
    : !hasReferenceSource
      ? '请再上传一张参考图。'
      : '可以开始解析。'
  const parsingBlocked = parsing?.status === 'failed' || Boolean(parsingPoll.error)
  const parsingBlockerMessage = parsingPoll.error || parsing?.thirdPartyResult?.error || (!dualTrackReady && hasSources ? dualTrackBlocker : undefined)
  const attributeDecisionByKey = useMemo(() => {
    const decisions = new Map<string, AttentionDecision>()
    const put = (key: string | undefined, decision: AttentionDecision) => {
      if (!key) return
      decisions.set(key, decision)
      decisions.set(key.toLowerCase().replace(/\s+/g, '_'), decision)
    }
    displaySteps.forEach((step) => {
      const decision = decisionFromOptionId(step.selectedOptionId)
      if (!decision) return
      put(step.id, decision)
      put(step.title, decision)
      const normalizedTitle = step.title.toLowerCase()
      if (normalizedTitle.includes('商品形态') || normalizedTitle.includes('product geometry')) put('product_geometry', decision)
      if (normalizedTitle.includes('材质') || normalizedTitle.includes('material')) put('material', decision)
      if (normalizedTitle.includes('风格') || normalizedTitle.includes('style')) put('style', decision)
      if (normalizedTitle.includes('构图') || normalizedTitle.includes('composition')) put('reference_composition', decision)
      if (normalizedTitle.includes('场景') || normalizedTitle.includes('scene')) put('scene', decision)
      if (normalizedTitle.includes('品牌') || normalizedTitle.includes('brand')) put('brand_constraints', decision)
    })
    return decisions
  }, [displaySteps])


  // ─── Steps navigation ───────────────────────────────────
  const steps = displaySteps

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-white">
            {t('production.prep.title')}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {t('production.prep.subtitle')}
          </p>
        </div>
        {parsing?.status === 'succeeded' && (decisionTree?.status === 'succeeded' || decisionTreeSkipped) && (
          <button
            type="button"
            onClick={goToSandbox}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            {t('production.nav.sandbox')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>

      {/* ═══ 3-Column Layout ═══ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

        {/* ─── Left: Dual-Track Parsing (SKU + Reference) (5 cols) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-h-0 space-y-4 lg:col-span-5"
        >
          <UploadZone
            testId="production-sku-source-upload"
            title={t('production.prep.skuSourceUpload')}
            icon={Package}
            iconColor="text-cyan-400"
            hint={t('production.prep.skuDropzoneHint')}
            sources={skuSources}
            uploading={uploading}
            onDrop={onDropSku}
            onFileInput={onFileInputSku}
            onRemove={handleRemoveSource}
            inputRef={skuInputRef}
          />
          <UploadZone
            testId="production-reference-source-upload"
            title={t('production.prep.referenceSourceUpload')}
            icon={Image}
            iconColor="text-amber-400"
            hint={t('production.prep.referenceDropzoneHint')}
            sources={refSources}
            uploading={uploading}
            onDrop={onDropRef}
            onFileInput={onFileInputRef}
            onRemove={handleRemoveSource}
            inputRef={refInputRef}
          />

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.055] p-4 shadow-[0_18px_55px_rgba(34,211,238,0.10)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-100">开始识别商品与参考图</p>
                <p className="mt-1 text-[11px] leading-relaxed text-cyan-100/55">
                  上传商品图和参考图后，系统会识别可用于出图的商品事实，并生成后续的视觉策略取舍。
                </p>
              </div>
              {dualTrackReady ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/70" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/70" />}
            </div>
            <div className="mb-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-cyan-100/70">图片识别方式</span>
                <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/35">可切换识别侧重</span>
              </div>
              <select
                value={understandingProvider}
                onChange={(event) => setUnderstandingProvider(event.target.value as ImageUnderstandingProviderCode)}
                disabled={isParsing}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[11px] text-white/70 outline-none transition focus:border-cyan-300/30 disabled:opacity-40"
              >
                <option value="comfyui_bridge">稳定识别（推荐）</option>
                <option value="gemini_visual_understanding">增强识别</option>
              </select>
              <p className="mt-1.5 text-[9px] leading-relaxed text-cyan-100/45">
                选择不同的识别侧重，可以对比图片的光影、材质和构图判断。
              </p>
            </div>
            <button
              type="button"
              onClick={startParsing}
              disabled={!dualTrackReady || isParsing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/35"
            >
              {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
              {isParsing ? '正在解析...' : '开始解析'}
            </button>
            {!dualTrackReady && (
              <p className="mt-2 text-center text-[10px] text-amber-100/55">{dualTrackBlocker}</p>
            )}
          </div>

          {/* Parsing status */}
          {isParsing && (
            <div className="relative overflow-hidden rounded-xl border border-cyan-300/25 bg-cyan-400/[0.08] px-4 py-3 shadow-[0_0_28px_rgba(34,211,238,0.12)]">
              <div className="absolute inset-x-0 top-0 h-px animate-pulse bg-cyan-300/70" />
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                <div>
                  <p className="text-xs font-semibold text-cyan-100">正在解析 SKU 与参考图</p>
                  <p className="mt-0.5 text-[10px] text-cyan-100/55">图片正在识别中，完成后会自动更新中间选择和右侧属性。</p>
                </div>
              </div>
            </div>
          )}

          {/* Conflict indicator */}
          {parsing?.conflicts && parsing.conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">
                  {parsing.conflicts.length} conflict{parsing.conflicts.length > 1 ? 's' : ''}
                </span>
              </div>
              {parsing.conflicts.map((c, i) => (
                <div key={i} className="text-[10px] text-white/40">
                  <span className="font-medium text-white/50">{c.key}</span>:{' '}
                  {String(c.comfyuiValue)} vs {String(c.thirdPartyValue)}
                  {c.resolvedValue != null && (
                    <span className="text-emerald-400/60">
                      {' → '}{String(c.resolvedValue)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Middle: Interactive Decision Tree (4 cols) ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BrainCircuit className="h-4 w-4 text-violet-400" />
              {t('production.prep.decisionTree')}
            </h2>
            {!decisionTreeSkipped && steps.length > 0 && (
              <button
                type="button"
                onClick={handleSkipDecisionTree}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-white/35 transition hover:bg-white/[0.06] hover:text-white/60"
              >
                <SkipForward className="h-3 w-3" />
                跳过
              </button>
            )}
          </div>

          {isEvaluating ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-violet-400/40" />
              <p className="text-xs text-white/40">
                {t('production.prep.evaluating')}
              </p>
            </div>
          ) : steps.length > 0 ? (
            <div className="space-y-4">
              {/* Questionnaire progress */}
              <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.04] p-3">
                <div className="mb-2 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-violet-200/80">出图四问确认</span>
                  <span className="tabular-nums text-white/35">
                    已确认 {decisionProgress.answered} / {decisionProgress.total}，还剩 {decisionProgress.remaining} 项
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-300"
                    style={{ width: `${decisionProgress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/35">
                  按四个固定问题选择“要/不要”：SKU 产品、SKU 背景、参考产品、参考背景。系统会把选择结果转成自然语言，并拼进下一步的本次出图要求。
                </p>
                {decisionProgress.historicalAnswered > 0 && Object.keys(sessionSelections).length === 0 && (
                  <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] p-2.5 text-[10px] leading-relaxed text-cyan-100/70">
                    已自动保留你上次完成的策略选择。需要调整时，直接点对应选项即可覆盖保存。
                  </div>
                )}
                {decisionProgress.complete && (
                  <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.05] p-2.5 text-[10px] leading-relaxed text-emerald-100/70">
                    策略取舍已确认完成。需要调整时可点“上一项”回看修改；也可以继续进入策略配置。
                  </div>
                )}
              </div>

              {/* Current step detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={steps[currentStepIndex]?.id || 'empty'}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {steps[currentStepIndex] && (
                    <DecisionStepCard
                      step={steps[currentStepIndex]}
                      isCurrent={true}
                      onSelectOption={handleSelectOption}
                    />
                  )}
                </motion.div>
              </AnimatePresence>


              {/* Step navigation */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((i) => i - 1)}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/60 disabled:opacity-20 disabled:cursor-default"
                >
                  <ChevronLeft className="h-3 w-3" />
                  上一项
                </button>
                <span className="text-[10px] tabular-nums text-white/20">
                  {currentStepIndex + 1} / {steps.length}
                </span>
                <button
                  type="button"
                  disabled={currentStepIndex >= steps.length - 1}
                  onClick={() => setCurrentStepIndex((i) => i + 1)}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/60 disabled:opacity-20 disabled:cursor-default"
                >
                  下一项
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Selection summary */}
              {decisionTree?.overallConfidence != null && (
                <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-white/40">
                      本次已确认:
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {steps
                        .filter((s) => s.selectedOptionId)
                        .map((s) => {
                          const opt = s.options.find(
                            (o) => o.id === s.selectedOptionId,
                          )
                          return opt ? (
                            <span
                              key={s.id}
                              className="rounded-md bg-violet-400/[0.08] px-1.5 py-0.5 text-[9px] text-violet-300/80"
                            >
                              {opt.label}
                            </span>
                          ) : null
                        })}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-violet-400">
                    {Math.round(decisionTree.overallConfidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          ) : parsingBlocked ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-5 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-amber-400/70" />
              <p className="text-xs font-semibold text-amber-300/90">
                当前还不能解析
              </p>
              <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-white/45">
                {parsingBlockerMessage || '图片已上传成功，但识别服务暂时不可用。系统不会用假结果继续下一步。'}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-white/15" />
              <p className="text-xs text-white/30">
                {hasSources ? '点击“开始解析”，系统会识别商品形态、材质、风格和场景。' : t('production.prep.uploadFirst')}
              </p>
            </div>
          )}
        </motion.section>

        {/* ─── Right: Parsed Attributes (3 cols) ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="min-h-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:col-span-3"
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Tag className="h-4 w-4 text-emerald-400" />
            {t('production.prep.parsedAttributes')}
            {parsing?.mergedAttributes.length ? (
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-normal text-white/30">
                {parsing.mergedAttributes.length} 项
              </span>
            ) : null}
          </h2>

          {parsing?.mergedAttributes.length ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3 text-[10px] leading-relaxed text-white/40">
                这里展示图片解析得到的 SKU 与参考素材信息。中间四问会把“要/不要”转成自然语言，并同步影响下一步出图要求。
              </div>
              <div className="space-y-1.5 max-h-[430px] overflow-y-auto pr-1 scrollbar-thin">
              {parsing.mergedAttributes.map((attr) => {
                const labelKey = localizeAttributeLabel(attr, 'zh').toLowerCase().replace(/\s+/g, '_')
                const decision = attributeDecisionByKey.get(attr.key) || attributeDecisionByKey.get(labelKey)
                return <AttributeRow key={attr.key} attr={attr} decision={decision} />
              })}
              </div>
            </div>
          ) : parsingBlocked ? (
            <p className="rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-3 py-4 text-center text-[11px] leading-relaxed text-amber-200/70">
              图片已上传，但识别服务暂时不可用，所以这里不会展示假属性。
            </p>
          ) : (
            <p className="py-8 text-center text-xs text-white/30">
              {t('production.prep.noAttributesYet')}
            </p>
          )}
        </motion.section>
      </div>

      {/* ═══ Bottom: Global Weight Control (Full Width) ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-violet-400" />
            参考侧重调节
          </h2>
          <p className="text-[10px] text-white/25">
            这里的调整会影响下一步出图要求
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-white/80">
                整体参考比例
              </h3>
              <p className="mt-0.5 text-[10px] text-white/30">
                {t('production.prep.globalBiasHint')}
              </p>
            </div>
            <span className="min-w-[2.5rem] text-right text-sm font-bold tabular-nums text-white/90">
              {globalDriftBias}%
            </span>
          </div>
          <div className="relative h-2.5 rounded-full bg-gradient-to-r from-cyan-400/30 via-white/10 to-amber-400/30">
            <div
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.15)] transition-all duration-100"
              style={{
                left: `${globalDriftBias}%`,
                backgroundColor:
                  globalDriftBias < 35
                    ? 'rgb(34 211 238)'
                    : globalDriftBias > 65
                      ? 'rgb(251 191 36)'
                      : 'rgb(255 255 255)',
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={globalDriftBias}
              onChange={(e) => handleDriftBiasChange(Number(e.target.value))}
              onMouseUp={(e) => void commitDriftBias(Number(e.currentTarget.value))}
              onPointerUp={(e) => void commitDriftBias(Number(e.currentTarget.value))}
              onTouchEnd={(e) => void commitDriftBias(Number(e.currentTarget.value))}
              onKeyUp={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
                  void commitDriftBias(Number(e.currentTarget.value))
                }
              }}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {t('production.prep.preserveSkuDetails')}
            </span>
            <span className="flex items-center gap-1.5">
              {t('production.prep.mimicReference')}
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
          </div>
        </div>
      </motion.section>

      {parsing?.status === 'succeeded' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 z-20 mt-5 rounded-2xl border border-emerald-300/20 bg-[#07120f]/95 p-4 shadow-[0_18px_60px_rgba(16,185,129,0.16)] backdrop-blur"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100">生产准备已完成</p>
              <p className="mt-1 text-[11px] text-emerald-100/55">下一步进入策略配置：确认生成数量、模板预览和执行参数。</p>
            </div>
            <button
              type="button"
              onClick={goToSandbox}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              进入策略配置
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
