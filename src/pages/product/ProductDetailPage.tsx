import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Image, FileText, TrendingUp, Download, Wand2, LoaderCircle, Trash2, Plus } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { getProduct, updateProduct, calculateProfit, createExportTask, createListingVersion, updateListingVersion, adoptListingVersion, deleteProduct, deleteProductAsset, updateProductAssetRelation, listDownloads } from '@/services/product'
import type { Product, ListingVersion, ProfitSnapshot, ExportTask, ProductActivity, ProductAssetItem, DownloadRecord } from '@/types/product'
import { AssetsTab, ExportsTab, HistoryTab, ListingsTab, ProfitTab } from './components/ProductDetailTabs'

const TABS = [
  { id: 'assets', label: 'Assets', icon: Image },
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

export function ProductDetailPage() {
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
      showToast('Failed to load product workspace.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Are you sure you want to delete this product? All related data will be lost.')) {
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
    setProductSaveLabel('Saving...')
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
      setProductSaveLabel('Saved just now')
    } catch (error) {
      console.error('Failed to update product:', error)
      setProductSaveLabel('Save failed')
      showToast('Failed to save product changes.', 'error')
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
      showToast('Primary asset updated.', 'success')
    } catch (error) {
      console.error('Failed to update primary asset:', error)
      showToast('Failed to update primary asset.', 'error')
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
      showToast('Asset role updated.', 'success')
    } catch (error) {
      console.error('Failed to update asset role:', error)
      showToast('Failed to update asset role.', 'error')
    } finally {
      setAssetMutatingRelationId(null)
    }
  }

  async function handleDeleteAssetRelation(assetRelationId: string) {
    if (!id) return
    if (!confirm('Remove this asset from the product workspace?')) {
      return
    }
    setAssetMutatingRelationId(assetRelationId)
    try {
      await deleteProductAsset(id, assetRelationId)
      await loadProductWorkspace(id)
      showToast('Asset removed from product.', 'success')
    } catch (error) {
      console.error('Failed to delete product asset relation:', error)
      showToast('Failed to remove asset.', 'error')
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
      showToast(`Updated ${assetRelationIds.length} assets.`, 'success')
    } catch (error) {
      console.error('Failed to bulk update asset role:', error)
      showToast('Failed to update selected assets.', 'error')
    } finally {
      setAssetBulkMutating(false)
    }
  }

  async function handleBulkDeleteAssetRelations(assetRelationIds: string[]) {
    if (!id || assetRelationIds.length === 0) return
    if (!confirm(`Remove ${assetRelationIds.length} selected assets from the product workspace?`)) {
      return
    }
    setAssetBulkMutating(true)
    try {
      await Promise.all(assetRelationIds.map(assetRelationId => deleteProductAsset(id, assetRelationId)))
      await loadProductWorkspace(id)
      showToast(`Removed ${assetRelationIds.length} assets.`, 'success')
    } catch (error) {
      console.error('Failed to bulk delete asset relations:', error)
      showToast('Failed to remove selected assets.', 'error')
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
      showToast('Asset order updated.', 'success')
    } catch (error) {
      console.error('Failed to update asset order:', error)
      showToast('Failed to update asset order.', 'error')
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
      showToast(`Asset moved ${direction}.`, 'success')
    } catch (error) {
      console.error(`Failed to move asset ${direction}:`, error)
      showToast('Failed to reorder assets.', 'error')
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
      <div className="min-h-[calc(100vh-72px)] bg-[#0a0a12] text-white p-6 flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#0a0a12] text-white p-6 flex items-center justify-center">
        <div className="text-center text-white/40">
          <p>Product not found</p>
          <Link to="/products" className="text-brand-400 hover:underline mt-2 inline-block">
            Back to product center
          </Link>
        </div>
      </div>
    )
  }

  const { product } = data

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-[calc(100vh-72px)] bg-[#0a0a12] text-white"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Link to="/products" className="text-white/60 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">{product.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="text-white/50">{product.skuCode}</span>
              {product.brandId && <span className="text-white/50">• Brand: {product.brandId}</span>}
              {product.categoryId && <span className="text-white/50">• Category: {product.categoryId}</span>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition disabled:opacity-50">
              {deleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
            <Link
              to={`/products/${product.id}/ai/ai-product`}
              className="px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition"
            >
              Generate Assets
            </Link>
            <button onClick={openCreateListingModal} className="px-4 py-2 rounded-md bg-white hover:bg-slate-200 text-slate-950 text-sm font-medium transition">
              Generate Listing
            </button>
            <div className="px-4 py-2 rounded-md bg-white/5 border border-white/10 text-white/70 text-sm font-medium">
              Status: {product.status}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="glass-strong rounded-xl p-6 transition-all duration-300 hover:border-white/15 hover:shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                <p className="mt-1 text-sm text-white/45">
                  Edit product metadata inline. Fields save on blur so the workbench behaves like an active product editor instead of a read-only detail page.
                </p>
              </div>
              <div className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-white/55">
                {savingProduct ? 'Saving...' : productSaveLabel || 'Auto-save on blur'}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InlineField label="SKU Code">
                <input
                  value={productForm.skuCode}
                  onChange={event => setProductForm(prev => ({ ...prev, skuCode: event.target.value }))}
                  onBlur={() => void handleProductFieldBlur('skuCode')}
                  className="w-full glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                />
              </InlineField>
              <InlineField label="Currency">
                <select
                  value={productForm.costCurrency}
                  onChange={event => setProductForm(prev => ({ ...prev, costCurrency: event.target.value }))}
                  onBlur={() => void handleProductFieldBlur('costCurrency')}
                  className="w-full glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </InlineField>
            </div>

            <div className="mt-4">
              <InlineField label="Title">
                <input
                  value={productForm.title}
                  onChange={event => setProductForm(prev => ({ ...prev, title: event.target.value }))}
                  onBlur={() => void handleProductFieldBlur('title')}
                  className="w-full glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                />
              </InlineField>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InlineField label="Category">
                <input
                  value={productForm.categoryId}
                  onChange={event => setProductForm(prev => ({ ...prev, categoryId: event.target.value }))}
                  onBlur={() => void handleProductFieldBlur('categoryId')}
                  className="w-full glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                  placeholder="Category ID"
                />
              </InlineField>
              <InlineField label="Brand">
                <input
                  value={productForm.brandId}
                  onChange={event => setProductForm(prev => ({ ...prev, brandId: event.target.value }))}
                  onBlur={() => void handleProductFieldBlur('brandId')}
                  className="w-full glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                  placeholder="Brand ID"
                />
              </InlineField>
            </div>

            <div className="mt-4">
              <InlineField label="Tags">
                <div className="space-y-3">
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
                      className="flex-1 glass rounded-lg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/[0.05]"
                      placeholder="Add a tag"
                    />
                    <button
                      onClick={() => void addDetailTag()}
                      className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productForm.tags.length > 0 ? (
                      productForm.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                          {tag}
                          <button onClick={() => void removeDetailTag(tag)}>×</button>
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-white/35">No tags assigned.</div>
                    )}
                  </div>
                </div>
              </InlineField>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-strong rounded-xl p-6 transition-all duration-300 hover:border-white/15 hover:shadow-lg">
              <h3 className="text-lg font-semibold text-white">Status Snapshot</h3>
              <div className="mt-4 grid gap-3">
                <DetailMetric label="Product Status" value={product.status} />
                <DetailMetric label="Asset Status" value={product.assetStatus} />
                <DetailMetric label="Listing Status" value={product.listingStatus} />
                <DetailMetric label="Export Status" value={product.exportStatus} />
              </div>
            </div>
            <div className="glass-strong rounded-xl p-6 transition-all duration-300 hover:border-white/15 hover:shadow-lg">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <div className="mt-4 grid gap-3">
                <Link
                  to={`/products/${product.id}/ai/ai-product`}
                  className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Open Product AI Workspace
                </Link>
                <Link
                  to="/products/workbench/batch-listing"
                  className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Open Batch Listing Workbench
                </Link>
                <Link
                  to="/products/workbench/downloads"
                  className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Open Download Center
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="border-b border-white/5">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-brand-500 text-white'
                      : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-2">
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

      {showProfitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#10101a] rounded-xl w-full max-w-md border border-white/5">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Calculate Profit</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Platform</label>
                    <select
                      value={profitForm.platform}
                      onChange={(e) => setProfitForm(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="amazon">Amazon</option>
                      <option value="shopify">Shopify</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Site</label>
                    <select
                      value={profitForm.site}
                      onChange={(e) => setProfitForm(prev => ({ ...prev, site: e.target.value }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="US">US</option>
                      <option value="CA">CA</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profitForm.costPrice}
                    onChange={(e) => setProfitForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Listing Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profitForm.listingPrice}
                    onChange={(e) => setProfitForm(prev => ({ ...prev, listingPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Logistics ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={profitForm.logisticsCost}
                      onChange={(e) => setProfitForm(prev => ({ ...prev, logisticsCost: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Platform Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={profitForm.platformFee}
                      onChange={(e) => setProfitForm(prev => ({ ...prev, platformFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Other Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={profitForm.otherFee}
                      onChange={(e) => setProfitForm(prev => ({ ...prev, otherFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowProfitModal(false)} className="flex-1 px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition">
                  Cancel
                </button>
                <button
                  onClick={handleCalculateProfit}
                  disabled={!profitForm.costPrice || !profitForm.listingPrice}
                  className="flex-1 px-4 py-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 disabled:bg-white/20 disabled:cursor-not-allowed text-sm font-medium transition"
                >
                  Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#10101a] rounded-xl w-full max-w-md border border-white/5">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create Export</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  {exportScopedRelationIds.length > 0
                    ? `Export scope: ${exportScopedRelationIds.length} selected assets from the current workspace.`
                    : `Export scope: all ${data.assets.length} linked assets.`}
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Platform</label>
                  <select
                    value={exportForm.platform}
                    onChange={(e) => setExportForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="amazon">Amazon</option>
                    <option value="shopify">Shopify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Site</label>
                  <select
                    value={exportForm.site}
                    onChange={(e) => setExportForm(prev => ({ ...prev, site: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="US">US</option>
                    <option value="CA">CA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Locale</label>
                  <select
                    value={exportForm.locale}
                    onChange={(e) => setExportForm(prev => ({ ...prev, locale: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="en_US">en_US</option>
                    <option value="en_CA">en_CA</option>
                    <option value="en_GB">en_GB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Format</label>
                  <select
                    value={exportForm.format}
                    onChange={(e) => setExportForm(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportScopedRelationIds([])
                  }}
                  className="flex-1 px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button onClick={handleCreateExport} className="flex-1 px-4 py-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 text-sm font-medium transition">
                  Create Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showListingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#10101a] rounded-xl w-full max-w-lg border border-white/5 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{editingVersion ? 'Edit Listing Version' : 'Generate Listing'}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Platform</label>
                    <select
                      value={listingForm.platform}
                      onChange={(e) => setListingForm(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="amazon">Amazon</option>
                      <option value="shopify">Shopify</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Site</label>
                    <select
                      value={listingForm.site}
                      onChange={(e) => setListingForm(prev => ({ ...prev, site: e.target.value }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="US">US</option>
                      <option value="CA">CA</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-1">Locale</label>
                    <select
                      value={listingForm.locale}
                      onChange={(e) => setListingForm(prev => ({ ...prev, locale: e.target.value }))}
                      className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="en_US">en_US</option>
                      <option value="en_CA">en_CA</option>
                      <option value="en_GB">en_GB</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Version Label</label>
                  <input
                    type="text"
                    value={listingForm.versionLabel}
                    onChange={(e) => setListingForm(prev => ({ ...prev, versionLabel: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="e.g., Auto-generated v1"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Title</label>
                  <input
                    type="text"
                    value={listingForm.title}
                    onChange={(e) => setListingForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Product title"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Description</label>
                  <textarea
                    value={listingForm.description}
                    onChange={(e) => setListingForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                    placeholder="Product description"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Bullet Points</label>
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
                        className="w-full bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder={`Feature ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={listingForm.newKeyword}
                      onChange={(e) => setListingForm(prev => ({ ...prev, newKeyword: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="flex-1 bg-[#0a0a12] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Add keyword"
                    />
                    <button onClick={addKeyword} className="px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {listingForm.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs flex items-center gap-1"
                      >
                        {kw}
                        <button onClick={() => setListingForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowListingModal(false)
                    setEditingVersion(null)
                  }}
                  className="flex-1 px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateListing}
                  disabled={!listingForm.versionLabel || !listingForm.title || savingListing}
                  className="flex-1 px-4 py-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 disabled:bg-white/20 disabled:cursor-not-allowed text-sm font-medium transition"
                >
                  {savingListing ? 'Saving...' : editingVersion ? 'Save Changes' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm text-white/70">{label}</div>
      {children}
    </label>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#0a0a12] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-white/30">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

export default ProductDetailPage
