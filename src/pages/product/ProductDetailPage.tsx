import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  Download,
  Wand2,
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
  listDownloads
} from '@/services/product'
import type {
  Product,
  ListingVersion,
  ProfitSnapshot,
  ExportTask,
  ProductActivity,
  ProductAssetItem,
  DownloadRecord
} from '@/types/product'
import { AssetsTab, ExportsTab, HistoryTab, ListingsTab, ProfitTab } from './components/ProductDetailTabs'

const TABS = [
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'listings', label: 'Listings', icon: FileText },
  { id: 'profit', label: 'Profit', icon: TrendingUp },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'history', label: 'History', icon: Wand2 },
] as const

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

function TabButton({ active, onClick, icon, label, hasDot }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, hasDot?: boolean }) {
  return (
    <button
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

  useEffect(() => {
    if (id) {
      void loadProductWorkspace(id)
    }
  }, [id])

  async function loadProductWorkspace(productId: string) {
    setLoading(true)
    try {
      const [result, downloads] = await Promise.all([getProduct(productId), listDownloads()])
      setData(result)
      const scopedDownloads = downloads.filter(item => item.productId === productId)
      setProductDownloads(scopedDownloads)
      setSelectedDownloadId(current => (
        current === 'all' || scopedDownloads.some(item => item.id === current) ? current : 'all'
      ))
      setProductForm({
        skuCode: result.product.skuCode,
        title: result.product.title,
        categoryId: result.product.categoryId || '',
        brandId: result.product.brandId || '',
        costCurrency: result.product.costCurrency || 'USD',
        tags: result.product.tags || [],
      })
    } catch (error) {
      console.error('Failed to load product:', error)
      showToast(t('product.detail.toast.loadFailed'), 'error')
    } finally {
      setLoading(false)
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
      <div className="min-h-[calc(100vh-72px)] bg-[#09090b] text-white p-6 flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#09090b] text-white p-6 flex items-center justify-center">
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
    <div className="flex h-[calc(100vh-72px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      
      {/* Sidebar - Configuration */}
      <aside className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-white/5 bg-[#0c0c10] flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
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
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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
              <DetailMetric label={t('product.detail.productStatus')} value={t(`status.${product.status}` as any, product.status)} />
              <DetailMetric label={t('product.detail.assetStatus')} value={product.assetStatus} />
              <DetailMetric label={t('product.detail.listingStatus')} value={product.listingStatus} />
              <DetailMetric label={t('product.detail.exportStatus')} value={product.exportStatus} />
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t border-white/5 bg-[#0c0c10]/90 backdrop-blur space-y-3">
          <Link
            to={`/products/${product.id}/ai/ai-product`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-300 transition-all hover:bg-brand-500/20 focus:outline-none"
          >
            {t('product.detail.openAIWorkspace')}
          </Link>
          <Link
            to="/products/workbench/batch-listing"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 focus:outline-none"
          >
            {t('product.detail.openBatchListing')}
          </Link>
          <Link
            to="/products/workbench/downloads"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 focus:outline-none"
          >
            {t('product.detail.openDownloadCenter')}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        <header className="flex-none px-8 pt-8 border-b border-white/5 flex gap-8">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <TabButton 
                key={tab.id} 
                active={isActive} 
                onClick={() => setActiveTab(tab.id)} 
                icon={<Icon className="h-4 w-4" />} 
                label={t(`product.detail.tabs.${tab.id}` as any, tab.label)} 
              />
            )
          })}
        </header>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
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
        </div>
      </main>

      {/* Modals */}
      {showProfitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c10] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c10] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c10] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
