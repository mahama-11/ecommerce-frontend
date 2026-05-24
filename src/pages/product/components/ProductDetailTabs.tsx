import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown,
  ArrowUp, CheckCircle,
  Download, Eye,
  FileText, Grid3X3,
  Image as ImageIcon, LoaderCircle,
  Sparkles, Star,
  TrendingUp, Trash2,
  Wand2, ChevronDown,
} from 'lucide-react'
import { downloadExportTask } from '@/services/product'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { DownloadRecord, ExportTask, ListingVersion, ProductAssetItem, ProfitSnapshot } from '@/types/product'
function SelectField({ value, onChange, options, disabled = false }: { value: string, onChange: (v: string) => void, options: {label: string, value: string}[], disabled?: boolean }) {
  return ( <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-white/10 bg-[var(--ecom-surface-raised)] px-3 py-2 pr-8 text-sm text-white/90 outline-none transition-all hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)} </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /> </div>
  ) }
export function AssetsTab({ productId,
  assets, downloads,
  selectedDownloadId, mutatingRelationId,
  bulkMutating, onSelectDownload,
  onMakePrimary, onDelete,
  onChangeRole, onChangeSortOrder,
  onMove, onBulkChangeRole,
  onBulkDelete, onCreateExportFromSelection,
  onSelectionChange, }: {
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
  onSelectionChange: (assetRelationIds: string[]) => void }) {
  const { t } = useTranslation()
  const [selectedRole, setSelectedRole] = useState<string | 'all'>('all')
  const [onlyPrimary, setOnlyPrimary] = useState(false)
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [bulkRole, setBulkRole] = useState('hero')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'generated' | 'manual'>('all')
  const [sortMode, setSortMode] = useState<'sort_order' | 'newest' | 'file_name'>('sort_order')
  const orderedAssets = useMemo(() => ( [...assets].sort((left, right) => {
      if (left.relation.sortOrder !== right.relation.sortOrder) {
        return left.relation.sortOrder - right.relation.sortOrder }
      return left.relation.createdAt.localeCompare(right.relation.createdAt) })
  ), [assets])
  const selectedDownload = useMemo( () => downloads.find(item => item.id === selectedDownloadId) ?? null,
    [downloads, selectedDownloadId], )
  const selectedDownloadRelationIds = useMemo( () => new Set(selectedDownload?.assets?.map(item => item.relationId) ?? []),
    [selectedDownload], )
  const assetOrderIndex = useMemo( () => new Map(orderedAssets.map((item, index) => [item.relation.id, index])),
    [orderedAssets], )
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
        const haystacks = [ item.asset?.fileName,
          item.asset?.assetType, item.relation.assetRole,
          item.relation.relationType, ]
        if (!haystacks.some(value => value?.toLowerCase().includes(keyword))) return false }
      return true })
    if (sortMode === 'newest') {
      return [...filtered].sort((left, right) => {
        const leftTime = left.asset?.createdAt || left.relation.createdAt
        const rightTime = right.asset?.createdAt || right.relation.createdAt
        return rightTime.localeCompare(leftTime) })
    }
    if (sortMode === 'file_name') {
      return [...filtered].sort((left, right) => {
        const leftName = (left.asset?.fileName || '').toLowerCase()
        const rightName = (right.asset?.fileName || '').toLowerCase()
        return leftName.localeCompare(rightName) })
    }
    return filtered }, [onlyPrimary, orderedAssets, search, selectedDownload, selectedDownloadRelationIds, selectedRole, sortMode, sourceFilter])
  const summary = useMemo(() => ({ total: assets.length,
    visible: filteredAssets.length, primary: assets.filter(item => item.relation.isPrimary).length,
    aiGenerated: assets.filter(item => item.asset?.metadata?.job_id || item.asset?.metadata?.source_job_id).length, }), [assets, filteredAssets.length])
  const visibleRelationIds = useMemo( () => filteredAssets.map(item => item.relation.id),
    [filteredAssets], )
  const selectedVisibleCount = useMemo( () => selectedRelationIds.filter(id => visibleRelationIds.includes(id)).length,
    [selectedRelationIds, visibleRelationIds], )
  const allVisibleSelected = visibleRelationIds.length > 0 && selectedVisibleCount === visibleRelationIds.length
  useEffect(() => { setSelectedRelationIds(current => current.filter(id => assets.some(item => item.relation.id === id)))
  }, [assets])
  useEffect(() => { onSelectionChange(selectedRelationIds)
  }, [onSelectionChange, selectedRelationIds])
  function toggleSelection(relationId: string) { setSelectedRelationIds(current => (
      current.includes(relationId) ? current.filter(id => id !== relationId)
        : [...current, relationId] ))
  }
  function toggleSelectVisible() { setSelectedRelationIds(current => {
      if (allVisibleSelected) {
        return current.filter(id => !visibleRelationIds.includes(id)) }
      return [...new Set([...current, ...visibleRelationIds])] })
  }
  function clearSelection() { setSelectedRelationIds([])
  }
  async function handleBulkRoleApply() {
    if (selectedRelationIds.length === 0) return
    await onBulkChangeRole(selectedRelationIds, bulkRole)
    clearSelection() }
  async function handleBulkDelete() {
    if (selectedRelationIds.length === 0) return
    await onBulkDelete(selectedRelationIds)
    clearSelection() }
  return ( <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryChip label={t('product.detail.assetsTab.totalAssets')} value={String(summary.total)} helper={t('product.detail.assetsTab.totalAssetsHelper')} />
        <SummaryChip label={t('product.detail.assetsTab.visibleAssets')} value={String(summary.visible)} helper={t('product.detail.assetsTab.visibleAssetsHelper')} />
        <SummaryChip label={t('product.detail.assetsTab.primaryAssets')} value={String(summary.primary)} helper={t('product.detail.assetsTab.primaryAssetsHelper')} />
        <SummaryChip label={t('product.detail.assetsTab.aiGenerated')} value={String(summary.aiGenerated)} helper={t('product.detail.assetsTab.aiGeneratedHelper')} /> </div>
      <div className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">{t('product.detail.assetsTab.exportTraceFilter')}</div>
            <p className="mt-1 text-xs text-white/40">
              {t('product.detail.assetsTab.exportTraceFilterDesc')} </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onSelectDownload('all')}
              variant={selectedDownloadId === 'all' ? 'primary' : 'quiet'}
              size="sm"
            >
              {t('product.detail.assetsTab.allAssets')} </Button>
            {downloads.map(download => ( <Button
                key={download.id}
                onClick={() => onSelectDownload(download.id)}
                variant={selectedDownloadId === download.id ? 'primary' : 'quiet'}
                size="sm"
              >
                {download.platform.toUpperCase()} {download.site} · {download.format.toUpperCase()} </Button>
            ))} </div>
        </div>
        {selectedDownload ? ( <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            {t('product.detail.assetsTab.inspectingExport', { fileName: selectedDownload.downloadFileName, count: selectedDownload.assetCount })} </div>
        ) : null} </div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {roles.map(role => ( <Button
              key={role}
              onClick={() => setSelectedRole(role)}
              variant={selectedRole === role ? 'secondary' : 'ghost'}
              size="sm"
            >
              {role === 'all' ? t('product.detail.assetsTab.allAssets') : t(`product.detail.assetRoles.${role}` as any, role) || role} </Button>
          ))} </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer select-none">
            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all ${onlyPrimary ? 'border-brand-500 bg-brand-500' : 'border-white/20 bg-white/5'}`}>
              {onlyPrimary && ( <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3 text-white">
                  <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> </svg>
              )} </div>
            {t('product.detail.assetsTab.primaryOnly')}
            <input type="checkbox" className="hidden" checked={onlyPrimary} onChange={e => setOnlyPrimary(e.target.checked)} /> </label>
          <div className="h-4 w-px bg-white/20" />
          <ButtonLink
            to={`/products/workbench/visual-tools?productId=${encodeURIComponent(productId)}&source=sku-detail-assets`}
            variant="primary"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            {t('product.detail.assetsTab.generateAssets')} </ButtonLink>
        </div> </div>
      <div className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">{t('product.detail.assetsTab.workspaceFilters')}</div>
            <p className="mt-1 text-xs text-white/40">
              {t('product.detail.assetsTab.workspaceFiltersDesc')} </p>
          </div>
          <Button
            onClick={() => { setSearch('')
              setSourceFilter('all')
              setSortMode('sort_order')
              setSelectedRole('all')
              setOnlyPrimary(false) }}
            variant="quiet"
            size="sm"
          >
            {t('product.detail.assetsTab.resetFilters')} </Button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('product.detail.assetsTab.searchPlaceholder')}
            className="w-full rounded-lg border border-white/10 bg-[var(--ecom-surface-raised)] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
          />
          <SelectField
            value={sourceFilter}
            onChange={v => setSourceFilter(v as typeof sourceFilter)}
            options={[ {label: t('product.detail.assetsTab.allSources'), value: 'all'},
              {label: t('product.detail.assetsTab.sourceGenerated'), value: 'generated'}, {label: t('product.detail.assetsTab.sourceManual'), value: 'manual'}
            ]}
          />
          <SelectField
            value={sortMode}
            onChange={v => setSortMode(v as typeof sortMode)}
            options={[ {label: t('product.detail.assetsTab.sortOrder'), value: 'sort_order'},
              {label: t('product.detail.assetsTab.sortNewest'), value: 'newest'}, {label: t('product.detail.assetsTab.sortFileName'), value: 'file_name'}
            ]}
          /> </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">{t('product.detail.assetsTab.bulkActions')}</div>
            <p className="mt-1 text-xs text-white/40">
              {t('product.detail.assetsTab.bulkActionsDesc')} </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="font-medium text-brand-400">{t('product.detail.assetsTab.selectedCount', { count: selectedRelationIds.length })}</span>
            <div className="h-4 w-px bg-white/20" />
            <Button
              onClick={toggleSelectVisible}
              disabled={visibleRelationIds.length === 0 || bulkMutating}
              variant="quiet"
              size="sm"
            >
              {allVisibleSelected ? t('product.detail.assetsTab.clearVisible') : t('product.detail.assetsTab.selectVisible')} </Button>
            <Button
              onClick={clearSelection}
              disabled={selectedRelationIds.length === 0 || bulkMutating}
              variant="quiet"
              size="sm"
            >
              {t('product.detail.assetsTab.clearSelection')} </Button>
          </div> </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <SelectField
            value={bulkRole}
            onChange={v => setBulkRole(v)}
            disabled={bulkMutating || selectedRelationIds.length === 0}
            options={[ {label: t('product.detail.assetRoles.hero'), value: 'hero'},
              {label: t('product.detail.assetRoles.model_shot'), value: 'model_shot'}, {label: t('product.detail.assetRoles.scene_shot'), value: 'scene_shot'},
              {label: t('product.detail.assetRoles.detail_shot'), value: 'detail_shot'}, {label: t('product.detail.assetRoles.listing_attachment'), value: 'listing_attachment'},
            ]}
          />
          <Button
            onClick={() => void handleBulkRoleApply()}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            variant="secondary"
          >
            {bulkMutating ? t('product.detail.assetsTab.saving') : t('product.detail.assetsTab.applyRole')} </Button>
          <Button
            onClick={() => void handleBulkDelete()}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            variant="danger"
          >
            {bulkMutating ? t('product.detail.assetsTab.saving') : t('product.detail.assetsTab.removeSelected')} </Button>
          <Button
            onClick={() => onCreateExportFromSelection(selectedRelationIds)}
            disabled={selectedRelationIds.length === 0 || bulkMutating}
            variant="secondary"
          >
            {t('product.detail.assetsTab.exportSelected')} </Button>
        </div> </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {filteredAssets.map(({ relation, asset }) => {
          const sourceJobId = asset?.metadata?.job_id || asset?.metadata?.source_job_id
          const mutating = bulkMutating || mutatingRelationId === relation.id
          const orderIndex = assetOrderIndex.get(relation.id) ?? 0
          const canMoveUp = orderIndex > 0
          const canMoveDown = orderIndex < orderedAssets.length - 1
          const selected = selectedRelationIds.includes(relation.id)
          return ( <div
              key={relation.id}
              className={`group overflow-hidden rounded-2xl border bg-[var(--ecom-surface)] shadow-lg transition-all duration-300 hover:shadow-xl ${ selected ? 'border-brand-500 bg-brand-500/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-[var(--ecom-surface-raised)] border-b border-white/10">
                {asset?.originalUrl ? ( <img
                    src={asset.originalUrl}
                    alt={relation.assetRole}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  /> ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <ImageIcon className="h-10 w-10" /> </div>
                )}
                {relation.isPrimary ? ( <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
                    <Star className="h-3 w-3" />
                    {t('product.detail.assetsTab.primary')} </div>
                ) : null}
                <div className="absolute bottom-3 left-3 rounded-full bg-black/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90 shadow-md">
                  {t(`product.detail.assetRoles.${relation.assetRole}` as any, relation.assetRole) || relation.assetRole} </div>
                <label className="absolute right-3 top-3 flex cursor-pointer items-center justify-center h-7 w-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={bulkMutating}
                    onChange={() => toggleSelection(relation.id)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-brand-500 focus:ring-brand-500/50"
                  /> </label>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-sm font-semibold text-white/90 truncate" title={asset?.fileName || t('product.detail.assetsTab.unnamedAsset')}>
                    {asset?.fileName || t('product.detail.assetsTab.unnamedAsset')} </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/40 font-mono">
                    <span>{asset?.width && asset?.height ? `${asset.width}x${asset.height}` : t('product.detail.assetsTab.sizeNa')}</span>
                    <span>{asset?.mimeType || t('product.detail.assetsTab.mimeNa')}</span> </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      {sourceJobId ? t('product.detail.assetsTab.sourceGenerated') : t('product.detail.assetsTab.sourceManual')} </span>
                    <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      {relation.relationType} </span>
                    <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      sort #{relation.sortOrder} </span>
                    {asset?.createdAt ? ( <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                        {new Date(asset.createdAt).toLocaleDateString()} </span>
                    ) : null} </div>
                </div>
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <SelectField
                    value={relation.assetRole}
                    disabled={mutating}
                    onChange={v => onChangeRole(relation.id, v)}
                    options={[ {label: t('product.detail.assetRoles.hero'), value: 'hero'},
                      {label: t('product.detail.assetRoles.model_shot'), value: 'model_shot'}, {label: t('product.detail.assetRoles.scene_shot'), value: 'scene_shot'},
                      {label: t('product.detail.assetRoles.detail_shot'), value: 'detail_shot'}, {label: t('product.detail.assetRoles.listing_attachment'), value: 'listing_attachment'},
                    ]}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={relation.sortOrder}
                        disabled={mutating}
                        onChange={event => onChangeSortOrder(relation.id, Number(event.target.value) || 0)}
                        className="w-full rounded-lg border border-white/10 bg-[var(--ecom-surface-raised)] px-3 py-2 text-sm text-white/90 outline-none transition-all focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50"
                      /> </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        onClick={() => onMove(relation.id, 'up')}
                        disabled={mutating || !canMoveUp}
                        size="icon-sm"
                        variant="quiet"
                      >
                        <ArrowUp className="h-4 w-4" /> </Button>
                      <Button
                        onClick={() => onMove(relation.id, 'down')}
                        disabled={mutating || !canMoveDown}
                        size="icon-sm"
                        variant="quiet"
                      >
                        <ArrowDown className="h-4 w-4" /> </Button>
                    </div> </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onMakePrimary(relation.id)}
                      disabled={mutating || relation.isPrimary}
                      className="flex-1"
                      variant="secondary"
                      size="sm"
                    >
                      {mutating ? t('product.detail.assetsTab.saving') : relation.isPrimary ? t('product.detail.assetsTab.primary') : t('product.detail.assetsTab.setAsPrimary')} </Button>
                    <Button
                      onClick={() => onDelete(relation.id)}
                      disabled={mutating}
                      size="icon-sm"
                      variant="danger"
                    >
                      {mutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} </Button>
                  </div> </div>
              </div> </div>
          ) })}
        {filteredAssets.length === 0 ? ( <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-white/40">
            <Grid3X3 className="mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-white/60">{t('product.detail.assetsTab.noAssets')}</p>
            <p className="mt-1 text-sm">{t('product.detail.assetsTab.noAssetsDesc')}</p> </div>
        ) : null} </div>
    </div> )
}
export function ListingsTab({ versions,
  onGenerate, onAdopt,
  onEdit, adoptingVersionId,
}: { versions: ListingVersion[]
  onGenerate: () => void
  onAdopt: (versionId: string) => void
  onEdit: (version: ListingVersion) => void
  adoptingVersionId: string | null }) {
  const { t } = useTranslation()
  return ( <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/60">
          {t('product.detail.listingsTabExt.count', { count: versions.length })} </p>
        <Button onClick={onGenerate} variant="primary">
          <Wand2 className="h-4 w-4" />
          {t('product.detail.listingsTabExt.generate')} </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {versions.map(version => ( <div key={version.id} className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] overflow-hidden flex flex-col shadow-lg transition-all hover:border-white/20">
            <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-white/90 truncate">{version.versionLabel}</span>
                  <span className="text-[11px] font-mono text-white/40">v{version.versionNo}</span>
                  {version.status === 'adopted' ? ( <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="h-3 w-3" />
                      {t('product.detail.listingsTabExt.adopted')} </span>
                  ) : null} </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  <span>{version.platform}</span>
                  <span>|</span>
                  <span>{version.site}</span>
                  <span>|</span>
                  <span>{version.locale}</span> </div>
              </div>
              <Button
                onClick={() => onEdit(version)}
                className="shrink-0"
                variant="quiet"
                size="sm"
              >
                {t('product.detail.listingsTabExt.edit')} </Button>
            </div>
            <div className="p-5 flex-1 bg-[var(--ecom-bg)] space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">{t("product.detail.listingsTabExt.titleLabel")}</div>
                <p className="text-sm text-white/80 leading-snug">{version.title}</p> </div>
              {version.description && ( <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">{t("product.detail.listingsTabExt.descriptionLabel")}</div>
                  <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">{version.description}</p> </div>
              )} </div>
            {version.status !== 'adopted' && ( <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <Button
                  onClick={() => onAdopt(version.id)}
                  disabled={adoptingVersionId === version.id}
                  className="w-full"
                  variant="secondary"
                >
                  {adoptingVersionId === version.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {adoptingVersionId === version.id ? t('product.detail.listingsTabExt.adopting') : t('product.detail.listingsTabExt.adopt')} </Button>
              </div> )}
          </div> ))}
        {versions.length === 0 ? ( <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-white/40">
            <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-white/60">{t('product.detail.listingsTabExt.empty')}</p>
            <p className="mt-1 text-sm">{t('product.detail.listingsTabExt.emptyDesc')}</p> </div>
        ) : null} </div>
    </div> )
}
export function ProfitTab({ snapshots, onCalculate }: { snapshots: ProfitSnapshot[]; onCalculate: () => void }) {
  const { t } = useTranslation()
  return ( <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/60">
          {t('product.detail.profitTab.count', { count: snapshots.length })} </p>
        <Button onClick={onCalculate} variant="primary">
          <TrendingUp className="h-4 w-4" />
          {t('product.detail.profitTab.calculate')} </Button>
      </div>
      <div className="space-y-4">
        {snapshots.map(snapshot => ( <div key={snapshot.id} className="grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-6 shadow-lg transition-all hover:border-white/20 md:grid-cols-4">
            <ProfitMetric label={t('product.detail.profitTab.grossProfit')} value={`$${snapshot.grossProfit.toFixed(2)}`} helper={`${(snapshot.grossMargin * 100).toFixed(1)}% margin`} />
            <ProfitMetric label={t('product.detail.profitTab.netProfit')} value={`$${snapshot.netProfit.toFixed(2)}`} helper={`${(snapshot.netMargin * 100).toFixed(1)}% margin`} />
            <ProfitMetric label={t('product.detail.profitTab.breakeven')} value={`$${snapshot.breakevenPrice.toFixed(2)}`} helper={t('product.detail.profitTab.minPrice')} />
            <ProfitMetric label={t('product.detail.profitTab.listingPrice')} value={`$${snapshot.listingPrice.toFixed(2)}`} helper={`${t('product.detail.profitTab.cost')} $${snapshot.costPrice.toFixed(2)}`} /> </div>
        ))}
        {snapshots.length === 0 ? ( <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-white/40">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-white/60">{t('product.detail.profitTab.empty')}</p>
            <p className="mt-1 text-sm">{t('product.detail.profitTab.emptyDesc')}</p> </div>
        ) : null} </div>
    </div> )
}
export function ExportsTab({ tasks,
  downloads, productTitle,
  assetCount, selectedAssetCount,
  onCreate, onCreateFromSelection,
  onInspectAssets, }: {
  tasks: ExportTask[]
  downloads: DownloadRecord[]
  productTitle: string
  assetCount: number
  selectedAssetCount: number
  onCreate: () => void
  onCreateFromSelection: () => void
  onInspectAssets: (downloadId: string) => void }) {
  const { t } = useTranslation()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const downloadMap = useMemo( () => new Map(downloads.map(item => [item.id, item])),
    [downloads], )
  async function handleDownload(task: ExportTask) { setDownloadingId(task.id)
    try {
      await downloadExportTask(task, `${productTitle || 'export'}.${task.format}`) } finally {
      setDownloadingId(null) }
  }
  return ( <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm font-medium text-white/60">
          {t('product.detail.exportsTabExt.count', { count: tasks.length })} · {t('product.detail.exportsTabExt.assetCount', { count: assetCount })} </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink to="/products/workbench/downloads" variant="secondary">
            {t('product.detail.exportsTabExt.downloadCenter')} </ButtonLink>
          <Button
            onClick={onCreateFromSelection}
            disabled={selectedAssetCount === 0}
            variant="secondary"
          >
            <Eye className="h-4 w-4" />
            {t('product.detail.exportsTabExt.exportSelected', { count: selectedAssetCount })} </Button>
          <Button onClick={onCreate} variant="primary">
            <Download className="h-4 w-4" />
            {t('product.detail.exportsTabExt.exportAll')} </Button>
        </div> </div>
      <div className="space-y-4">
        {tasks.map(task => {
          const downloadTrace = downloadMap.get(task.id)
          const snapshotAssetCount = downloadTrace?.assetCount ?? task.assetCount ?? assetCount
          const snapshotListingLabel = downloadTrace?.listingVersionLabel ?? task.listingVersionLabel
          const snapshotPrimaryAssetRole = downloadTrace?.primaryAssetRole ?? task.primaryAssetRole
          return ( <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg transition-all hover:border-white/20">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white/90">{t("product.detail.exportsTabExt.exportTitle", { platform: task.platform.toUpperCase() })}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/60">{task.format.toUpperCase()}</span> </div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/40">
                  <span>{task.site}</span>
                  <span>|</span>
                  <span>{task.locale}</span>
                  {task.fileSize ? <><span>|</span><span>{task.fileSize}</span></> : null}
                  <span>|</span>
                  <span className="text-white/60">{t("product.detail.exportsTabExt.assetsCount", { count: snapshotAssetCount })}</span> </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {downloadTrace ? ( <span className="rounded-md border border-brand-500/20 bg-brand-500/10 px-2 py-1 text-[11px] text-brand-300">
                      {t('product.detail.exportsTabExt.traceReady')} </span>
                  ) : null}
                  {snapshotPrimaryAssetRole ? ( <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                      {t('product.detail.exportsTabExt.primary', { role: snapshotPrimaryAssetRole })} </span>
                  ) : null}
                  {snapshotListingLabel ? ( <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
                      {snapshotListingLabel} </span>
                  ) : null} </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 md:shrink-0 border-t border-white/5 pt-4 md:border-none md:pt-0">
                {downloadTrace ? ( <Button
                    onClick={() => onInspectAssets(downloadTrace.id)}
                    className="flex-1 md:flex-none"
                    variant="secondary"
                  >
                    <Eye className="h-4 w-4" />
                    {t('product.detail.exportsTabExt.inspectAssets')} </Button>
                ) : null}
                {task.status === 'succeeded' ? ( <Button
                    onClick={() => void handleDownload(task)}
                    disabled={downloadingId === task.id}
                    className="flex-1 md:flex-none"
                    variant="primary"
                  >
                    {downloadingId === task.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloadingId === task.id ? t('product.detail.exportsTabExt.downloading') : t('product.detail.exportsTabExt.download')} </Button>
                ) : ( <span className="flex-1 md:flex-none text-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50">
                    {task.status === 'generating' ? t('product.detail.exportsTabExt.generating') : t('product.detail.exportsTabExt.pending')} </span>
                )} </div>
            </div> )
        })}
        {tasks.length === 0 ? ( <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-white/40">
            <Download className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-white/60">{t('product.detail.exportsTabExt.empty')}</p>
            <p className="mt-1 text-sm">{t('product.detail.exportsTabExt.emptyDesc')}</p> </div>
        ) : null} </div>
    </div> )
}
export function HistoryTab({ activities,
}: { activities: Array<{ id: string; title: string; summary: string; createdAt: string }>
}) {
  const { t } = useTranslation()
  return ( <div className="space-y-5">
      <p className="text-sm font-medium text-white/60">
        {t('product.detail.historyTab.count', { count: activities.length })} </p>
      <div className="space-y-4">
        {activities.map(activity => ( <div key={activity.id} className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg transition-all hover:border-white/20">
            <p className="font-semibold text-white/90">{activity.title}</p>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{activity.summary}</p>
            <p className="mt-3 text-[11px] font-mono text-white/30">{new Date(activity.createdAt).toLocaleString()}</p> </div>
        ))}
        {activities.length === 0 ? ( <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-white/40">
            <Wand2 className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="font-medium text-white/60">{t('product.detail.historyTab.empty')}</p>
            <p className="mt-1 text-sm">{t('product.detail.historyTab.emptyDesc')}</p> </div>
        ) : null} </div>
    </div> )
}
function SummaryChip({ label, value, helper }: { label: string; value: string; helper: string }) {
  return ( <div className="rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-lg">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white/90">{value}</div>
      <div className="mt-1 text-[11px] text-white/40">{helper}</div> </div>
  ) }
function ProfitMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return ( <div>
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-white/90">{value}</p>
      <p className="mt-1 text-xs text-white/40">{helper}</p> </div>
  ) }
