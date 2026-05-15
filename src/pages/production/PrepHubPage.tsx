import { useCallback, useEffect, useRef, useState } from 'react'
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
} from '@/types/production'

// ─── Polling helper ──────────────────────────────────────────
function usePolling<T>(
  fetcher: () => Promise<T>,
  shouldPoll: (data: T) => boolean,
  intervalMs = 2000,
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const start = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
      if (shouldPoll(result)) {
        timerRef.current = setTimeout(() => void start(), intervalMs)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Polling error')
    } finally {
      setLoading(false)
    }
  }, [fetcher, shouldPoll, intervalMs])

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => stop, [stop])

  return { data, error, loading, start, stop, setData }
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
  parseButton,
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
  parseButton?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          {title}
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-normal text-white/30">
            {sources.length}
          </span>
        </h3>
        {parseButton}
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-center transition hover:border-white/20 hover:bg-white/[0.01]"
      >
        {uploading ? (
          <Loader2 className="mb-1.5 h-6 w-6 animate-spin text-white/30" />
        ) : (
          <Upload className="mb-1.5 h-6 w-6 text-white/15" />
        )}
        <p className="text-[11px] text-white/30">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
      </div>

      {/* Thumbnails */}
      {sources.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {sources.map((src) => (
            <div
              key={src.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.03]"
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
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white/60 opacity-0 transition group-hover:opacity-100 hover:text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5">
                <span className="line-clamp-1 text-[8px] text-white/50">
                  {src.name || src.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
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
    active: 'text-violet-400',
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
              {t('production.prep.step')} {step.stepNumber}
            </span>
            {step.status === 'completed' && selectedOption && (
              <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                {t('production.prep.selected')}: {selectedOption.label}
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
                disabled={!isCurrent}
                onClick={() => onSelectOption(step.id, option.id)}
                className={`group relative flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left transition ${
                  isSelected
                    ? 'border-violet-400/40 bg-violet-400/[0.08]'
                    : isCurrent
                      ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      : 'border-white/[0.04] bg-white/[0.01] cursor-default'
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

function AttributeRow({ attr }: { attr: ParsedAttribute }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
      <div className="mb-1 flex items-center gap-2 min-w-0">
        <span className="truncate text-[11px] font-medium text-white/70">
          {attr.label}
        </span>
        <span
          className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${
            attr.source === 'comfyui'
              ? 'bg-cyan-400/10 text-cyan-400'
              : 'bg-amber-400/10 text-amber-400'
          }`}
        >
          {attr.source}
        </span>
      </div>
      <p className="mb-1.5 truncate text-[11px] text-white/45">
        {Array.isArray(attr.value)
          ? attr.value.join(', ')
          : String(attr.value)}
      </p>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${attr.confidence * 100}%`,
              backgroundColor:
                attr.confidence > 0.85
                  ? 'rgb(52 211 153 / 0.5)'
                  : attr.confidence > 0.7
                    ? 'rgb(251 191 36 / 0.5)'
                    : 'rgb(248 113 113 / 0.4)',
            }}
          />
        </div>
        <span className="shrink-0 text-[9px] tabular-nums text-white/20">
          {Math.round(attr.confidence * 100)}%
        </span>
      </div>
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
    removeSource,
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

  // ─── File upload ────────────────────────────────────────
  const skuInputRef = useRef<HTMLInputElement>(null)
  const refInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[], sourceType: 'sku_image' | 'reference_image') => {
      if (!productId) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) {
            toast.showToast(`${file.name} is not an image`, 'error')
            continue
          }
          const source = await productionApi.uploadParsingSource(productId, file)
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

  // ─── Parsing ────────────────────────────────────────────
  const parsingPoll = usePolling<DualTrackParsing>(
    () => productionApi.getParsingResult(productId!),
    (d) => d.status === 'parsing',
  )

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
          })
          parsingPoll.start()
        } catch { /* ignore */ }
      }, 300)
    }
  }, [productId, sources.length, parsing, addSource, parsingPoll])

  const startParsing = useCallback(async () => {
    if (!productId || sources.length === 0) return
    try {
      await productionApi.startParsing({
        productId,
        sourceIds: sources.map((s) => s.id),
        tracks: ['comfyui', 'third_party'],
      })
      parsingPoll.start()
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Parse failed', 'error')
    }
  }, [productId, sources, parsingPoll, toast])

  // Sync poll results into store
  useEffect(() => {
    if (parsingPoll.data) setParsing(parsingPoll.data)
  }, [parsingPoll.data, setParsing])

  // ─── Decision tree ──────────────────────────────────────
  const treePoll = usePolling<LlmDecisionTreeResult>(
    () => productionApi.getDecisionTree(productId!),
    (d) => d.status === 'evaluating',
  )

  const evaluateTree = useCallback(async () => {
    if (!productId || !parsing?.mergedAttributes) return
    try {
      await productionApi.evaluateDecisionTree({
        productId,
        attributes: parsing.mergedAttributes,
      })
      treePoll.start()
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Evaluation failed', 'error')
    }
  }, [productId, parsing, treePoll, toast])

  useEffect(() => {
    if (parsing?.status === 'succeeded' && !decisionTree) {
      void evaluateTree()
    }
  }, [parsing?.status, decisionTree, evaluateTree])

  useEffect(() => {
    if (treePoll.data) setDecisionTree(treePoll.data)
  }, [treePoll.data, setDecisionTree])

  // ─── Interactive decision tree step selection ───────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [decisionTreeSkipped, setDecisionTreeSkipped] = useState(false)

  // Sync currentStepIndex when decisionTree.steps changes
  useEffect(() => {
    if (decisionTree?.steps) {
      const activeIdx = decisionTree.steps.findIndex((s) => s.status === 'active')
      if (activeIdx >= 0) setCurrentStepIndex(activeIdx)
    }
  }, [decisionTree?.steps])

  const handleSelectOption = useCallback(
    (stepId: string, optionId: string) => {
      if (!decisionTree?.steps) return
      setDecisionTree({
        ...decisionTree,
        steps: decisionTree.steps.map((s) =>
          s.id === stepId
            ? { ...s, selectedOptionId: optionId, status: 'completed' as const }
            : s,
        ),
      })
      // Auto-advance to next pending step
      const currentIdx = decisionTree.steps.findIndex((s) => s.id === stepId)
      const nextPending = decisionTree.steps.findIndex(
        (s, i) => i > currentIdx && s.status === 'pending',
      )
      if (nextPending >= 0) {
        setDecisionTree((prev) => {
          if (!prev?.steps) return prev
          return {
            ...prev,
            steps: prev.steps.map((s, i) =>
              i === nextPending ? { ...s, status: 'active' as const } : s,
            ),
          }
        })
        setCurrentStepIndex(nextPending)
      }
    },
    [decisionTree, setDecisionTree],
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

  const isParsing = parsing?.status === 'parsing' || parsingPoll.loading
  const isEvaluating = decisionTree?.status === 'evaluating' || treePoll.loading

  // Parse button
  const hasSources = sources.length > 0
  const parseBtn = hasSources && !isParsing ? (
    <button
      type="button"
      onClick={startParsing}
      className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-400 transition hover:bg-cyan-500/25"
    >
      <RotateCw className="h-2.5 w-2.5" />
      {t('production.prep.startParsing')}
    </button>
  ) : null

  // ─── Steps navigation ───────────────────────────────────
  const steps = decisionTree?.steps || []

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
            title={t('production.prep.skuSourceUpload')}
            icon={Package}
            iconColor="text-cyan-400"
            hint={t('production.prep.skuDropzoneHint')}
            sources={skuSources}
            uploading={uploading}
            onDrop={onDropSku}
            onFileInput={onFileInputSku}
            onRemove={removeSource}
            inputRef={skuInputRef}
            parseButton={parseBtn}
          />
          <UploadZone
            title={t('production.prep.referenceSourceUpload')}
            icon={Image}
            iconColor="text-amber-400"
            hint={t('production.prep.referenceDropzoneHint')}
            sources={refSources}
            uploading={uploading}
            onDrop={onDropRef}
            onFileInput={onFileInputRef}
            onRemove={removeSource}
            inputRef={refInputRef}
          />

          {/* Parsing status */}
          {isParsing && (
            <div className="flex items-center gap-2 rounded-lg bg-cyan-400/[0.06] px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span className="text-xs text-cyan-400/80">
                {t('production.prep.evaluating')}
              </span>
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
                  {c.resolvedValue && (
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
                <SkipForward className="h-2.5 w-2.5" />
                {t('production.prep.skipDecisionTree')}
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
              {/* Step progress bar */}
              <div className="flex items-center gap-2">
                {steps.map((step, i) => {
                  const isCompleted = step.status === 'completed'
                  const isActive = step.status === 'active'
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStepIndex(i)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition ${
                        isActive
                          ? 'bg-violet-400/15 text-violet-400'
                          : isCompleted
                            ? 'bg-emerald-400/10 text-emerald-400/70 hover:bg-emerald-400/15'
                            : 'bg-white/[0.04] text-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <span className="text-[9px]">{i + 1}</span>
                      )}
                      {step.title}
                    </button>
                  )
                })}
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
                      isCurrent={steps[currentStepIndex].status === 'active'}
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
                  {t('production.prep.prevStep')}
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
                  {t('production.prep.nextStep')}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Selection summary */}
              {decisionTree?.overallConfidence != null && (
                <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-white/40">
                      {t('production.prep.currentSelection')}:
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
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-white/15" />
              <p className="text-xs text-white/30">
                {t('production.prep.uploadFirst')}
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
                {parsing.mergedAttributes.length} {t('production.prep.attributesFound')}
              </span>
            ) : null}
          </h2>

          {parsing?.mergedAttributes.length ? (
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
              {parsing.mergedAttributes.map((attr) => (
                <AttributeRow key={attr.key} attr={attr} />
              ))}
            </div>
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
            {t('production.prep.driftControl')}
          </h2>
          <p className="text-[10px] text-white/25">
            {t('production.prep.allAdjustmentsAffectPrompt')}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-white/80">
                {t('production.prep.globalBias')}
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
              onChange={(e) => setGlobalDriftBias(Number(e.target.value))}
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
    </div>
  )
}
