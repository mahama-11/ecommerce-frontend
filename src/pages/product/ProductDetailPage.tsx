import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  Download,
  FileCode2,
  LoaderCircle,
  Trash2,
  Plus,
  ChevronDown
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import {
  getProduct,
  updateProduct,
  calculateProfit,
  createExportTask,
  createListingVersion,
  updateListingVersion,
  adoptListingVersion,
  deleteProduct,
  deleteProductAsset,
  updateProductAssetRelation,
  listDownloads,
  getProductParsedInfo,
  listProductPrompts,
  generateProductPrompt
} from '@/services/product'
import type {
  Product,
  ListingVersion,
  ProfitSnapshot,
  ExportTask,
  ProductActivity,
  ProductAssetItem,
  DownloadRecord,
  ProductParsedInfo,
  ProductPrompt,
  ProductStatus
} from '@/types/product'
import { AssetsTab, ExportsTab, HistoryTab, ListingsTab, ProfitTab } from './components/ProductDetailTabs'
import { ProductAIPipelinePanel } from './components/ProductAIPipelinePanel'

const TABS = [
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'listings', label: 'Listings', icon: FileText },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'profit', label: 'Profit', icon: TrendingUp },
  { id: 'history', label: 'History', icon: FileCode2 },
] as const

type ProductTabId = typeof TABS[number]['id']

const PRODUCT_STATUS_LABEL_KEYS: Record<ProductStatus, string> = {
  draft: 'status.draft',
  assets_ready: 'status.assets_ready',
  listing_ready: 'status.listing_ready',
  export_ready: 'status.export_ready',
  published: 'status.published',
  archived: 'status.archived',
}

const TAB_LABEL_KEYS: Record<ProductTabId, string> = {
  assets: 'product.detail.tabs.assets',
  listings: 'product.detail.tabs.listings',
  exports: 'product.detail.tabs.exports',
  profit: 'product.detail.tabs.profit',
  history: 'product.detail.tabs.history',
}

type ProductDetailResponse = {
  product: Product
  assets: ProductAssetItem[]
  listingVersions: ListingVersion[]
  profitSnapshots: ProfitSnapshot[]
  exportTasks: ExportTask[]
  activities: ProductActivity[]
}

type ProductFormState = {
  skuCode: string
  title: string
  categoryId: string
  brandId: string
  costCurrency: string
  tags: string[]
}

/* --- UI Components --- */
function SelectField({ label, value, onChange, options, inline = false }: { label?: string, value: string, onChange: (v: string) => void, options: {label: string, value: string}[], inline?: boolean }) {
  return (
    <div className={inline ? "flex items-center gap-2" : "space-y-1.5"}>
      {label && <label className="text-xs font-medium text-white/60 shrink-0">{label}</label>}
      <div className="relative flex-1">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 pr-8 text-sm text-white/90 outline-none transition-all hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, onBlur }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, onBlur?: () => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/60">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, rows, hint }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number, hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/60">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="w-full rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 resize-y custom-scrollbar"
      />
      {hint && <div className="text-[11px] text-white/40">{hint}</div>}
    </div>
  )
}

function TabButton({ active, onClick, icon, label, hasDot, testId }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, hasDot?: boolean, testId?: string }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`relative flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {icon}
      {label}
      {hasDot && <span className="absolute top-0 -right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />}
      {active && (
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-500),0.6)]" />
      )}
    </button>
  )
}

export function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToastStore()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [parsedInfo, setParsedInfo] = useState<ProductParsedInfo | null>(null)
  const [prompts, setPrompts] = useState<ProductPrompt[]>([])
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adoptingVersionId, setAdoptingVersionId] = useState<string | null>(null)
  const [data, setData] = useState<ProductDetailResponse | null>(null)
  const [productDownloads, setProductDownloads] = useState<DownloadRecord[]>([])
  const [selectedDownloadId, setSelectedDownloadId] = useState<string>('all')
  const [productForm, setProductForm] = useState<ProductFormState>({
    skuCode: '',
    title: '',
    categoryId: '',
    brandId: '',
    costCurrency: 'USD',
    tags: [],
  })
  const [detailTagInput, setDetailTagInput] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [productSaveLabel, setProductSaveLabel] = useState('')
  const [assetMutatingRelationId, setAssetMutatingRelationId] = useState<string | null>(null)
  const [assetBulkMutating, setAssetBulkMutating] = useState(false)
  const [selectedAssetRelationIds, setSelectedAssetRelationIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('assets')
  const [showProfitModal, setShowProfitModal] = useState(false)
  const [profitForm, setProfitForm] = useState({
    platform: 'amazon',
    site: 'US',
    costPrice: 0,
    listingPrice: 0,
    logisticsCost: 0,
    platformFee: 0,
    otherFee: 0,
  })
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportForm, setExportForm] = useState({
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
    format: 'csv',
  })
  const [exportScopedRelationIds, setExportScopedRelationIds] = useState<string[]>([])
  const [showListingModal, setShowListingModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState<ListingVersion | null>(null)
  const [savingListing, setSavingListing] = useState(false)
  const [listingForm, setListingForm] = useState<{
    versionLabel: string
    title: string
    description: string
    bulletPoints: string[]
    keywords: string[]
    newKeyword: string
    platform: string
    site: string
    locale: string
  }>({
    versionLabel: '',
    title: '',
    description: '',
    bulletPoints: ['', '', '', '', ''],
    keywords: [],
    newKeyword: '',
    platform: 'amazon',
    site: 'US',
    locale: 'en_US',
  })

  const loadProductWorkspace = useCallback(async (productId: string) => {
    setLoading(true)
    setLoadError(false)
    setAiLoading(true)
    setAiError(null)
    try {
      const [result, downloads, parsedResult, promptsResult] = await Promise.allSettled([
        getProduct(productId),
        listDownloads(),
        getProductParsedInfo(productId),
        listProductPrompts(productId),
      ])

      if (result.status !== 'fulfilled') {
        throw result.reason
      }

      setData(result.value)

      if (downloads.status === 'fulfilled') {
        const scopedDownloads = downloads.value.filter(item => item.productId === productId)
        setProductDownloads(scopedDownloads)
        setSelectedDownloadId(current => (
          current === 'all' || scopedDownloads.some(item => item.id === current) ? current : 'all'
        ))
      }

      if (parsedResult.status === 'fulfilled') {
        setParsedInfo(parsedResult.value)
      } else {
        setParsedInfo(null)
        setAiError('parsed-info')
      }

      if (promptsResult.status === 'fulfilled') {
        setPrompts(promptsResult.value)
      } else {
        setPrompts([])
        setAiError(current => current ? `${current},prompts` : 'prompts')
      }

      setProductForm({
        skuCode: result.value.product.skuCode,
        title: result.value.product.title,
        categoryId: result.value.product.categoryId || '',
        brandId: result.value.product.brandId || '',
        costCurrency: result.value.product.costCurrency || 'USD',
        tags: result.value.product.tags || [],
      })
    } catch (error) {
      console.error('Failed to load product:', error)
      setData(null)
      setLoadError(true)
      showToast(t('product.detail.toast.loadFailed'), 'error')
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }, [showToast, t])

  useEffect(() => {
    if (id) {
      void Promise.resolve().then(() => loadProductWorkspace(id))
    }
  }, [id, loadProductWorkspace])

  async function handleGeneratePrompt() {
    if (!id || parsedInfo?.status !== 'succeeded') return
    setGeneratingPrompt(true)
    try {
      const created = await generateProductPrompt(id, { generationType: 'image', module: 'image' })
      setPrompts(current => [created, ...current.filter(item => item.id !== created.id)].sort((left, right) => right.versionNo - left.versionNo))
      showToast(t('product.detail.toast.promptGenerated'), 'success')
    } catch (error) {
      console.error('Failed to generate product prompt:', error)
      showToast(t('product.detail.toast.promptGenerateFailed'), 'error')
    } finally {
      setGeneratingPrompt(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm(t('product.detail.deleteConfirm'))) {
      return
    }
    setDeleting(true)
    try {
      await deleteProduct(id)
      navigate('/products')
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setDeleting(false)
    }
  }

  async function persistProductPatch(
    patch: Partial<{
      skuCode: string
      title: string
      categoryId: string
      brandId: string
      costCurrency: string
      tags: string[]
    }>,
  ) {
    if (!id || !data) return
    setSavingProduct(true)
    setProductSaveLabel(t('product.detail.saving'))
    try {
      const updated = await updateProduct(id, patch)
      setData(current => {
        if (!current) return current
        return {
          ...current,
          product: {
            ...current.product,
            ...updated,
          },
        }
      })
      setProductForm({
        skuCode: updated.skuCode,
        title: updated.title,
        categoryId: updated.categoryId || '',
        brandId: updated.brandId || '',
        costCurrency: updated.costCurrency || 'USD',
        tags: updated.tags || [],
      })
      setProductSaveLabel(t('product.detail.savedJustNow'))
    } catch (error) {
      console.error('Failed to update product:', error)
      setProductSaveLabel(t('product.detail.saveFailed'))
      showToast(t('product.detail.toast.saveFailed'), 'error')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleProductFieldBlur(field: keyof Omit<ProductFormState, 'tags'>) {
    if (!data) return
    const nextValue = productForm[field].trim()
    const currentValue = String(data.product[field] ?? '').trim()
    if (nextValue === currentValue) return
    await persistProductPatch({ [field]: nextValue || undefined } as Partial<ProductFormState>)
  }

  async function handleDetailTagsChange(nextTags: string[]) {
    if (!data) return
    if (JSON.stringify(nextTags) === JSON.stringify(data.product.tags || [])) return
    setProductForm(prev => ({ ...prev, tags: nextTags }))
    await persistProductPatch({ tags: nextTags })
  }

  async function addDetailTag() {
    const nextTag = detailTagInput.trim()
    if (!nextTag || productForm.tags.includes(nextTag)) return
    setDetailTagInput('')
    await handleDetailTagsChange([...productForm.tags, nextTag])
  }

  async function removeDetailTag(tag: string) {
    await handleDetailTagsChange(productForm.tags.filter(item => item !== tag))
  }

  async function handleCalculateProfit() {
    if (!id) return
    try {
      await calculateProfit(id, {
        platform: profitForm.platform,
        site: profitForm.site,
        costPrice: profitForm.costPrice,
        listingPrice: profitForm.listingPrice,
        logisticsCost: profitForm.logisticsCost,
        platformFee: profitForm.platformFee,
        otherFee: profitForm.otherFee,
      })
      setShowProfitModal(false)
      setProfitForm({ platform: 'amazon', site: 'US', costPrice: 0, listingPrice: 0, logisticsCost: 0, platformFee: 0, otherFee: 0 })
      await loadProductWorkspace(id)
    } catch (error) {
      console.error('Failed to calculate profit:', error)
    }
  }

  async function handleCreateExport() {
    if (!id) return
    try {
      await createExportTask(id, {
        platform: exportForm.platform,
        site: exportForm.site,
        locale: exportForm.locale,
        format: exportForm.format,
        assetRelationIds: exportScopedRelationIds.length > 0 ? exportScopedRelationIds : undefined,
      })
      setShowExportModal(false)
      setExportScopedRelationIds([])
      await loadProductWorkspace(id)
    } catch (error) {
      console.error('Failed to create export:', error)
    }
  }

  function openExportModalForAllAssets() {
    setExportScopedRelationIds([])
    setShowExportModal(true)
  }

  function openExportModalForSelection(assetRelationIds: string[]) {
    if (assetRelationIds.length === 0) return
    setExportScopedRelationIds(assetRelationIds)
    setShowExportModal(true)
  }

  async function handleCreateListing() {
    if (!id) return
    setSavingListing(true)
    try {
      if (editingVersion) {
        await updateListingVersion(id, editingVersion.id, {
          versionLabel: listingForm.versionLabel,
          title: listingForm.title,
          description: listingForm.description,
          bulletPoints: listingForm.bulletPoints.filter(Boolean),
          keywords: listingForm.keywords,
          platform: listingForm.platform,
          site: listingForm.site,
          locale: listingForm.locale,
        })
      } else {
        await createListingVersion(id, {
          versionLabel: listingForm.versionLabel,
          title: listingForm.title,
          description: listingForm.description,
          bulletPoints: listingForm.bulletPoints.filter(Boolean),
          keywords: listingForm.keywords,
          platform: listingForm.platform,
          site: listingForm.site,
          locale: listingForm.locale,
        })
      }
      setShowListingModal(false)
      setEditingVersion(null)
      setListingForm({
        versionLabel: '',
        title: '',
        description: '',
        bulletPoints: ['', '', '', '', ''],
        keywords: [],
        newKeyword: '',
        platform: 'amazon',
        site: 'US',
        locale: 'en_US',
      })
      await loadProductWorkspace(id)
    } catch (error) {
      console.error('Failed to create listing:', error)
    } finally {
      setSavingListing(false)
    }
  }

  function openCreateListingModal() {
    setEditingVersion(null)
    setListingForm({
      versionLabel: '',
      title: '',
      description: '',
      bulletPoints: ['', '', '', '', ''],
      keywords: [],
      newKeyword: '',
      platform: 'amazon',
      site: 'US',
      locale: 'en_US',
    })
    setShowListingModal(true)
  }

  function openEditListingModal(version: ListingVersion) {
    setEditingVersion(version)
    setListingForm({
      versionLabel: version.versionLabel,
      title: version.title,
      description: version.description || '',
      bulletPoints: [...version.bulletPoints, '', '', '', '', ''].slice(0, 5),
      keywords: [...version.keywords],
      newKeyword: '',
      platform: version.platform,
      site: version.site,
      locale: version.locale,
    })
    setShowListingModal(true)
  }

  async function handleAdoptListing(versionId: string) {
    if (!id) return
    setAdoptingVersionId(versionId)
    try {
      await adoptListingVersion(id, versionId)
      await loadProductWorkspace(id)
    } catch (error) {
      console.error('Failed to adopt listing:', error)
    } finally {
      setAdoptingVersionId(null)
    }
  }

  function addKeyword() {
    if (listingForm.newKeyword && !listingForm.keywords.includes(listingForm.newKeyword)) {
      setListingForm(prev => ({ ...prev, keywords: [...prev.keywords, prev.newKeyword], newKeyword: '' }))
    }
  }

  async function handleMakePrimaryAsset(assetRelationId: string) {
    if (!id) return
    setAssetMutatingRelationId(assetRelationId)
    try {
      await updateProductAssetRelation(id, assetRelationId, { isPrimary: true })
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.primaryUpdated'), 'success')
    } catch (error) {
      console.error('Failed to update primary asset:', error)
      showToast(t('product.detail.toast.primaryUpdateFailed'), 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  async function handleAssetRoleChange(assetRelationId: string, assetRole: string) {
    if (!id) return
    setAssetMutatingRelationId(assetRelationId)
    try {
      await updateProductAssetRelation(id, assetRelationId, { assetRole })
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.roleUpdated'), 'success')
    } catch (error) {
      console.error('Failed to update asset role:', error)
      showToast(t('product.detail.toast.roleUpdateFailed'), 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  async function handleDeleteAssetRelation(assetRelationId: string) {
    if (!id) return
    setAssetMutatingRelationId(assetRelationId)
    try {
      await deleteProductAsset(id, assetRelationId)
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.assetRemoved'), 'success')
    } catch (error) {
      console.error('Failed to delete product asset relation:', error)
      showToast(t('product.detail.toast.assetRemoveFailed'), 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  async function handleBulkAssetRoleChange(assetRelationIds: string[], assetRole: string) {
    if (!id || assetRelationIds.length === 0) return
    setAssetBulkMutating(true)
    try {
      await Promise.all(assetRelationIds.map(assetRelationId => updateProductAssetRelation(id, assetRelationId, { assetRole })))
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.bulkRoleUpdated', { count: assetRelationIds.length }), 'success')
    } catch (error) {
      console.error('Failed to bulk update asset role:', error)
      showToast(t('product.detail.toast.bulkRoleFailed'), 'error')
    } finally {
      setAssetBulkMutating(false)
    }
  }

  async function handleBulkDeleteAssetRelations(assetRelationIds: string[]) {
    if (!id || assetRelationIds.length === 0) return
    setAssetBulkMutating(true)
    try {
      await Promise.all(assetRelationIds.map(assetRelationId => deleteProductAsset(id, assetRelationId)))
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.bulkRemoved', { count: assetRelationIds.length }), 'success')
    } catch (error) {
      console.error('Failed to bulk delete asset relations:', error)
      showToast(t('product.detail.toast.bulkRemoveFailed'), 'error')
    } finally {
      setAssetBulkMutating(false)
    }
  }

  async function handleAssetSortOrderChange(assetRelationId: string, sortOrder: number) {
    if (!id) return
    setAssetMutatingRelationId(assetRelationId)
    try {
      await updateProductAssetRelation(id, assetRelationId, { sortOrder })
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.orderUpdated'), 'success')
    } catch (error) {
      console.error('Failed to update asset order:', error)
      showToast(t('product.detail.toast.orderUpdateFailed'), 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  async function handleMoveAsset(assetRelationId: string, direction: 'up' | 'down') {
    if (!id || !data) return
    const orderedAssets = [...data.assets].sort((left, right) => {
      if (left.relation.sortOrder !== right.relation.sortOrder) {
        return left.relation.sortOrder - right.relation.sortOrder
      }
      return left.relation.createdAt.localeCompare(right.relation.createdAt)
    })
    const currentIndex = orderedAssets.findIndex(item => item.relation.id === assetRelationId)
    if (currentIndex < 0) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= orderedAssets.length) return

    const current = orderedAssets[currentIndex]
    const target = orderedAssets[targetIndex]
    setAssetMutatingRelationId(assetRelationId)
    try {
      await updateProductAssetRelation(id, current.relation.id, { sortOrder: target.relation.sortOrder })
      await updateProductAssetRelation(id, target.relation.id, { sortOrder: current.relation.sortOrder })
      await loadProductWorkspace(id)
      showToast(t('product.detail.toast.moved'), 'success')
    } catch (error) {
      console.error(`Failed to move asset ${direction}:`, error)
      showToast(t('product.detail.toast.moveFailed'), 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  function handleInspectExportAssets(downloadId: string) {
    setSelectedDownloadId(downloadId)
    setActiveTab('assets')
  }

  if (loading) {
    return (
      <div data-testid="product-detail-loading" className="min-h-[calc(100vh-72px)] bg-[#09090b] p-4 text-white md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-32 rounded-[24px] border border-white/10 bg-white/[0.04]" />
          <div className="grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03]" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-72 rounded-2xl border border-white/10 bg-white/[0.03]" />
            <div className="h-72 rounded-2xl border border-white/10 bg-white/[0.03]" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-white/45">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {t('product.detail.ai.loading')}
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div data-testid="product-detail-error" className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#09090b] p-6 text-white">
        <div className="max-w-md rounded-[24px] border border-rose-400/25 bg-rose-400/10 p-6 text-center">
          <div className="text-lg font-semibold text-rose-100">{t('product.detail.loadError.title')}</div>
          <p className="mt-2 text-sm leading-relaxed text-rose-100/70">{t('product.detail.loadError.desc')}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => id && void loadProductWorkspace(id)} className="rounded-xl bg-rose-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-rose-200">
              {t('product.detail.loadError.retry')}
            </button>
            <Link to="/products" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10">
              {t('product.detail.backToProducts')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div data-testid="product-detail-empty" className="min-h-[calc(100vh-72px)] bg-[#09090b] text-white p-6 flex items-center justify-center">
        <div className="text-center text-white/40">
          <p>{t('product.detail.notFound')}</p>
          <Link to="/products" className="text-brand-400 hover:underline mt-2 inline-block">
            {t('product.detail.backToProducts')}
          </Link>
        </div>
      </div>
    )
  }

  const { product } = data

  return (
    <div data-testid="product-detail-page" className="flex min-h-[calc(100vh-72px)] w-full flex-col bg-[#09090b] text-white font-sans lg:h-[calc(100vh-72px)] lg:flex-row lg:overflow-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      
      {/* Sidebar - Configuration */}
      <aside className="order-2 w-full flex-shrink-0 border-b border-white/5 bg-[#0c0c10] shadow-[4px_0_24px_rgba(0,0,0,0.2)] lg:order-1 lg:flex lg:w-[360px] lg:flex-col lg:border-b-0 lg:border-r xl:w-[400px]">
        <div className="flex-none px-6 py-5 border-b border-white/5">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/90 transition-colors mb-5">
            <ArrowLeft className="h-4 w-4" />
            {t('productWorkbench.nav.productList')}
          </Link>
          <div className="flex items-center justify-between mb-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-white/90 truncate mr-2">{product.title}</h1>
            <button onClick={handleDelete} disabled={deleting} className="shrink-0 p-1.5 rounded-md hover:bg-red-500/10 text-white/40 hover:text-red-400 transition disabled:opacity-50">
              {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed font-mono">{product.skuCode}</p>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar sm:p-6 lg:max-h-none lg:flex-1">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                {t('product.detail.basicInfo')}
              </div>
              <div className="text-[11px] text-white/40">
                {savingProduct ? t('product.detail.saving') : productSaveLabel || t('product.detail.autoSave')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('product.detail.skuCode')} value={productForm.skuCode} onChange={v => setProductForm({...productForm, skuCode: v})} onBlur={() => void handleProductFieldBlur('skuCode')} />
              <SelectField label={t('product.detail.currency')} value={productForm.costCurrency} onChange={v => { setProductForm({...productForm, costCurrency: v}); void persistProductPatch({costCurrency: v}); }} options={[{label: t('product.detail.currencies.USD'), value: 'USD'}, {label: t('product.detail.currencies.CNY'), value: 'CNY'}, {label: t('product.detail.currencies.EUR'), value: 'EUR'}]} />
            </div>

            <InputField label={t('product.detail.titleLabel')} value={productForm.title} onChange={v => setProductForm({...productForm, title: v})} onBlur={() => void handleProductFieldBlur('title')} />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('product.detail.category')} value={productForm.categoryId} onChange={v => setProductForm({...productForm, categoryId: v})} onBlur={() => void handleProductFieldBlur('categoryId')} />
              <InputField label={t('product.detail.brand')} value={productForm.brandId} onChange={v => setProductForm({...productForm, brandId: v})} onBlur={() => void handleProductFieldBlur('brandId')} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">{t('product.detail.tags')}</label>
              <div className="flex gap-2">
                <input
                  value={detailTagInput}
                  onChange={event => setDetailTagInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void addDetailTag()
                    }
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
                  placeholder={t('product.detail.addTagPlaceholder')}
                />
                <button
                  onClick={() => void addDetailTag()}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {t('product.detail.addTag')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {productForm.tags.length > 0 ? (
                  productForm.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                      {tag}
                      <button onClick={() => void removeDetailTag(tag)} className="hover:text-white">×</button>
                    </span>
                  ))
                ) : (
                  <div className="text-xs text-white/30 italic">{t('product.detail.noTags')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              {t('product.detail.statusSnapshot')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailMetric label={t('product.detail.productStatus')} value={t(PRODUCT_STATUS_LABEL_KEYS[product.status], product.status)} />
              <DetailMetric label={t('product.detail.assetStatus')} value={product.assetStatus} />
              <DetailMetric label={t('product.detail.listingStatus')} value={product.listingStatus} />
              <DetailMetric label={t('product.detail.exportStatus')} value={product.exportStatus} />
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t border-white/5 bg-[#0c0c10]/90 backdrop-blur space-y-3">
          <Link
            data-testid="sidebar-open-ai-workspace-link"
            to={`/products/${product.id}/ai/ai-product`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-300 transition-all hover:bg-brand-500/20 focus:outline-none"
          >
            {t('product.detail.openAIWorkspace')}
          </Link>
          <Link
            data-testid="sidebar-open-batch-listing-link"
            to="/products/workbench/batch-listing"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 focus:outline-none"
          >
            {t('product.detail.openBatchListing')}
          </Link>
          <Link
            data-testid="sidebar-open-download-center-link"
            to="/products/workbench/downloads"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 focus:outline-none"
          >
            {t('product.detail.openDownloadCenter')}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative order-1 flex-1 min-w-0 bg-[#09090b] lg:order-2 lg:overflow-auto custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <ProductAIPipelinePanel
            product={product}
            assets={data.assets}
            listingVersions={data.listingVersions}
            exportTasks={data.exportTasks}
            parsedInfo={parsedInfo}
            prompts={prompts}
            aiLoading={aiLoading}
            aiError={aiError}
            generatingPrompt={generatingPrompt}
            onGeneratePrompt={() => void handleGeneratePrompt()}
            onOpenAssets={() => setActiveTab('assets')}
            onOpenListings={() => setActiveTab('listings')}
            onOpenExports={() => setActiveTab('exports')}
          />

          <section className="rounded-[24px] border border-white/10 bg-[#0d0d11] p-4 sm:p-5">
            <header className="flex gap-6 overflow-x-auto border-b border-white/5 custom-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <TabButton
                    key={tab.id}
                    active={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    icon={<Icon className="h-4 w-4" />}
                    label={t(TAB_LABEL_KEYS[tab.id], tab.label)}
                    testId={`product-${tab.id === 'profit' ? 'profit' : tab.id}-tab-trigger`}
                  />
                )
              })}
            </header>

            <div className="pt-6 animate-in fade-in duration-300">
              {activeTab === 'assets' && (
                <AssetsTab
                  productId={product.id}
                  assets={data.assets}
                  downloads={productDownloads}
                  selectedDownloadId={selectedDownloadId}
                  mutatingRelationId={assetMutatingRelationId}
                  bulkMutating={assetBulkMutating}
                  onSelectDownload={setSelectedDownloadId}
                  onMakePrimary={handleMakePrimaryAsset}
                  onDelete={handleDeleteAssetRelation}
                  onChangeRole={handleAssetRoleChange}
                  onChangeSortOrder={handleAssetSortOrderChange}
                  onMove={handleMoveAsset}
                  onBulkChangeRole={handleBulkAssetRoleChange}
                  onBulkDelete={handleBulkDeleteAssetRelations}
                  onCreateExportFromSelection={openExportModalForSelection}
                  onSelectionChange={setSelectedAssetRelationIds}
                />
              )}
              {activeTab === 'listings' && (
                <ListingsTab
                  versions={data.listingVersions}
                  onGenerate={openCreateListingModal}
                  onAdopt={handleAdoptListing}
                  onEdit={openEditListingModal}
                  adoptingVersionId={adoptingVersionId}
                />
              )}
              {activeTab === 'profit' && <ProfitTab snapshots={data.profitSnapshots} onCalculate={() => setShowProfitModal(true)} />}
              {activeTab === 'exports' && (
                <ExportsTab
                  tasks={data.exportTasks}
                  downloads={productDownloads}
                  productTitle={product.title}
                  assetCount={data.assets.length}
                  selectedAssetCount={selectedAssetRelationIds.length}
                  onCreate={openExportModalForAllAssets}
                  onCreateFromSelection={() => openExportModalForSelection(selectedAssetRelationIds)}
                  onInspectAssets={handleInspectExportAssets}
                />
              )}
              {activeTab === 'history' && <HistoryTab activities={data.activities} />}
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      {showProfitModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[90dvh] w-full overflow-hidden rounded-t-2xl border border-white/10 bg-[#0c0c10] shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white/90">{t('product.detail.profitModal.title')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectField label={t('product.detail.profitModal.platform')} value={profitForm.platform} onChange={v => setProfitForm({...profitForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopify'), value: 'shopify'}]} />
                <SelectField label={t('product.detail.profitModal.site')} value={profitForm.site} onChange={v => setProfitForm({...profitForm, site: v})} options={[{label: t('product.detail.sites.US'), value: 'US'}, {label: t('product.detail.sites.CA'), value: 'CA'}, {label: t('product.detail.sites.UK'), value: 'UK'}]} />
              </div>
              <InputField label={t('product.detail.profitModal.costPrice')} value={String(profitForm.costPrice)} onChange={v => setProfitForm({...profitForm, costPrice: parseFloat(v) || 0})} />
              <InputField label={t('product.detail.profitModal.listingPrice')} value={String(profitForm.listingPrice)} onChange={v => setProfitForm({...profitForm, listingPrice: parseFloat(v) || 0})} />
              <div className="grid grid-cols-3 gap-4">
                <InputField label={t('product.detail.profitModal.logisticsCost')} value={String(profitForm.logisticsCost)} onChange={v => setProfitForm({...profitForm, logisticsCost: parseFloat(v) || 0})} />
                <InputField label={t('product.detail.profitModal.platformFee')} value={String(profitForm.platformFee)} onChange={v => setProfitForm({...profitForm, platformFee: parseFloat(v) || 0})} />
                <InputField label={t('product.detail.profitModal.otherFee')} value={String(profitForm.otherFee)} onChange={v => setProfitForm({...profitForm, otherFee: parseFloat(v) || 0})} />
              </div>
            </div>
            <div className="px-6 py-5 bg-white/[0.02] border-t border-white/5 flex gap-3">
              <button onClick={() => setShowProfitModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition">
                {t('product.detail.profitModal.cancel')}
              </button>
              <button
                onClick={handleCalculateProfit}
                disabled={!profitForm.costPrice || !profitForm.listingPrice}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white disabled:bg-brand-500/50 disabled:cursor-not-allowed text-sm font-semibold transition"
              >
                {t('product.detail.profitModal.calculate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[90dvh] w-full overflow-hidden rounded-t-2xl border border-white/10 bg-[#0c0c10] shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white/90">{t('product.detail.exportModal.title')}</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                {exportScopedRelationIds.length > 0
                  ? t('product.detail.exportModal.scopeSelected', { count: exportScopedRelationIds.length })
                  : t('product.detail.exportModal.scopeAll', { count: data.assets.length })}
              </div>
              <SelectField label={t('product.detail.exportModal.platform')} value={exportForm.platform} onChange={v => setExportForm({...exportForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopify'), value: 'shopify'}]} />
              <SelectField label={t('product.detail.exportModal.site')} value={exportForm.site} onChange={v => setExportForm({...exportForm, site: v})} options={[{label: t('product.detail.sites.US'), value: 'US'}, {label: t('product.detail.sites.CA'), value: 'CA'}, {label: t('product.detail.sites.UK'), value: 'UK'}]} />
              <SelectField label={t('product.detail.exportModal.locale')} value={exportForm.locale} onChange={v => setExportForm({...exportForm, locale: v})} options={[{label: t('product.detail.locales.en_US'), value: 'en_US'}, {label: t('product.detail.locales.en_CA'), value: 'en_CA'}, {label: t('product.detail.locales.en_GB'), value: 'en_GB'}]} />
              <SelectField label={t('product.detail.exportModal.format')} value={exportForm.format} onChange={v => setExportForm({...exportForm, format: v})} options={[{label: t('product.detail.formats.CSV'), value: 'csv'}, {label: t('product.detail.formats.XLSX'), value: 'xlsx'}]} />
            </div>
            <div className="px-6 py-5 bg-white/[0.02] border-t border-white/5 flex gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setExportScopedRelationIds([])
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition"
              >
                {t('product.detail.exportModal.cancel')}
              </button>
              <button onClick={handleCreateExport} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition">
                {t('product.detail.exportModal.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0c0c10] shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="px-6 py-5 border-b border-white/5 shrink-0">
              <h2 className="text-lg font-semibold text-white/90">{editingVersion ? t('product.detail.listingModal.titleEdit') : t('product.detail.listingModal.titleCreate')}</h2>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-4">
                <SelectField label={t('product.detail.listingModal.platform')} value={listingForm.platform} onChange={v => setListingForm({...listingForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopify'), value: 'shopify'}]} />
                <SelectField label={t('product.detail.listingModal.site')} value={listingForm.site} onChange={v => setListingForm({...listingForm, site: v})} options={[{label: t('product.detail.sites.US'), value: 'US'}, {label: t('product.detail.sites.CA'), value: 'CA'}, {label: t('product.detail.sites.UK'), value: 'UK'}]} />
                <SelectField label={t('product.detail.listingModal.locale')} value={listingForm.locale} onChange={v => setListingForm({...listingForm, locale: v})} options={[{label: t('product.detail.locales.en_US'), value: 'en_US'}, {label: t('product.detail.locales.en_CA'), value: 'en_CA'}, {label: t('product.detail.locales.en_GB'), value: 'en_GB'}]} />
              </div>
              <InputField label={t('product.detail.listingModal.versionLabel')} value={listingForm.versionLabel} onChange={v => setListingForm({...listingForm, versionLabel: v})} placeholder={t('product.detail.listingModal.versionLabelPlaceholder')} />
              <InputField label={t('product.detail.listingModal.title')} value={listingForm.title} onChange={v => setListingForm({...listingForm, title: v})} placeholder={t('product.detail.listingModal.titlePlaceholder')} />
              <TextareaField label={t('product.detail.listingModal.description')} value={listingForm.description} onChange={v => setListingForm({...listingForm, description: v})} placeholder={t('product.detail.listingModal.descriptionPlaceholder')} rows={3} />
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">{t('product.detail.listingModal.bulletPoints')}</label>
                <div className="space-y-2">
                  {listingForm.bulletPoints.map((point, index) => (
                    <input
                      key={index}
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...listingForm.bulletPoints]
                        newPoints[index] = e.target.value
                        setListingForm(prev => ({ ...prev, bulletPoints: newPoints }))
                      }}
                      className="w-full rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
                      placeholder={`${t('product.detail.listingModal.bulletPlaceholder')} ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">{t('product.detail.listingModal.keywords')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={listingForm.newKeyword}
                    onChange={(e) => setListingForm(prev => ({ ...prev, newKeyword: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    className="flex-1 rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-sm text-white/90 outline-none transition-all placeholder:text-white/20 hover:border-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50"
                    placeholder={t('product.detail.listingModal.addKeyword')}
                  />
                  <button onClick={addKeyword} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listingForm.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-xs flex items-center gap-1.5"
                    >
                      {kw}
                      <button onClick={() => setListingForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))} className="hover:text-white">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-white/[0.02] border-t border-white/5 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowListingModal(false)
                  setEditingVersion(null)
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-semibold transition"
              >
                {t('product.detail.listingModal.cancel')}
              </button>
              <button
                onClick={handleCreateListing}
                disabled={!listingForm.versionLabel || !listingForm.title || savingListing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                {savingListing ? t('product.detail.listingModal.saving') : editingVersion ? t('product.detail.listingModal.saveChanges') : t('product.detail.listingModal.generate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1.5 text-sm font-medium text-white/90">{value}</div>
    </div>
  )
}

export default ProductDetailPage
