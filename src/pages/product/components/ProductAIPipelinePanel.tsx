import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ChevronDown,
  CircleDot,
  Database,

  FileCode2,
  Image as ImageIcon,
  LoaderCircle,
  PackageCheck,
} from 'lucide-react'
import type {
  ExportTask,
  ListingVersion,
  Product,
  ProductAssetItem,
  ProductParsedInfo,
  ProductPrompt,
} from '@/types/product'
import { Button } from '@/components/ui/Button'

type PipelineStatus = 'ready' | 'running' | 'blocked' | 'failed' | 'missing'

type Props = {
  product: Product
  assets: ProductAssetItem[]
  listingVersions: ListingVersion[]
  exportTasks: ExportTask[]
  parsedInfo: ProductParsedInfo | null
  prompts: ProductPrompt[]
  aiLoading: boolean
  aiError: string | null
  generatingPrompt: boolean
  onGeneratePrompt: () => void
  onOpenAssets: () => void
  onOpenListings: () => void
  onOpenExports: () => void
}

const statusStyle: Record<PipelineStatus, string> = {
  ready: 'border-teal-400/30 bg-teal-400/10 text-teal-200',
  running: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  blocked: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  failed: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  missing: 'border-white/10 bg-white/[0.03] text-white/50',
}

const dotStyle: Record<PipelineStatus, string> = {
  ready: 'bg-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.35)]',
  running: 'bg-sky-300 animate-pulse shadow-[0_0_16px_rgba(56,189,248,0.35)]',
  blocked: 'bg-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.3)]',
  failed: 'bg-rose-300 shadow-[0_0_16px_rgba(251,113,133,0.3)]',
  missing: 'bg-white/30',
}

const PARSED_STATUS_LABEL_KEYS: Record<ProductParsedInfo['status'] | 'empty', string> = {
  empty: 'product.detail.ai.parsed.status.empty',
  pending: 'product.detail.ai.parsed.status.pending',
  succeeded: 'product.detail.ai.parsed.status.succeeded',
  failed: 'product.detail.ai.parsed.status.failed',
}

const PROMPT_STATUS_LABEL_KEYS: Record<string, string> = {
  draft: 'product.detail.ai.prompt.status.draft',
  ready: 'product.detail.ai.prompt.status.ready',
  failed: 'product.detail.ai.prompt.status.failed',
  archived: 'product.detail.ai.prompt.status.archived',
}

function flattenFeatures(value: Record<string, unknown>): Array<{ key: string; value: string }> {
  return Object.entries(value).flatMap(([key, raw]) => {
    if (Array.isArray(raw)) return raw.slice(0, 6).map(item => ({ key, value: String(item) }))
    if (raw && typeof raw === 'object') {
      return Object.entries(raw as Record<string, unknown>).slice(0, 8).map(([childKey, childValue]) => ({
        key: `${key}.${childKey}`,
        value: Array.isArray(childValue) ? childValue.join(', ') : String(childValue),
      }))
    }
    if (raw === undefined || raw === null || raw === '') return []
    return [{ key, value: String(raw) }]
  }).slice(0, 18)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function valueToText(value: unknown): string {
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(', ')
  if (value && typeof value === 'object') return ''
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

function flattenJsonRows(value: Record<string, unknown>, prefix = ''): Array<{ path: string; value: string }> {
  return Object.entries(value).flatMap(([key, raw]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(raw)) {
      const objectItems = raw.filter(item => item && typeof item === 'object')
      if (objectItems.length > 0) {
        return objectItems.flatMap((item, index) => flattenJsonRows(item as Record<string, unknown>, `${path}[${index}]`))
      }
      return [{ path, value: valueToText(raw) }]
    }
    if (raw && typeof raw === 'object') {
      return flattenJsonRows(raw as Record<string, unknown>, path)
    }
    return [{ path, value: valueToText(raw) }]
  })
}

function safeObjectFieldCount(value: Record<string, unknown>) {
  return flattenJsonRows(value).filter(row => row.value !== '—').length
}

function promptBusinessSummary(prompt: ProductPrompt) {
  return {
    contentReady: prompt.content.trim().length > 0,
    schemaFields: safeObjectFieldCount(prompt.schemaJson),
    sourceLinks: safeObjectFieldCount(prompt.sourceMapJson),
  }
}

export function ProductAIPipelinePanel({
  product,
  assets,
  listingVersions,
  exportTasks,
  parsedInfo,
  prompts,
  aiLoading,
  aiError,
  generatingPrompt,
  onGeneratePrompt,
  onOpenAssets,
  onOpenListings,
  onOpenExports,
}: Props) {
  const { t } = useTranslation()
  const [expandedPromptId, setExpandedPromptId] = useState<string | null | undefined>(undefined)
  const activeExpandedPromptId = expandedPromptId === undefined ? prompts[0]?.id ?? null : expandedPromptId

  const adoptedListing = listingVersions.find(item => item.status === 'adopted')
  const hasPrimaryAsset = assets.some(item => item.relation.isPrimary)
  const readyExport = exportTasks.some(item => item.status === 'succeeded')
  const parsedStatus: PipelineStatus = aiLoading
    ? 'running'
    : parsedInfo?.status === 'succeeded'
      ? 'ready'
      : parsedInfo?.status === 'failed'
        ? 'failed'
        : parsedInfo?.status === 'pending'
          ? 'running'
          : 'missing'
  const promptStatus: PipelineStatus = prompts.length > 0 ? 'ready' : parsedInfo?.status === 'succeeded' ? 'blocked' : 'missing'
  const artifactStatus: PipelineStatus = adoptedListing && hasPrimaryAsset ? 'ready' : listingVersions.length > 0 || assets.length > 0 ? 'blocked' : 'missing'
  const exportStatus: PipelineStatus = readyExport ? 'ready' : adoptedListing && hasPrimaryAsset ? 'blocked' : 'missing'

  const blockers = useMemo(() => {
    const items: Array<{ key: string; label: string }> = []
    if (assets.length === 0) items.push({ key: 'no-assets', label: t('product.detail.ai.blockers.noAssets') })
    if (!parsedInfo || parsedInfo.status !== 'succeeded') items.push({ key: 'no-parsed-info', label: t('product.detail.ai.blockers.noParsedInfo') })
    if (parsedInfo?.status === 'succeeded' && prompts.length === 0) items.push({ key: 'no-prompt', label: t('product.detail.ai.blockers.noPrompt') })
    if (prompts.length > 0 && !adoptedListing) items.push({ key: 'no-adopted-listing', label: t('product.detail.ai.blockers.noAdoptedListing') })
    if (adoptedListing && !hasPrimaryAsset) items.push({ key: 'no-primary-asset', label: t('product.detail.ai.blockers.noPrimaryAsset') })
    return items.slice(0, 3)
  }, [adoptedListing, assets.length, hasPrimaryAsset, parsedInfo, prompts.length, t])

  const nextAction = useMemo(() => {
    if (assets.length === 0) {
      return { title: t('product.detail.ai.next.bindAssets'), reason: t('product.detail.ai.next.bindAssetsReason'), output: t('product.detail.ai.next.bindAssetsOutput'), action: t('product.detail.ai.actions.bindAssets'), run: onOpenAssets, disabled: false }
    }
    if (parsedInfo?.status === 'pending') {
      return { title: t('product.detail.ai.next.waitParsed'), reason: t('product.detail.ai.next.waitParsedReason'), output: t('product.detail.ai.next.waitParsedOutput'), action: t('product.detail.ai.actions.checkAssets'), run: onOpenAssets, disabled: false }
    }
    if (parsedInfo?.status === 'failed') {
      return { title: t('product.detail.ai.next.retryParsed'), reason: t('product.detail.ai.next.retryParsedReason'), output: t('product.detail.ai.next.retryParsedOutput'), action: t('product.detail.ai.actions.checkAssets'), run: onOpenAssets, disabled: false }
    }
    if (!parsedInfo || parsedInfo.status !== 'succeeded') {
      return { title: t('product.detail.ai.next.checkParsing'), reason: t('product.detail.ai.next.checkParsingReason'), output: t('product.detail.ai.next.checkParsingOutput'), action: t('product.detail.ai.actions.checkAssets'), run: onOpenAssets, disabled: false }
    }
    if (prompts.length === 0) {
      return { title: t('product.detail.ai.next.generatePrompt'), reason: t('product.detail.ai.next.generatePromptReason'), output: t('product.detail.ai.next.generatePromptOutput'), action: t('product.detail.ai.actions.generatePrompt'), run: onGeneratePrompt, disabled: generatingPrompt }
    }
    if (!adoptedListing) {
      return { title: t('product.detail.ai.next.generateListing'), reason: t('product.detail.ai.next.generateListingReason'), output: t('product.detail.ai.next.generateListingOutput'), action: t('product.detail.ai.actions.viewListings'), run: onOpenListings, disabled: false }
    }
    if (!hasPrimaryAsset) {
      return { title: t('product.detail.ai.next.setPrimaryAsset'), reason: t('product.detail.ai.next.setPrimaryAssetReason'), output: t('product.detail.ai.next.setPrimaryAssetOutput'), action: t('product.detail.ai.actions.checkAssets'), run: onOpenAssets, disabled: false }
    }
    return { title: t('product.detail.ai.next.createExport'), reason: t('product.detail.ai.next.createExportReason'), output: t('product.detail.ai.next.createExportOutput'), action: t('product.detail.ai.actions.viewExports'), run: onOpenExports, disabled: false }
  }, [adoptedListing, assets.length, generatingPrompt, hasPrimaryAsset, onGeneratePrompt, onOpenAssets, onOpenExports, onOpenListings, parsedInfo, prompts.length, t])

  const confidence = parsedInfo?.confidence ?? 0
  const confidencePercent = Math.round(confidence * 100)
  const confidenceTone = confidence >= 0.8 ? 'bg-teal-300' : confidence >= 0.5 ? 'bg-amber-300' : 'bg-rose-300'
  const featureChips = flattenFeatures(parsedInfo?.visualFeatures ?? {})

  const stages = [
    { key: 'base-info', testId: 'pipeline-step-base-info', icon: Database, title: t('product.detail.ai.stages.base.title'), status: 'ready' as PipelineStatus, evidence: t('product.detail.ai.stages.base.evidence', { count: product.tags.length }) },
    { key: 'parsed-info', testId: 'pipeline-step-parsed-info', icon: CircleDot, title: t('product.detail.ai.stages.parsed.title'), status: parsedStatus, evidence: parsedInfo?.status === 'succeeded' ? t('product.detail.ai.stages.parsed.readyEvidence', { confidence: confidence.toFixed(2), version: parsedInfo.parserVersion || '—' }) : t(PARSED_STATUS_LABEL_KEYS[parsedInfo?.status ?? 'empty']) },
    { key: 'prompt', testId: 'pipeline-step-prompt', icon: FileCode2, title: t('product.detail.ai.stages.prompt.title'), status: promptStatus, evidence: prompts.length > 0 ? t('product.detail.ai.stages.prompt.readyEvidence', { version: prompts[0].versionNo, module: prompts[0].module }) : t('product.detail.ai.stages.prompt.emptyEvidence') },
    { key: 'assets-listing', testId: 'pipeline-step-assets-listing', icon: ImageIcon, title: t('product.detail.ai.stages.assets.title'), status: artifactStatus, evidence: t('product.detail.ai.stages.assets.evidence', { assets: assets.length, listings: listingVersions.length }) },
    { key: 'export-ready', testId: 'pipeline-step-export-ready', icon: PackageCheck, title: t('product.detail.ai.stages.export.title'), status: exportStatus, evidence: readyExport ? t('product.detail.ai.stages.export.readyEvidence') : t('product.detail.ai.stages.export.blockedEvidence') },
  ]

  const currentStageKey = !parsedInfo || parsedInfo.status !== 'succeeded'
    ? 'parsed-info'
    : prompts.length === 0
      ? 'prompt'
      : !adoptedListing || !hasPrimaryAsset
        ? 'assets-listing'
        : 'export-ready'

  return (
    <section data-testid="product-ai-pipeline" className="space-y-5">
      <div data-testid="product-detail-header" className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-2xl md:p-6">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-teal-200/70">{t('product.detail.ai.header.skuPrefix')} · {product.skuCode}</div>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-[-0.02em] text-white/95 md:text-[28px]">{product.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{t('product.detail.ai.header.subtitle')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
            <HeaderMetric label={t('product.detail.ai.header.confidence')} value={parsedInfo?.status === 'succeeded' ? `${confidencePercent}%` : '—'} />
            <HeaderMetric label={t('product.detail.ai.header.promptVersions')} value={String(prompts.length)} />
            <HeaderMetric label={t('product.detail.ai.header.exportBlockers')} value={String(blockers.length)} />
          </div>
        </div>
        <div className="relative mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span data-testid="product-detail-health-badge" className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${blockers.length === 0 ? statusStyle.ready : statusStyle.blocked}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${blockers.length === 0 ? dotStyle.ready : dotStyle.blocked}`} />
            {blockers.length === 0 ? t('product.detail.ai.health.ready') : parsedInfo?.status === 'succeeded' ? t('product.detail.ai.health.readyForPrompt') : t('product.detail.ai.health.needsParsedInfo')}
          </span>
          <Button
            data-testid="product-detail-primary-cta"
            onClick={nextAction.run}
            disabled={nextAction.disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/30 bg-teal-300/10 px-4 py-2.5 text-sm font-semibold text-teal-100 transition hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingPrompt && nextAction.action === t('product.detail.ai.actions.generatePrompt') ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            {generatingPrompt && nextAction.action === t('product.detail.ai.actions.generatePrompt') ? t('product.detail.ai.actions.generatingPrompt') : nextAction.action}
          </Button>
        </div>
      </div>

      {aiLoading ? <PipelineLoading /> : null}
      {aiError ? (
        <div data-testid="product-ai-pipeline-error-state" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div><b>{t('product.detail.ai.errors.artifactLoadTitle')}</b><p className="mt-1 text-amber-100/70">{t('product.detail.ai.errors.artifactLoadDesc')}</p></div>
          </div>
        </div>
      ) : null}

      <div className="relative grid gap-3 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-white/10 md:grid-cols-2 md:before:hidden xl:grid-cols-5 xl:after:absolute xl:after:left-8 xl:after:right-8 xl:after:top-[62px] xl:after:h-px xl:after:bg-white/10">
        {stages.map((stage) => {
          const Icon = stage.icon
          return (
            <Button
              key={stage.key}
              data-testid={stage.testId}
              onClick={stage.key === 'assets-listing' ? onOpenAssets : stage.key === 'export-ready' ? onOpenExports : undefined}
              className={`group relative z-10 min-h-[118px] rounded-2xl border bg-[var(--ecom-surface)] p-4 pl-12 text-left transition hover:-translate-y-0.5 hover:border-white/20 md:pl-4 ${stage.key === currentStageKey ? 'border-amber-400/60 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]' : stage.status === 'blocked' ? 'border-amber-400/45' : 'border-white/10'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80"><Icon className="h-4 w-4" /></div>
                <span data-testid={`pipeline-step-status-${stage.key}`} className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyle[stage.status]}`}>{t(`product.detail.ai.status.${stage.status}`)}</span>
              </div>
              <div className="mt-4 text-sm font-semibold text-white/90">{stage.title}</div>
              <div className="mt-1.5 text-xs leading-relaxed text-white/45">{stage.evidence}</div>
              <span className={`absolute left-4 top-4 h-2 w-2 rounded-full ${dotStyle[stage.status]}`} />
              {stage.key === currentStageKey ? <span className="absolute right-4 top-14 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100">{t('product.detail.ai.next.marker')}</span> : null}
            </Button>
          )
        })}
      </div>

      <div data-testid="pipeline-next-action-card" className="grid gap-4 rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">{t('product.detail.ai.next.title')}</div>
          <div className="mt-2 text-lg font-semibold text-white/90">{nextAction.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{nextAction.reason}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/60">{nextAction.output}</div>
        <Button data-testid="pipeline-next-action-button" onClick={nextAction.run} disabled={nextAction.disabled} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
          {generatingPrompt ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          {generatingPrompt ? t('product.detail.ai.actions.generatingPrompt') : nextAction.action}
        </Button>
        {blockers.length > 0 ? (
          <div data-testid="pipeline-blockers-list" className="lg:col-span-3 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {blockers.map(item => <span key={item.key} data-testid={`pipeline-blocker-${item.key}`} className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">{item.label}</span>)}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div data-testid="product-parsed-info-panel" className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5">
          <div data-testid="parsed-info-panel">
          <PanelTitle title={t('product.detail.ai.parsed.title')} subtitle={t('product.detail.ai.parsed.subtitle')} badge={t('product.detail.ai.parsed.readonly')} />
          {aiLoading ? <PanelSkeleton testId="parsed-info-loading" /> : !parsedInfo ? (
            <EmptyState testId="parsed-info-empty" icon={<Database className="h-7 w-7" />} title={t('product.detail.ai.parsed.emptyTitle')} desc={t('product.detail.ai.parsed.emptyDesc')} action={t('product.detail.ai.actions.bindAssets')} onAction={onOpenAssets} />
          ) : parsedInfo.status === 'failed' ? (
            <div data-testid="parsed-info-error" className="mt-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4">
              <div className="flex items-start gap-3 text-rose-100"><AlertTriangle className="mt-0.5 h-4 w-4" /><div><b>{t('product.detail.ai.parsed.failedTitle')}</b><p className="mt-1 text-sm text-rose-100/70">{t('product.detail.ai.parsed.failedDesc')}</p></div></div>
              <details className="mt-3 text-xs text-rose-100/60"><summary>{t('product.detail.ai.parsed.errorDetail')}</summary><p className="mt-2 font-mono">{parsedInfo.errorMessage || '—'}</p></details>
              <Button data-testid="parsed-info-retry-button" onClick={onOpenAssets} className="mt-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100">{t('product.detail.ai.actions.checkAssets')}</Button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs"><span data-testid="parsed-info-status-badge" className={`rounded-full border px-2 py-1 ${statusStyle[parsedStatus]}`}>{t(PARSED_STATUS_LABEL_KEYS[parsedInfo.status])}</span><span data-testid="parsed-info-confidence" className="font-mono text-white/60">{t('product.detail.ai.labels.confidence')} {confidence.toFixed(2)}</span></div>
                <div data-testid="parsed-info-confidence-bar" className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${confidenceTone}`} style={{ width: `${Math.min(100, Math.max(0, confidencePercent))}%` }} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Fact testId="parsed-info-category-guess" label={t('product.detail.ai.labels.categoryGuess')} value={parsedInfo.categoryGuess || '—'} />
                <Fact testId="parsed-info-platform-fit" label={t('product.detail.ai.labels.platformFit')} value={parsedInfo.platformFit.length ? parsedInfo.platformFit.join(' / ') : '—'} />
                <Fact label={t('product.detail.ai.labels.parserVersion')} value={parsedInfo.parserVersion || '—'} />
                <Fact label={t('product.detail.ai.labels.createdAt')} value={formatDate(parsedInfo.createdAt)} />
              </div>
              <div data-testid="parsed-info-visual-features"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">{t('product.detail.ai.labels.visualFeatures')}</div><div className="flex flex-wrap gap-2">{featureChips.length ? featureChips.map(item => <span key={`${item.key}-${item.value}`} className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-xs text-teal-100"><span className="font-mono text-teal-100/50">{item.key}</span> · {item.value}</span>) : <span className="text-sm text-white/35">—</span>}</div></div>
              <div data-testid="parsed-info-usage-scenarios"><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">{t('product.detail.ai.labels.usageScenarios')}</div><ul className="space-y-1.5 text-sm text-white/65">{parsedInfo.usageScenarios.length ? parsedInfo.usageScenarios.map(item => <li key={item}>• {item}</li>) : <li>—</li>}</ul></div>
              <div data-testid="parsed-info-source-assets" className="flex flex-wrap gap-2 border-t border-white/10 pt-4">{parsedInfo.sourceAssetIds.length ? parsedInfo.sourceAssetIds.map(assetId => <Button key={assetId} onClick={onOpenAssets} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/60">{assetId}</Button>) : <span className="text-sm text-white/35">{t('product.detail.ai.parsed.noSources')}</span>}</div>
            </div>
          )}
          </div>
        </div>

        <div data-testid="product-prompt-versions-panel" className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5">
          <div data-testid="prompt-versions-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <PanelTitle title={t('product.detail.ai.prompt.title')} subtitle={t('product.detail.ai.prompt.subtitle')} />
            <div>
              <Button data-testid="product-prompt-generate-button" onClick={onGeneratePrompt} disabled={parsedInfo?.status !== 'succeeded' || generatingPrompt} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-50">
                <span data-testid="prompt-create-button" className="contents">
                {generatingPrompt ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                {generatingPrompt ? t('product.detail.ai.actions.generatingPrompt') : t('product.detail.ai.actions.generatePrompt')}
                </span>
              </Button>
              {parsedInfo?.status !== 'succeeded' ? <div data-testid="prompt-create-disabled-reason" className="mt-2 text-xs text-amber-200/75">{t('product.detail.ai.prompt.disabledReason')}</div> : null}
            </div>
          </div>
          {aiLoading ? <PanelSkeleton testId="prompt-loading" /> : prompts.length === 0 ? (
            <EmptyState testId="prompt-empty" icon={<FileCode2 className="h-7 w-7" />} title={parsedInfo?.status === 'succeeded' ? t('product.detail.ai.prompt.emptyReadyTitle') : t('product.detail.ai.prompt.emptyWaitingTitle')} desc={parsedInfo?.status === 'succeeded' ? t('product.detail.ai.prompt.emptyReadyDesc') : t('product.detail.ai.prompt.emptyWaitingDesc')} action={parsedInfo?.status === 'succeeded' ? t('product.detail.ai.actions.generatePrompt') : t('product.detail.ai.actions.waitParsed')} onAction={parsedInfo?.status === 'succeeded' ? onGeneratePrompt : undefined} disabled={parsedInfo?.status !== 'succeeded' || generatingPrompt} />
          ) : (
            <div data-testid="prompt-version-list" className="mt-5 space-y-3">
              {prompts.map(prompt => {
                const expanded = activeExpandedPromptId === prompt.id
                const summary = promptBusinessSummary(prompt)
                return (
                  <article key={prompt.id} data-testid={`prompt-version-card-${prompt.versionNo}`} className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)]/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-white">v{prompt.versionNo}</span><span data-testid={`prompt-version-status-${prompt.versionNo}`} className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${prompt.status === 'ready' ? statusStyle.ready : prompt.status === 'failed' ? statusStyle.failed : statusStyle.blocked}`}>{t(PROMPT_STATUS_LABEL_KEYS[prompt.status] ?? 'product.detail.ai.prompt.status.unknown', prompt.status)}</span><span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">{prompt.generationType} · {prompt.module}</span></div>
                        <div className="mt-2 text-xs text-white/40">{formatDate(prompt.createdAt)} · {prompt.templateIds.length ? t('product.detail.ai.prompt.templateCount', { count: prompt.templateIds.length }) : t('product.detail.ai.prompt.noTemplate')}</div>
                      </div>
                      <Button data-testid={`prompt-version-expand-${prompt.versionNo}`} onClick={() => setExpandedPromptId(expanded ? null : prompt.id)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"><ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`} />{expanded ? t('product.detail.ai.actions.collapse') : t('product.detail.ai.actions.viewSummary')}</Button>
                    </div>
                    {expanded ? (
                      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                        <Fact testId={`prompt-version-content-${prompt.versionNo}`} label={t('product.detail.ai.prompt.sections.content')} value={summary.contentReady ? t('product.detail.ai.prompt.summary.contentReady') : '—'} />
                        <Fact testId={`prompt-version-schema-${prompt.versionNo}`} label={t('product.detail.ai.prompt.sections.schema')} value={t('product.detail.ai.prompt.summary.schemaFields', { count: summary.schemaFields })} />
                        <Fact testId={`prompt-version-source-map-${prompt.versionNo}`} label={t('product.detail.ai.prompt.sections.sourceMap')} value={t('product.detail.ai.prompt.summary.sourceLinks', { count: summary.sourceLinks })} />
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
          {aiError ? <div data-testid="prompt-error" className="mt-4 text-xs text-amber-200/70">{t('product.detail.ai.errors.artifactLoadDesc')}</div> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-white/45">
        <Link data-testid="open-ai-workspace-link" to={`/products/${product.id}/ai/ai-product`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:text-white">{t('product.detail.openAIWorkspace')}</Link>
        <Link data-testid="open-batch-listing-link" to="/aiChat/template" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:text-white">{t('product.detail.openBatchListing')}</Link>
        <Link data-testid="open-download-center-link" to="/products/workbench/downloads" className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:text-white">{t('product.detail.openDownloadCenter')}</Link>
      </div>
    </section>
  )
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div><div className="mt-1 font-mono text-lg font-semibold text-white/90">{value}</div></div>
}

function PanelTitle({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return <div><div className="flex items-center gap-2"><h3 className="text-base font-semibold text-white/90">{title}</h3>{badge ? <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45">{badge}</span> : null}</div><p className="mt-1 text-sm leading-relaxed text-white/45">{subtitle}</p></div>
}

function Fact({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return <div data-testid={testId} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div><div className="mt-1 break-words text-sm text-white/75">{value}</div></div>
}

function EmptyState({ testId, icon, title, desc, action, onAction, disabled }: { testId: string; icon: ReactNode; title: string; desc: string; action: string; onAction?: () => void; disabled?: boolean }) {
  return <div data-testid={testId} className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/45">{icon}</div><div className="mt-4 font-semibold text-white/80">{title}</div><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">{desc}</p><Button onClick={onAction} disabled={!onAction || disabled} className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">{action}</Button></div>
}

function PanelSkeleton({ testId }: { testId: string }) {
  return <div data-testid={testId} className="mt-5 space-y-3"><div className="h-3 w-2/3 rounded bg-white/10" /><div className="h-2 rounded bg-white/10" /><div className="grid gap-3 sm:grid-cols-2"><div className="h-16 rounded-xl bg-white/[0.06]" /><div className="h-16 rounded-xl bg-white/[0.06]" /></div></div>
}

function PipelineLoading() {
  const { t } = useTranslation()
  return <div data-testid="product-ai-pipeline-loading-state" className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100"><div className="flex items-center gap-3"><LoaderCircle className="h-4 w-4 animate-spin" />{t('product.detail.ai.loading')}</div></div>
}
