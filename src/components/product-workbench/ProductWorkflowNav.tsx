import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type WorkflowStation = 'queue' | 'detail' | 'listing' | 'delivery'

type ProductWorkflowNavProps = {
  active: WorkflowStation
  productId?: string
  productIds?: string[]
  contextLabel?: string
  source?: string
  className?: string
}

const STATIONS: Array<{ id: WorkflowStation; labelKey: string; fallback: string; hintKey: string; hintFallback: string }> = [
  { id: 'queue', labelKey: 'productWorkbench.workflow.queue', fallback: 'Queue', hintKey: 'productWorkbench.workflow.queueHint', hintFallback: 'Intake / triage board' },
  { id: 'detail', labelKey: 'productWorkbench.workflow.detail', fallback: 'SKU Detail', hintKey: 'productWorkbench.workflow.detailHint', hintFallback: 'One-SKU production dossier' },
  { id: 'listing', labelKey: 'productWorkbench.workflow.listing', fallback: 'Listing', hintKey: 'productWorkbench.workflow.listingHint', hintFallback: 'Template → validate → version' },
  { id: 'delivery', labelKey: 'productWorkbench.workflow.delivery', fallback: 'Export', hintKey: 'productWorkbench.workflow.deliveryHint', hintFallback: 'Delivery / downloads gate' },
]

function compactIds(productId?: string, productIds?: string[]) {
  const ids = productIds?.filter(Boolean) ?? []
  if (ids.length) return Array.from(new Set(ids))
  return productId ? [productId] : []
}

function buildStationHref(station: WorkflowStation, productId?: string, productIds?: string[], source = 'product-center') {
  const ids = compactIds(productId, productIds)
  const primaryId = productId || ids[0]
  const encodedIds = ids.length ? encodeURIComponent(ids.join(',')) : ''
  switch (station) {
    case 'queue':
      return '/products'
    case 'detail':
      return primaryId ? `/products/${primaryId}` : '/products'
    case 'listing':
      return '/aiChat/template'
    case 'delivery':
      return encodedIds ? `/products/workbench/downloads?productIds=${encodedIds}&source=${encodeURIComponent(source)}` : '/products/workbench/downloads'
  }
}

export function ProductWorkflowNav({ active, productId, productIds, contextLabel, source = 'product-center', className = '' }: ProductWorkflowNavProps) {
  const { t } = useTranslation()
  const ids = compactIds(productId, productIds)
  const hasSingleSku = Boolean(productId || ids.length === 1)

  return (
    <nav className={`rounded-[28px] border border-white/[0.08] bg-[var(--ecom-surface-raised)] p-3 shadow-[0_18px_54px_rgba(0,0,0,0.28)] ring-1 ring-cyan-300/5 ${className}`} aria-label={t('productWorkbench.workflow.aria')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200/65">{t('productWorkbench.workflow.title')}</div>
        <div className="max-w-[360px] truncate text-[11px] text-white/35" title={contextLabel || undefined}>{contextLabel || (ids.length ? t('productWorkbench.workflow.contextCount', { count: ids.length }) : t('productWorkbench.workflow.noContext'))}</div>
      </div>
      <div className="flex items-stretch overflow-x-auto pb-1">
        {STATIONS.map((station, index) => {
          const disabled = station.id === 'detail' && !hasSingleSku
          const activeStation = station.id === active
          const node = (
            <div className={`group min-w-[155px] rounded-2xl border px-3 py-2 transition ${activeStation ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-white shadow-[0_0_24px_rgba(103,232,249,0.08)]' : disabled ? 'border-white/[0.04] bg-white/[0.02] text-white/25' : 'border-white/[0.06] bg-white/[0.035] text-white/55 hover:border-white/12 hover:bg-[var(--ecom-surface-hover)] hover:text-white/82'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${activeStation ? 'bg-cyan-200 text-[var(--ecom-action-primary-text)]' : 'bg-white/[0.08] text-white/55'}`}>{index + 1}</span>
                <span className="text-xs font-semibold">{t(station.labelKey, station.fallback)}</span>
              </div>
              <div className="mt-1 truncate pl-7 text-[11px] opacity-55">{disabled ? t('productWorkbench.workflow.selectOne') : t(station.hintKey, station.hintFallback)}</div>
            </div>
          )
          return (
            <div key={station.id} className="flex items-center">
              {disabled ? <div className="cursor-not-allowed">{node}</div> : <Link to={buildStationHref(station.id, productId, productIds, source)}>{node}</Link>}
              {index < STATIONS.length - 1 ? <div className="mx-2 h-px w-8 shrink-0 bg-gradient-to-r from-cyan-200/20 to-white/8" /> : null}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
