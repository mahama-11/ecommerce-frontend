import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Grid3X3,
  Image,
  LoaderCircle,
  Sparkles,
  Star,
  TrendingUp,
  Trash2,
  Wand2,
} from 'lucide-react'
import { downloadExportTask } from '@/services/product'
import type { DownloadRecord, ExportTask, ListingVersion, ProductAssetItem, ProfitSnapshot } from '@/types/product'

const ASSET_ROLE_LABELS: Record<string, string> = {
  hero: 'Hero Image',
  model_shot: 'Model Shot',
  scene_shot: 'Scene Shot',
  detail_shot: 'Detail Shot',
  listing_attachment: 'Listing Attachment',
}

export function AssetsTab({
  productId,
  assets,
  downloads,
  selectedDownloadId,
  mutatingRelationId,
  bulkMutating,
  onSelectDownload,
  onMakePrimary,
  onDelete,
  onChangeRole,
  onChangeSortOrder,
  onMove,
  onBulkChangeRole,
  onBulkDelete,
  onCreateExportFromSelection,
  onSelectionChange,
}: {
  productId: string
  assets: ProductAssetItem[]
  downloads: DownloadRecord[]
  selectedDownloadId: string
  mutatingRelationId: string | null
  bulkMutating: boolean
  onSelectDownload: (downloadId: string) => void
  onMakePrimary: (assetRelationId: string) => void
  onDelete: (assetRelationId: string) => void
  onChangeRole: (assetRelationId: string, assetRole: string) => void
  onChangeSortOrder: (assetRelationId: string, sortOrder: number) => void
  onMove: (assetRelationId: string, direction: 'up' | 'down') => void
  onBulkChangeRole: (assetRelationIds: string[], assetRole: string) => void
  onBulkDelete: (assetRelationIds: string[]) => void
  onCreateExportFromSelection: (assetRelationIds: string[]) => void
  onSelectionChange: (assetRelationIds: string[]) => void
}) {
  const [selectedRole, setSelectedRole] = useState<string | 'all'>('all')
  const [onlyPrimary, setOnlyPrimary] = useState(false)
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [bulkRole, setBulkRole] = useState('hero')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'generated' | 'manual'>('all')
  const [sortMode, setSortMode] = useState<'sort_order' | 'newest' | 'file_name'>('sort_order')

  const orderedAssets = useMemo(() => (
    [...assets].sort((left, right) => {
      if (left.relation.sortOrder !== right.relation.sortOrder) {
        return left.relation.sortOrder - right.relation.sortOrder
      }
      return left.relation.createdAt.localeCompare(right.relation.createdAt)
    })
  ), [assets])
  const selectedDownload = useMemo(
    () => downloads.find(item => item.id === selectedDownloadId) ?? null,
    [downloads, selectedDownloadId],
  )
  const selectedDownloadRelationIds = useMemo(
    () => new Set(selectedDownload?.assets?.map(item => item.relationId) ?? []),
    [selectedDownload],
  )
  const assetOrderIndex = useMemo(
    () => new Map(orderedAssets.map((item, index) => [item.relation.id, index])),
    [orderedAssets],
  )
  const roles = useMemo(() => ['all', ...new Set(assets.map(item => item.relation.assetRole))], [assets])
  const filteredAssets = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const filtered = orderedAssets.filter(item => {
      if (selectedRole !== 'all' && item.relation.assetRole !== selectedRole) return false
      if (onlyPrimary && !item.relation.isPrimary) return false
      if (selectedDownload && !selectedDownloadRelationIds.has(item.relation.id)) return false
      const isGenerated = Boolean(item.asset?.metadata?.job_id || item.asset?.metadata?.source_job_id)
      if (sourceFilter === 'generated' && !isGenerated) return false
      if (sourceFilter === 'manual' && isGenerated) return false
      if (keyword) {
        const haystacks = [
          item.asset?.fileName,
          item.asset?.assetType,
          item.relation.assetRole,
          item.relation.relationType,
        ]
        if (!haystacks.some(value => value?.toLowerCase().includes(keyword))) return false
      }
      return true
    })
    if (sortMode === 'newest') {
      return [...filtered].sort((left, right) => {
        const leftTime = left.asset?.createdAt || left.relation.createdAt
        const rightTime = right.asset?.createdAt || right.relation.createdAt
        return rightTime.localeCompare(leftTime)
      })
    }
    if (sortMode === 'file_name') {
      return [...filtered].sort((left, right) => {
        const leftName = (left.asset?.fileName || '').toLowerCase()
        const rightName = (right.asset?.fileName || '').toLowerCase()
        return leftName.localeCompare(rightName)
      })
    }
    return filtered
  }, [onlyPrimary, orderedAssets, search, selectedDownload, selectedDownloadRelationIds, selectedRole, sortMode, sourceFilter])

  const summary = useMemo(() => ({
    total: assets.length,
    visible: filteredAssets.length,
    primary: assets.filter(item => item.relation.isPrimary).length,
    aiGenerated: assets.filter(item => item.asset?.metadata?.job_id || item.asset?.metadata?.source_job_id).length,
  }), [assets, filteredAssets.length])
  const visibleRelationIds = useMemo(
    () => filteredAssets.map(item => item.relation.id),
    [filteredAssets],
  )
  const selectedVisibleCount = useMemo(
    () => selectedRelationIds.filter(id => visibleRelationIds.includes(id)).length,
    [selectedRelationIds, visibleRelationIds],
  )
  const allVisibleSelected = visibleRelationIds.length > 0 && selectedVisibleCount === visibleRelationIds.length

  useEffect(() => {
    setSelectedRelationIds(current => current.filter(id => assets.some(item => item.relation.id === id)))
  }, [assets])

  useEffect(() => {
    onSelectionChange(selectedRelationIds)
  }, [onSelectionChange, selectedRelationIds])

  function toggleSelection(relationId: string) {
    setSelectedRelationIds(current => (
      current.includes(relationId)
        ? current.filter(id => id !== relationId)
        : [...current, relationId]
    ))
  }

  function toggleSelectVisible() {
    setSelectedRelationIds(current => {
      if (allVisibleSelected) {
        return current.filter(id => !visibleRelationIds.includes(id))
      }
      return [...new Set([...current, ...visibleRelationIds])]
    })
  }

  function clearSelection() {
    setSelectedRelationIds([])
  }

  async function handleBulkRoleApply() {
    if (selectedRelationIds.length === 0) return
    await onBulkChangeRole(selectedRelationIds, bulkRole)
    clearSelection()
  }

  async function handleBulkDelete() {
    if (selectedRelationIds.length === 0) return
    await onBulkDelete(selectedRelationIds)
    clearSelection()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryChip label="Total Assets" value={String(summary.total)} helper="linked to this product" />
        <SummaryChip label="Visible Assets" value={String(summary.visible)} helper="matching current workspace filters" />
        <SummaryChip label="Primary Assets" value={String(summary.primary)} helper="marked as hero or primary" />
        <SummaryChip label="AI Generated" value={String(summary.aiGenerated)} helper="returned from runtime jobs" />
      </div>

      <div className="glass-strong rounded-2xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-white">Export Trace Filter</div>
            <p className="mt-1 text-xs text-white/45">
              Focus the asset grid on a specific delivered export package.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSelectDownload('all')}
              className={`rounded-xl px-3 py-1.5 text-sm transition ${
                selectedDownloadId === 'all'
                  ? 'bg-brand-500/15 text-brand-200'
                  : 'bg-white/[0.03] text-white/60 hover:text-white'
              }`}
            >
              All assets
            </button>
            {downloads.map(download => (
              <button
                key={download.id}
                onClick={() => onSelectDownload(download.id)}
                className={`rounded-xl px-3 py-1.5 text-sm transition ${
                  selectedDownloadId === download.id
                    ? 'bg-brand-500/15 text-brand-200'
                    : 'bg-white/[0.03] text-white/60 hover:text-white'
                }`}
              >
                {download.platform.toUpperCase()} {download.site} · {download.format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {selectedDownload ? (
          <div className="mt-3 rounded-xl border border-brand-500/15 bg-brand-500/5 px-3 py-2 text-xs text-brand-100">
            Inspecting export `{selectedDownload.downloadFileName}` with {selectedDownload.assetCount} linked asset{selectedDownload.assetCount !== 1 ? 's' : ''}.
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                selectedRole === role ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              {role === 'all' ? 'All Assets' : ASSET_ROLE_LABELS[role] || role}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyPrimary(value => !value)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${
              onlyPrimary
                ? 'border-brand-500/25 bg-brand-500/10 text-brand-300'
                : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white'
            }`}
          >
            Primary Only
          </button>
          <Link
            to={`/products/${productId}/ai/ai-product`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/20"
          >
            <Sparkles className="h-4 w-4" />
            Generate Assets
          </Link>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-medium text-white">Asset Workspace Filters</div>
            <p className="mt-1 text-xs text-white/45">
              Search and shape the current asset working set before applying batch actions.
            </p>
          </div>
          <button
            onClick={() => {
              setSearch('')
              setSourceFilter('all')
              setSortMode('sort_order')
              setSelectedRole('all')
              setOnlyPrimary(false)
            }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
          >
            Reset Workspace Filters
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search file name, role, relation type..."
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05] placeholder:text-white/25"
          />
          <select
            value={sourceFilter}
            onChange={event => setSourceFilter(event.target.value as typeof sourceFilter)}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
          >
            <option value="all">All Sources</option>
            <option value="generated">AI Generated</option>
            <option value="manual">Manual Linked</option>
          </select>
          <select
            value={sortMode}
            onChange={event => setSortMode(event.target.value as typeof sortMode)}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
          >
            <option value="sort_order">Sort by Workspace Order</option>
            <option value="newest">Sort by Newest</option>
            <option value="file_name">Sort by File Name</option>
          </select>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-medium text-white">Bulk Asset Actions</div>
            <p className="mt-1 text-xs text-white/45">
              Select multiple assets to update role or remove them from the product workspace together.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
            <span>{selectedRelationIds.length} selected</span>
            <button
              onClick={toggleSelectVisible}
              disabled={visibleRelationIds.length === 0 || bulkMutating}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allVisibleSelected ? 'Clear Visible' : 'Select Visible'}
            </button>
            <button
              onClick={clearSelection}
              disabled={selectedRelationIds.length === 0 || bulkMutating}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Selection
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <select
            value={bulkRole}
            disabled={bulkMutating}
            onChange={event => setBulkRole(event.target.value)}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="hero">Hero Image</option>
            <option value="model_shot">Model Shot</option>
            <option value="scene_shot">Scene Shot</option>
            <option value="detail_shot">Detail Shot</option>
            <option value="listing_attachment">Listing Attachment</option>
          </select>
          <button
            onClick={() => void handleBulkRoleApply()}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkMutating ? 'Saving...' : 'Apply Role'}
          </button>
          <button
            onClick={() => void handleBulkDelete()}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkMutating ? 'Saving...' : 'Remove Selected'}
          </button>
          <button
            onClick={() => onCreateExportFromSelection(selectedRelationIds)}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Selected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {filteredAssets.map(({ relation, asset }) => {
          const sourceJobId = asset?.metadata?.job_id || asset?.metadata?.source_job_id
          const mutating = bulkMutating || mutatingRelationId === relation.id
          const orderIndex = assetOrderIndex.get(relation.id) ?? 0
          const canMoveUp = orderIndex > 0
          const canMoveDown = orderIndex < orderedAssets.length - 1
          const selected = selectedRelationIds.includes(relation.id)
          return (
            <div
              key={relation.id}
              className={`group overflow-hidden glass-strong rounded-2xl transition-all duration-300 hover:border-white/20 hover:shadow-lg ${
                selected ? 'border-brand-500/40 shadow-[0_0_0_1px_rgba(168,85,247,0.15)]' : 'border-white/10'
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-[#0f0f18]">
                {asset?.originalUrl ? (
                  <img
                    src={asset.originalUrl}
                    alt={relation.assetRole}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Image className="h-10 w-10" />
                  </div>
                )}

                {relation.isPrimary ? (
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                    <Star className="h-3 w-3" />
                    Primary
                  </div>
                ) : null}

                <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white/80">
                  {ASSET_ROLE_LABELS[relation.assetRole] || relation.assetRole}
                </div>
                <label className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={bulkMutating}
                    onChange={() => toggleSelection(relation.id)}
                    className="h-3.5 w-3.5 rounded border-white/10 bg-transparent"
                  />
                  Select
                </label>
              </div>

              <div className="space-y-2 p-3">
                <div className="text-sm font-medium text-white">{asset?.fileName || 'Unnamed asset'}</div>
                <div className="flex flex-wrap gap-2 text-xs text-white/45">
                  <span>{asset?.width && asset?.height ? `${asset.width}x${asset.height}` : 'size n/a'}</span>
                  <span>{asset?.mimeType || 'mime n/a'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                    {sourceJobId ? 'AI runtime' : 'manual linked'}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                    {relation.relationType}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                    sort #{relation.sortOrder}
                  </span>
                  {asset?.createdAt ? (
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 pt-1">
                  <select
                    value={relation.assetRole}
                    disabled={mutating}
                    onChange={event => onChangeRole(relation.id, event.target.value)}
                    className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="hero">Hero Image</option>
                    <option value="model_shot">Model Shot</option>
                    <option value="scene_shot">Scene Shot</option>
                    <option value="detail_shot">Detail Shot</option>
                    <option value="listing_attachment">Listing Attachment</option>
                  </select>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="number"
                      value={relation.sortOrder}
                      disabled={mutating}
                      onChange={event => onChangeSortOrder(relation.id, Number(event.target.value) || 0)}
                      className="w-full glass rounded-lg px-3 py-2 text-sm text-white/80 outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onMove(relation.id, 'up')}
                        disabled={mutating || !canMoveUp}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onMove(relation.id, 'down')}
                        disabled={mutating || !canMoveDown}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onMakePrimary(relation.id)}
                      disabled={mutating || relation.isPrimary}
                      className="flex-1 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mutating ? 'Saving...' : relation.isPrimary ? 'Primary Asset' : 'Set as Primary'}
                    </button>
                    <button
                      onClick={() => onDelete(relation.id)}
                      disabled={mutating}
                      className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredAssets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center glass-strong rounded-2xl border-dashed border-white/10 py-16 text-white/40">
            <Grid3X3 className="mb-4 h-12 w-12 opacity-40" />
            <p>No assets match the current filters</p>
            <p className="mt-1 text-sm">Generate or upload product assets to populate this workspace.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ListingsTab({
  versions,
  onGenerate,
  onAdopt,
  onEdit,
  adoptingVersionId,
}: {
  versions: ListingVersion[]
  onGenerate: () => void
  onAdopt: (versionId: string) => void
  onEdit: (version: ListingVersion) => void
  adoptingVersionId: string | null
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {versions.length} listing version{versions.length !== 1 ? 's' : ''}
        </p>
        <button onClick={onGenerate} className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/20">
          <Wand2 className="h-4 w-4" />
          Generate Listing
        </button>
      </div>
      <div className="space-y-3">
        {versions.map(version => (
          <div key={version.id} className="glass-strong rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{version.versionLabel}</span>
                  <span className="text-sm text-white/40">v{version.versionNo}</span>
                  {version.status === 'adopted' ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Adopted
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-white/80">{version.title}</p>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{version.platform.toUpperCase()}</span>
                  <span>•</span>
                  <span>{version.site}</span>
                  <span>•</span>
                  <span>{version.locale}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {version.status !== 'adopted' ? (
                  <button
                    onClick={() => onAdopt(version.id)}
                    disabled={adoptingVersionId === version.id}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    {adoptingVersionId === version.id ? 'Adopting...' : 'Adopt'}
                  </button>
                ) : null}
                <button
                  onClick={() => onEdit(version)}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 transition hover:bg-white/10"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
        {versions.length === 0 ? (
          <div className="glass-strong rounded-xl p-8 text-center text-white/40">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No listing versions yet</p>
            <p className="mt-1 text-sm">Generate a listing to get started.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ProfitTab({ snapshots, onCalculate }: { snapshots: ProfitSnapshot[]; onCalculate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {snapshots.length} profit snapshot{snapshots.length !== 1 ? 's' : ''}
        </p>
        <button onClick={onCalculate} className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/20">
          <TrendingUp className="h-4 w-4" />
          Calculate Profit
        </button>
      </div>
      <div className="space-y-3">
        {snapshots.map(snapshot => (
          <div key={snapshot.id} className="grid grid-cols-2 gap-4 glass-strong rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg md:grid-cols-4">
            <ProfitMetric label="Gross Profit" value={`$${snapshot.grossProfit.toFixed(2)}`} helper={`${(snapshot.grossMargin * 100).toFixed(1)}% margin`} />
            <ProfitMetric label="Net Profit" value={`$${snapshot.netProfit.toFixed(2)}`} helper={`${(snapshot.netMargin * 100).toFixed(1)}% margin`} />
            <ProfitMetric label="Breakeven" value={`$${snapshot.breakevenPrice.toFixed(2)}`} helper="Min price to profit" />
            <ProfitMetric label="Listing Price" value={`$${snapshot.listingPrice.toFixed(2)}`} helper={`Cost $${snapshot.costPrice.toFixed(2)}`} />
          </div>
        ))}
        {snapshots.length === 0 ? (
          <div className="glass-strong rounded-xl p-8 text-center text-white/40">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No profit snapshots yet</p>
            <p className="mt-1 text-sm">Calculate profit to get started.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ExportsTab({
  tasks,
  downloads,
  productTitle,
  assetCount,
  selectedAssetCount,
  onCreate,
  onCreateFromSelection,
  onInspectAssets,
}: {
  tasks: ExportTask[]
  downloads: DownloadRecord[]
  productTitle: string
  assetCount: number
  selectedAssetCount: number
  onCreate: () => void
  onCreateFromSelection: () => void
  onInspectAssets: (downloadId: string) => void
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const downloadMap = useMemo(
    () => new Map(downloads.map(item => [item.id, item])),
    [downloads],
  )

  async function handleDownload(task: ExportTask) {
    setDownloadingId(task.id)
    try {
      await downloadExportTask(task, `${productTitle || 'export'}.${task.format}`)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {tasks.length} export task{tasks.length !== 1 ? 's' : ''} · {assetCount} linked asset{assetCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Link to="/products/workbench/downloads" className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 transition hover:bg-white/10">
            Download Center
          </Link>
          <button
            onClick={onCreateFromSelection}
            disabled={selectedAssetCount === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye className="h-4 w-4" />
            Export Selected ({selectedAssetCount})
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-300 transition hover:bg-brand-500/20">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map(task => {
          const downloadTrace = downloadMap.get(task.id)
          const snapshotAssetCount = downloadTrace?.assetCount ?? task.assetCount ?? assetCount
          const snapshotListingLabel = downloadTrace?.listingVersionLabel ?? task.listingVersionLabel
          const snapshotPrimaryAssetRole = downloadTrace?.primaryAssetRole ?? task.primaryAssetRole
          return (
            <div key={task.id} className="flex items-center justify-between gap-4 glass-strong rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{task.platform.toUpperCase()} Export</span>
                  <span className="text-sm text-white/40">{task.format.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{task.site}</span>
                  <span>•</span>
                  <span>{task.locale}</span>
                  {task.fileSize ? <span>• {task.fileSize}</span> : null}
                  <span>•</span>
                  <span>{snapshotAssetCount} assets</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {downloadTrace ? (
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                      trace ready
                    </span>
                  ) : null}
                  {snapshotPrimaryAssetRole ? (
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                      primary {snapshotPrimaryAssetRole}
                    </span>
                  ) : null}
                  {snapshotListingLabel ? (
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs text-white/45">
                      {snapshotListingLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {downloadTrace ? (
                  <button
                    onClick={() => onInspectAssets(downloadTrace.id)}
                    className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <Eye className="h-4 w-4" />
                    Inspect Assets
                  </button>
                ) : null}
                {task.status === 'succeeded' ? (
                  <button
                    onClick={() => void handleDownload(task)}
                    disabled={downloadingId === task.id}
                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-brand-500/50"
                  >
                    {downloadingId === task.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download
                  </button>
                ) : (
                  <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/60">
                    {task.status === 'generating' ? 'Generating...' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {tasks.length === 0 ? (
          <div className="glass-strong rounded-xl p-8 text-center text-white/40">
            <Download className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No export tasks yet</p>
            <p className="mt-1 text-sm">Create an export to get started.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function HistoryTab({
  activities,
}: {
  activities: Array<{ id: string; title: string; summary: string; createdAt: string }>
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        {activities.length} recent action{activities.length !== 1 ? 's' : ''}
      </p>
      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="glass-strong rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
            <p className="font-medium text-white">{activity.title}</p>
            <p className="mt-1 text-sm text-white/60">{activity.summary}</p>
            <p className="mt-2 text-xs text-white/40">{new Date(activity.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {activities.length === 0 ? (
          <div className="glass-strong rounded-xl p-8 text-center text-white/40">
            <Wand2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No activity yet</p>
            <p className="mt-1 text-sm">Activity will show up here as you work.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SummaryChip({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="glass-strong rounded-2xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-white/30">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/40">{helper}</div>
    </div>
  )
}

function ProfitMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-white/40">{helper}</p>
    </div>
  )
}
