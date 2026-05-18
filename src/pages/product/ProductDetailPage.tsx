import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  LoaderCircle,
  Trash2,
  Plus,
  ChevronDown
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import { ProductWorkflowNav } from '@/components/product-workbench/ProductWorkflowNav'
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

void Trash2

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

function parseReadonlyProductInfo(specJson?: string) {
  if (!specJson) return [] as Array<{ key: string; value: string }>
  try {
    const parsed = JSON.parse(specJson) as Record<string, unknown>
    return Object.entries(parsed)
      .slice(0, 8)
      .map(([key, value]) => ({
        key,
        value: typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value),
      }))
  } catch {
    return [{ key: 'raw_spec', value: specJson }]
  }
}

export function ProductDetailPage() {
  const { t } = useTranslation()
  const copy = {
    basicInfo: t('product.detail.dossier.basicInfo'),
    autoSave: t('product.detail.dossier.autoSave'),
    saving: t('product.detail.dossier.saving'),
    skuCode: t('product.detail.dossier.skuCode'),
    currency: t('product.detail.dossier.currency'),
    title: t('product.detail.dossier.title'),
    category: t('product.detail.dossier.category'),
    brand: t('product.detail.dossier.brand'),
    tags: t('product.detail.dossier.tags'),
    addTag: t('product.detail.dossier.addTag'),
    addTagPlaceholder: t('product.detail.dossier.addTagPlaceholder'),
    noTags: t('product.detail.dossier.noTags'),
    productStatus: t('product.detail.dossier.productStatus'),
    assetStatus: t('product.detail.dossier.assetStatus'),
    listingStatus: t('product.detail.dossier.listingStatus'),
    exportStatus: t('product.detail.dossier.exportStatus'),
    openAIWorkspace: t('product.detail.dossier.openAIWorkspace'),
    openBatchListing: t('product.detail.dossier.openBatchListing'),
    openDownloadCenter: t('product.detail.dossier.openDownloadCenter'),
  }
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
  }

  void copy
  void deleting
  void savingProduct
  void productSaveLabel
  void handleDelete
  void handleProductFieldBlur
  void addDetailTag
  void removeDetailTag

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
          <Link to="/products" className="text-cyan-200 hover:underline mt-2 inline-block">
            {t('product.detail.backToProducts')}
          </Link>
        </div>
      </div>
    )
  }

  const { product } = data
  const parsedInfo = parseReadonlyProductInfo(product.specJson)
  const latestProfit = data.profitSnapshots[0]

  void adoptingVersionId
  void productDownloads
  void selectedDownloadId
  void assetMutatingRelationId
  void assetBulkMutating
  void selectedAssetRelationIds
  void setSelectedAssetRelationIds
  void openExportModalForAllAssets
  void openExportModalForSelection
  void openCreateListingModal
  void openEditListingModal
  void handleAdoptListing
  void handleMakePrimaryAsset
  void handleAssetRoleChange
  void handleDeleteAssetRelation
  void handleBulkAssetRoleChange
  void handleBulkDeleteAssetRelations
  void handleAssetSortOrderChange
  void handleMoveAsset
  void handleInspectExportAssets

  return (
    <div className="relative flex min-h-[calc(100vh-52px)] w-full flex-col overflow-hidden bg-[#0a0a12] text-[#e8eaf0] font-sans">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
      
      {/* Prototype-aligned single-SKU production dossier */}
      <section className="relative z-10 mx-auto mt-4 w-[calc(100%-2.5rem)] max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/products" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 transition-colors hover:text-white/90">
              <ArrowLeft className="h-4 w-4" />
              {t('productWorkbench.nav.productList')}
            </Link>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/65">SKU Detail Station · Production dossier</div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">SKU 详情 / 生产中心</h1>
            <p className="mt-1.5 text-sm text-white/48">
              {product.skuCode} · {product.title} · {product.categoryId || 'Uncategorized'} · {product.status} / {product.assetStatus} / {product.listingStatus}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowListingModal(true)} className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.08]">新建 Listing 版本</button>
            <button onClick={() => setShowProfitModal(true)} className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.08]">利润计算</button>
          </div>
        </div>

        <div className="mb-5">
          <ProductWorkflowNav active="detail" productId={product.id} contextLabel={product.title} source="sku-detail" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">基础信息</div>
              <div className="divide-y divide-white/[0.06] text-sm">
                {[
                  ['SKU', product.skuCode],
                  ['标题', product.title],
                  ['类目', product.categoryId || '—'],
                  ['成本', `${product.costCurrency || 'USD'} ${product.costJson || '—'}`],
                  ['品牌', product.brandId || '—'],
                  ['标签', product.tags?.join(', ') || '—'],
                  ['状态', product.status],
                  ['素材 / Listing / Export', `${product.assetStatus} / ${product.listingStatus} / ${product.exportStatus}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-6 py-2.5">
                    <span className="text-white/38">{label}</span>
                    <span className="max-w-[70%] truncate text-right font-medium text-white/82">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-cyan-300/18 bg-cyan-300/[0.04] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/70">PARSED_INFO（系统解析 · 只读）</div>
              {parsedInfo.length > 0 ? (
                <div className="divide-y divide-white/[0.06] text-sm">
                  {parsedInfo.slice(0, 5).map(item => (
                    <div key={item.key} className="grid gap-3 py-2.5 md:grid-cols-[180px_1fr]">
                      <span className="text-white/38">{item.key}</span>
                      <span className="text-white/78">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/45">后端当前未返回结构化 spec_json；此处保持真实空状态，不伪造解析结果。</div>
              )}
              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 text-xs text-cyan-100/58">parsed_info 由系统自动解析写入，前端不可修改；后续模块只读取，不重复解析。</div>
            </section>

            <section className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-4 flex items-center justify-between"><div className="text-xs font-bold uppercase tracking-[0.22em] text-white/38">SKU.ASSETS 素材库</div><span className="text-xs text-white/35">{data.assets.length}/5</span></div>
              <div className="mb-4 flex flex-wrap gap-2">{['主图','场景','模特','详情','视频'].map((role, index) => <span key={role} className={`rounded-full border px-3 py-1 text-xs ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{role}</span>)}</div>
              {data.assets.length ? <div className="grid gap-3 sm:grid-cols-2">{data.assets.slice(0,4).map(asset => <div key={asset.relation.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-xs text-white/65"><div className="font-semibold text-white/80">{asset.relation.assetRole || 'asset'}</div><div className="mt-1 truncate text-white/40">{asset.asset?.fileName || asset.asset?.id || asset.relation.assetId}</div></div>)}</div> : <div className="rounded-2xl border border-dashed border-rose-300/25 bg-rose-300/[0.055] p-5 text-sm text-rose-100/75">主图缺失。请进入视觉工作区生成并绑定到 SKU.assets。</div>}
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">LISTING 版本</div>
                <div className="space-y-2">
                  {data.listingVersions.slice(0, 4).map(version => <div key={version.id} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"><span className="font-mono text-white/75">v{version.versionNo}</span><span className={version.status === 'adopted' ? 'text-emerald-200' : 'text-white/48'}>{version.status} · {version.versionLabel}</span></div>)}
                  {!data.listingVersions.length ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/42">暂无 Listing 版本。</div> : null}
                </div>
                <button onClick={() => setShowListingModal(true)} className="mt-4 rounded-xl bg-cyan-200 px-4 py-2 text-xs font-bold text-[#05070b]">新建版本</button>
                <p className="mt-3 text-xs leading-5 text-white/42">Listing = 只增不改的版本仓库。任何编辑必须通过新版本生成实现。</p>
              </div>
              <div className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">导出前校验</div>
                <div className="space-y-2 text-sm">
                  <PrecheckLine label="已采用 Listing" ok={product.listingStatus === 'ready' || data.listingVersions.some(v => v.status === 'adopted')} value={data.listingVersions.find(v => v.status === 'adopted')?.versionLabel || '未采用'} />
                  <PrecheckLine label="必需素材" ok={product.assetStatus === 'ready'} value={product.assetStatus === 'ready' ? '素材完整' : '主图/必需素材缺失'} />
                  <PrecheckLine label="平台/站点/语言" ok value={`${exportForm.platform} / ${exportForm.site} / ${exportForm.locale}`} />
                  <PrecheckLine label="Manifest" ok={product.exportStatus === 'done'} value={product.exportStatus === 'done' ? '已生成' : '未生成'} />
                </div>
                <button onClick={() => setShowExportModal(true)} disabled={product.assetStatus !== 'ready'} className="mt-4 w-full rounded-xl bg-cyan-200 px-4 py-2.5 text-xs font-bold text-[#05070b] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-white/28">创建导出任务{product.assetStatus !== 'ready' ? '（禁用：素材不完整）' : ''}</button>
                <p className="mt-3 text-xs leading-5 text-rose-100/65">导出前必须满足：已采用 Listing + 必需素材完整 + 平台配置存在。</p>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">利润计算</div>
              {latestProfit ? <div className="grid grid-cols-2 gap-3"><DetailMetric label="净利" value={`${product.costCurrency || 'USD'} ${latestProfit.netProfit}`} /><DetailMetric label="利润率" value={`${latestProfit.netMargin}%`} /></div> : <button onClick={() => setShowProfitModal(true)} className="w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-white/70">计算利润</button>}
              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-xs leading-5 text-white/42">按真实后端利润快照计算：净利 = 售价 - 成本 - 物流 - 平台费 - 其他费用；利润率 = 净利 / 售价。</div>
            </div>
            <div className="rounded-[28px] border border-cyan-300/16 bg-cyan-300/[0.045] p-5">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/70">状态总览</div>
              <div className="grid grid-cols-2 gap-2">
                <StatusPill label="Info" ok />
                <StatusPill label="Assets" ok={product.assetStatus === 'ready'} />
                <StatusPill label="Listing" ok={product.listingStatus === 'ready'} />
                <StatusPill label="Export" ok={product.exportStatus === 'done' || product.exportStatus === 'ready'} />
              </div>
              <div className="mt-4 rounded-2xl border border-rose-300/18 bg-rose-300/[0.06] p-3 text-xs leading-5 text-rose-100/72">当前状态：{product.assetStatus !== 'ready' ? '缺素材，请在任务中心查看生成任务状态。' : product.listingStatus !== 'ready' ? '可进入 Listing 页面创建/采用版本。' : '可进入交付中心创建导出。'}</div>
              <div className="mt-4 space-y-2">
                <Link to={`/products/workbench/batch-listing?productIds=${encodeURIComponent(product.id)}&source=sku-detail`} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white/70">去模板中心</Link>
                <Link to={`/products/workbench/downloads?productIds=${encodeURIComponent(product.id)}&source=sku-detail`} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white/70">去交付中心</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Main Content */}
      {/* Modals */}
      {showProfitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c10] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white/90">{t('product.detail.profitModal.title')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectField label={t('product.detail.profitModal.platform')} value={profitForm.platform} onChange={v => setProfitForm({...profitForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopee'), value: 'shopee'}, {label: t('product.detail.platforms.lazada'), value: 'lazada'}]} />
                <SelectField label={t('product.detail.profitModal.site')} value={profitForm.site} onChange={v => setProfitForm({...profitForm, site: v})} options={[{label: t('product.detail.sites.US'), value: 'US'}, {label: t('product.detail.sites.CA'), value: 'CA'}, {label: t('product.detail.sites.UK'), value: 'UK'}]} />
              </div>
              <InputField label={t('product.detail.profitModal.costPrice')} value={String(profitForm.costPrice)} onChange={v => setProfitForm({...profitForm, costPrice: parseFloat(v) || 0})} />
              <InputField label={t('product.detail.profitModal.listingPrice')} value={String(profitForm.listingPrice)} onChange={v => setProfitForm({...profitForm, listingPrice: parseFloat(v) || 0})} />
              <div className="grid grid-cols-3 gap-4">
                <InputField label={t('product.detail.profitModal.logisticsCost')} value={String(profitForm.logisticsCost)} onChange={v => setProfitForm({...profitForm, logisticsCost: parseFloat(v) || 0})} />
                <InputField label={t('product.detail.profitModal.platformFee')} value={String(profitForm.platformFee)} onChange={v => setProfitForm({...profitForm, platformFee: parseFloat(v) || 0})} />
                <InputField label={t('product.detail.profitModal.otherFee')} value={String(profitForm.otherFee)} onChange={v => setProfitForm({...profitForm, otherFee: parseFloat(v) || 0})} />
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs text-white/58">
                <div className="mb-2 font-semibold text-white/72">{t('product.detail.profitModal.previewTitle')}</div>
                <div className="grid grid-cols-2 gap-2">
                  <span>{t('product.detail.profitModal.estimatedNetProfit')}</span>
                  <span className="text-right text-cyan-100">{(profitForm.listingPrice - profitForm.costPrice - profitForm.logisticsCost - profitForm.platformFee - profitForm.otherFee).toFixed(2)}</span>
                  <span>{t('product.detail.profitModal.estimatedNetMargin')}</span>
                  <span className="text-right text-cyan-100">{profitForm.listingPrice > 0 ? (((profitForm.listingPrice - profitForm.costPrice - profitForm.logisticsCost - profitForm.platformFee - profitForm.otherFee) / profitForm.listingPrice) * 100).toFixed(1) : '0.0'}%</span>
                </div>
                <p className="mt-2 leading-5 text-white/38">{t('product.detail.profitModal.formulaHint')}</p>
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
              <SelectField label={t('product.detail.exportModal.platform')} value={exportForm.platform} onChange={v => setExportForm({...exportForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopee'), value: 'shopee'}, {label: t('product.detail.platforms.lazada'), value: 'lazada'}]} />
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
                <SelectField label={t('product.detail.listingModal.platform')} value={listingForm.platform} onChange={v => setListingForm({...listingForm, platform: v})} options={[{label: t('product.detail.platforms.amazon'), value: 'amazon'}, {label: t('product.detail.platforms.shopee'), value: 'shopee'}, {label: t('product.detail.platforms.lazada'), value: 'lazada'}]} />
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


function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${ok ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/25 bg-rose-300/10 text-rose-200'}`}>{label} {ok ? '✓' : '✕'}</span>
}

function PrecheckLine({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2"><span className="text-white/45">{label}</span><span className={ok ? 'text-emerald-200' : 'text-rose-200'}>{ok ? '✓' : '✕'} {value}</span></div>
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
