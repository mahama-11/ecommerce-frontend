import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, LockKeyhole, PackageCheck, RadioTower, Route, ShieldAlert, Sparkles, Trash2, XCircle } from 'lucide-react'
import type { CapabilityState, MissionStage, MissionWorkUnit, ProductionStageSummary } from '@/pages/product/utils/productMission'

const STATE_CLASS: Record<CapabilityState, string> = {
  available: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  partial: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  blocked: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  'contract-needed': 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  unsupported: 'border-white/15 bg-white/5 text-white/45',
  'commercial-gate': 'border-orange-400/30 bg-orange-400/10 text-orange-200',
}

const STATE_ICON: Record<CapabilityState, typeof CheckCircle2> = {
  available: CheckCircle2,
  partial: CircleDashed,
  blocked: XCircle,
  'contract-needed': LockKeyhole,
  unsupported: ShieldAlert,
  'commercial-gate': AlertTriangle,
}

export function CapabilityBadge({ state, label }: { state: CapabilityState; label: string }) {
  const Icon = STATE_ICON[state]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATE_CLASS[state]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

export function ContractNeededNotice({ notes }: { notes: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="mb-2 flex items-center gap-2 font-semibold text-amber-100">
        <LockKeyhole className="h-4 w-4" />
        Contract-needed / no-fake capability guard
      </div>
      <ul className="space-y-1 text-xs leading-5 text-amber-100/70">
        {notes.map(note => <li key={note}>• {note}</li>)}
      </ul>
    </div>
  )
}

export function ProductionRail({
  stages,
  activeStage,
  onStageChange,
}: {
  stages: ProductionStageSummary[]
  activeStage: MissionStage | 'all'
  onStageChange: (stage: MissionStage | 'all') => void
}) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#080b11]/95 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.42)] ring-1 ring-cyan-300/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/70">
            <RadioTower className="h-4 w-4" /> Production Rail
          </div>
          <h2 className="mt-1 text-xl font-semibold text-white">SKU Mission Control stage system</h2>
        </div>
        <button
          onClick={() => onStageChange('all')}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeStage === 'all' ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/55 hover:text-white'}`}
        >
          All queue · {total}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {stages.map((stage, index) => {
          const active = activeStage === stage.stage
          return (
            <button
              key={stage.stage}
              onClick={() => onStageChange(stage.stage)}
              className={`group relative min-h-[132px] overflow-hidden rounded-2xl border p-3 text-left transition ${active ? 'border-cyan-300/50 bg-cyan-300/[0.12] shadow-[0_0_34px_rgba(103,232,249,0.12)]' : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'}`}
            >
              <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/35">
                    <span>0{index + 1}</span>
                    {stage.contractNeeded ? <LockKeyhole className="h-3.5 w-3.5 text-amber-200/70" /> : null}
                  </div>
                  <div className="text-sm font-semibold text-white">{stage.label}</div>
                  <div className="mt-1 text-[11px] leading-4 text-white/45">{stage.description}</div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-semibold tabular-nums text-white">{stage.count}</div>
                  <div className="text-right text-[11px] leading-4 text-white/45">
                    <div>{stage.blocked} blocked</div>
                    <div>{stage.contractNeeded ? 'contract-needed' : 'ready data'}</div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function StationNav() {
  const stations = [
    { label: 'Mission Control', href: '/products', active: true },
    { label: 'Listing Station', href: '/products/workbench/batch-listing' },
    { label: 'Visual Station', href: '/products/workbench/visual-tools' },
    { label: 'Delivery Station', href: '/products/workbench/downloads' },
  ]
  return (
    <nav className="flex flex-wrap gap-2">
      {stations.map(station => (
        <Link
          key={station.label}
          to={station.href}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${station.active ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/45 hover:text-white'}`}
        >
          {station.label}
        </Link>
      ))}
    </nav>
  )
}

export function SkuWorkUnitCard({
  unit,
  selected,
  focused,
  onSelect,
  onFocus,
  onDelete,
  deleting = false,
}: {
  unit: MissionWorkUnit
  selected: boolean
  focused: boolean
  onSelect: () => void
  onFocus: () => void
  onDelete?: () => void
  deleting?: boolean
}) {
  const { product } = unit
  return (
    <article
      onClick={onFocus}
      className={`group rounded-3xl border bg-[#0b0f16]/90 p-4 transition hover:border-cyan-200/30 hover:bg-[#101722] ${focused ? 'border-cyan-300/50 shadow-[0_0_35px_rgba(103,232,249,0.10)]' : 'border-white/10'} ${selected ? 'ring-1 ring-emerald-300/40' : ''}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={event => {
            event.stopPropagation()
            onSelect()
          }}
          onClick={event => event.stopPropagation()}
          className="mt-1 rounded border-white/20 bg-black/30 accent-cyan-400"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/7 px-2 py-0.5 font-mono text-[11px] text-white/55">{product.skuCode}</span>
            <CapabilityBadge state={unit.nextBestAction.state} label={unit.stageLabel} />
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{unit.blocker}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums text-white">{unit.healthScore}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">readiness</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Assets" value={String(product.assetsCount)} state={product.assetStatus} />
        <MiniMetric label="Listing" value={String(product.listingVersionsCount)} state={product.listingStatus} />
        <MiniMetric label="Export" value={product.exportStatus} state={product.exportStatus} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
        <div className="text-[11px] text-white/38">
          {product.categoryId || 'No category'} · {product.brandId || 'No brand'}
        </div>
        <div className="flex items-center gap-2">
          {onDelete ? (
            <button
              type="button"
              disabled={deleting}
              onClick={event => {
                event.stopPropagation()
                onDelete()
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/20 bg-rose-300/8 px-3 py-1.5 text-xs font-semibold text-rose-100/70 transition hover:bg-rose-300/14 hover:text-rose-100 disabled:cursor-wait disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting' : 'Delete'}
            </button>
          ) : null}
          <Link
            to={unit.nextBestAction.href}
            onClick={event => event.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            {unit.nextBestAction.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function MiniMetric({ label, value, state }: { label: string; value: string; state: string }) {
  const stateClass = state === 'ready' || state === 'done' ? 'text-emerald-200' : state === 'partial' || state === 'pending' ? 'text-amber-200' : 'text-white/45'
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</div>
      <div className={`mt-1 truncate text-sm font-semibold ${stateClass}`}>{value}</div>
    </div>
  )
}

export function NextBestActionPanel({ unit }: { unit: MissionWorkUnit }) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
        <Sparkles className="h-4 w-4" /> Next Best Action
      </div>
      <div className="text-lg font-semibold text-white">{unit.nextBestAction.label}</div>
      <p className="mt-2 text-sm leading-6 text-white/60">{unit.nextBestAction.helper}</p>
      <Link
        to={unit.nextBestAction.href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
      >
        Route / handoff only
        <Route className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function MissionDossier({ unit }: { unit: MissionWorkUnit | null }) {
  if (!unit) {
    return (
      <aside className="rounded-[28px] border border-white/10 bg-[#080b11]/95 p-6 text-white/55">
        Select a SKU work unit to open the Mission Dossier.
      </aside>
    )
  }
  const { product } = unit
  return (
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border border-white/10 bg-[#080b11]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/65">Mission Dossier</div>
          <h2 className="text-xl font-semibold leading-tight text-white">{product.title}</h2>
          <div className="mt-2 font-mono text-xs text-white/45">{product.skuCode}</div>
        </div>
        <CapabilityBadge state={unit.nextBestAction.state} label={unit.stageLabel} />
      </div>

      <NextBestActionPanel unit={unit} />

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <PackageCheck className="h-4 w-4 text-cyan-200" /> Readiness breakdown
        </div>
        <div className="space-y-3">
          {unit.readiness.map(item => (
            <div key={item.key} className="rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-white/85">{item.label}</div>
                <CapabilityBadge state={item.state} label={item.state} />
              </div>
              <div className="text-xs leading-5 text-white/48">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 text-sm font-semibold text-white">Stage timeline</div>
        <div className="space-y-2">
          {['Intake', 'Template', 'Visual', 'Listing', 'Export', 'Delivery', 'Commercial'].map((label, index) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <div className={`h-2.5 w-2.5 rounded-full ${index <= unit.stageIndex ? 'bg-cyan-200' : 'bg-white/15'}`} />
              <div className={index <= unit.stageIndex ? 'text-white/75' : 'text-white/32'}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to={`/products/${product.id}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold text-white/75 transition hover:bg-white/10">Full detail</Link>
        <Link to={`/products/${product.id}/ai/ai-product`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold text-white/75 transition hover:bg-white/10">Visual workspace</Link>
        <Link to={`/products/workbench/batch-listing?productIds=${encodeURIComponent(product.id)}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold text-white/75 transition hover:bg-white/10">Listing Station</Link>
        <Link to="/products/workbench/downloads" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-semibold text-white/75 transition hover:bg-white/10">Delivery Station</Link>
      </div>

      <div className="mt-5">
        <ContractNeededNotice notes={unit.contractNotes} />
      </div>
    </aside>
  )
}

export function CommandStrip({
  selectedUnits,
  onClear,
}: {
  selectedUnits: MissionWorkUnit[]
  onClear: () => void
}) {
  const ids = selectedUnits.map(unit => unit.product.id)
  const query = ids.length > 0 ? `?productIds=${encodeURIComponent(ids.join(','))}` : ''
  return (
    <div className="fixed bottom-5 left-1/2 z-30 w-[min(1180px,calc(100vw-2rem))] -translate-x-1/2 rounded-[24px] border border-white/12 bg-[#05070b]/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Command Strip · {selectedUnits.length} selected SKU{selectedUnits.length === 1 ? '' : 's'}</div>
          <div className="mt-1 text-xs text-white/45">Handoff only. Export/download/commercial success is not claimed from Mission Control.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/products/workbench/batch-listing${query}`} className="rounded-full bg-cyan-200 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-white">Listing Station</Link>
          <Link to={selectedUnits[0] ? `/products/${selectedUnits[0].product.id}/ai/ai-product` : '/products/workbench/visual-tools'} className="rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/12">Visual Station</Link>
          <Link to="/products/workbench/downloads" className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/15">Delivery handoff</Link>
          <button onClick={onClear} className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/45 transition hover:text-white">Clear</button>
        </div>
      </div>
    </div>
  )
}
