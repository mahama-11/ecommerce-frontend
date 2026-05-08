import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Boxes,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import type { ProductListItem, ProductStatus } from '@/types/product'
import { createProduct, deleteProduct, listProducts } from '@/services/product'

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  assets_ready: 'Assets Ready',
  listing_ready: 'Listing Ready',
  export_ready: 'Export Ready',
  published: 'Published',
  archived: 'Archived',
}

const STATUS_BADGE_CLASS: Record<ProductStatus, string> = {
  draft: 'border-white/10 bg-white/5 text-white/60',
  assets_ready: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  listing_ready: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  export_ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  published: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
  archived: 'border-white/10 bg-white/5 text-white/40',
}



const EXPORT_STATUS_BADGE: Record<ProductListItem['exportStatus'], string> = {
  pending: 'bg-white/5 text-white/40',
  ready: 'bg-blue-500/10 text-blue-300',
  done: 'bg-emerald-500/10 text-emerald-300',
}

const IMPORT_TEMPLATE_HEADERS = [
  'skuCode',
  'title',
  'categoryId',
  'brandId',
  'tags',
  'costCurrency',
]

type ProductCreateForm = {
  skuCode: string
  title: string
  categoryId: string
  brandId: string
  costCurrency: string
  tags: string[]
  newTag: string
}

type ImportRow = {
  lineNo: number
  skuCode: string
  title: string
  categoryId: string
  brandId: string
  tags: string[]
  costCurrency: string
  errors: string[]
}

type ColumnKey =
  | 'sku'
  | 'title'
  | 'status'
  | 'assets'
  | 'listing'
  | 'export'
  | 'category'
  | 'brand'
  | 'tags'
  | 'updatedAt'

const COLUMN_KEYS: ColumnKey[] = [
  'sku',
  'title',
  'status',
  'assets',
  'listing',
  'export',
  'category',
  'brand',
  'tags',
  'updatedAt',
]

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  sku: true,
  title: true,
  status: true,
  assets: true,
  listing: true,
  export: true,
  category: true,
  brand: true,
  tags: true,
  updatedAt: true,
}

const INITIAL_CREATE_FORM: ProductCreateForm = {
  skuCode: '',
  title: '',
  categoryId: '',
  brandId: '',
  costCurrency: 'USD',
  tags: [],
  newTag: '',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function parseTags(value: unknown) {
  return String(value ?? '')
    .split(/[,;\n|]/)
    .map(item => item.trim())
    .filter(Boolean)
}

async function loadXLSX() {
  return import('xlsx')
}

function normalizeImportRow(raw: Record<string, unknown>, lineNo: number): ImportRow {
  const normalizedEntries = Object.entries(raw).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key.trim().toLowerCase()] = value
    return acc
  }, {})

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = normalizedEntries[key.toLowerCase()]
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim()
      }
    }
    return ''
  }

  const row: ImportRow = {
    lineNo,
    skuCode: pick('skucode', 'sku_code', 'sku'),
    title: pick('title', 'producttitle', 'product_title', 'name'),
    categoryId: pick('categoryid', 'category_id', 'category'),
    brandId: pick('brandid', 'brand_id', 'brand'),
    tags: parseTags(pick('tags', 'tag')),
    costCurrency: pick('costcurrency', 'cost_currency', 'currency') || 'USD',
    errors: [],
  }

  if (!row.skuCode) row.errors.push('SKU is required')
  if (!row.title) row.errors.push('Title is required')
  return row
}

function getImportRowErrors(row: Partial<ImportRow>) {
  return Array.isArray(row.errors) ? row.errors : []
}

function isImportRowValid(row: Partial<ImportRow>) {
  return getImportRowErrors(row).length === 0
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}>
      {t(`product.status.${status}`)}
    </span>
  )
}

function ProductListPage() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<ProductStatus | 'all'>('all')
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewProductId, setPreviewProductId] = useState<string>('')
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS)
  const [createForm, setCreateForm] = useState<ProductCreateForm>(INITIAL_CREATE_FORM)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [parsingImport, setParsingImport] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    void loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await listProducts()
      setProducts(data)
      setSelectedIds(current => current.filter(id => data.some(item => item.id === id)))
      setPreviewProductId(current => {
        if (current && data.some(item => item.id === current)) return current
        return data[0]?.id ?? ''
      })
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      await createProduct({
        skuCode: createForm.skuCode.trim(),
        title: createForm.title.trim(),
        categoryId: createForm.categoryId.trim() || undefined,
        brandId: createForm.brandId.trim() || undefined,
        tags: createForm.tags,
        costCurrency: createForm.costCurrency,
      })
      setShowCreateModal(false)
      setCreateForm(INITIAL_CREATE_FORM)
      showToast('Product created.', 'success')
      await loadProducts()
    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product? All related data will be lost.')) {
      return
    }
    setDeletingId(productId)
    try {
      await deleteProduct(productId)
      showToast('Product deleted.', 'success')
      await loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setDeletingId(null)
    }
  }

  function addTag() {
    const nextTag = createForm.newTag.trim()
    if (nextTag && !createForm.tags.includes(nextTag)) {
      setCreateForm(prev => ({ ...prev, tags: [...prev.tags, nextTag], newTag: '' }))
    }
  }

  function toggleSelect(productId: string) {
    setSelectedIds(current =>
      current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId],
    )
  }

  const filteredProducts = useMemo(() => {
    let result = products
    if (filterStatus !== 'all') {
      result = result.filter(product => product.status === filterStatus)
    }
    if (keyword.trim()) {
      const lowerKeyword = keyword.trim().toLowerCase()
      result = result.filter(product =>
        product.title.toLowerCase().includes(lowerKeyword) ||
        product.skuCode.toLowerCase().includes(lowerKeyword) ||
        (product.categoryId || '').toLowerCase().includes(lowerKeyword) ||
        (product.brandId || '').toLowerCase().includes(lowerKeyword) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)),
      )
    }
    return result
  }, [filterStatus, keyword, products])

  const previewProduct = filteredProducts.find(product => product.id === previewProductId)
    ?? products.find(product => product.id === previewProductId)
    ?? filteredProducts[0]
    ?? products[0]
    ?? null

  const selectedProducts = products.filter(product => selectedIds.includes(product.id))
  const statusSummary = useMemo(() => {
    return {
      total: products.length,
      draft: products.filter(item => item.status === 'draft').length,
      readyForListing: products.filter(item => item.assetStatus === 'ready').length,
      readyForExport: products.filter(item => item.status === 'export_ready').length,
    }
  }, [products])

  function toggleColumn(column: ColumnKey) {
    setVisibleColumns(current => ({ ...current, [column]: !current[column] }))
  }

  function handleSelectAllFiltered() {
    if (filteredProducts.length === 0) return
    const filteredIds = filteredProducts.map(product => product.id)
    const alreadyAllSelected = filteredIds.every(id => selectedIds.includes(id))
    setSelectedIds(current => {
      if (alreadyAllSelected) {
        return current.filter(id => !filteredIds.includes(id))
      }
      return Array.from(new Set([...current, ...filteredIds]))
    })
  }

  async function handleImportFile(file: File) {
    setParsingImport(true)
    try {
      const XLSX = await loadXLSX()
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        setImportRows([])
        showToast('The spreadsheet is empty.', 'error')
        return
      }
      const sheet = workbook.Sheets[firstSheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const normalized = rows.map((row, index) => normalizeImportRow(row, index + 2))
      setImportRows(normalized)
      if (normalized.length === 0) {
        showToast('No rows found in the spreadsheet.', 'error')
      }
    } catch (error) {
      console.error('Failed to parse import file:', error)
      showToast('Failed to parse spreadsheet.', 'error')
      setImportRows([])
    } finally {
      setParsingImport(false)
    }
  }

  async function handleImportSubmit() {
    const validRows = importRows.filter(isImportRowValid)
    if (validRows.length === 0) {
      showToast('No valid import rows available.', 'error')
      return
    }

    setImporting(true)
    let succeeded = 0
    const failedRows: ImportRow[] = []

    for (const row of validRows) {
      try {
        // Keep the import resilient: one failed row should not block other products.
        // eslint-disable-next-line no-await-in-loop
        await createProduct({
          skuCode: row.skuCode,
          title: row.title,
          categoryId: row.categoryId || undefined,
          brandId: row.brandId || undefined,
          tags: row.tags,
          costCurrency: row.costCurrency || 'USD',
        })
        succeeded += 1
      } catch (error) {
        console.error('Failed to import row:', row, error)
        failedRows.push({ ...row, errors: ['Create request failed'] })
      }
    }

    setImporting(false)
    setImportRows(failedRows)
    await loadProducts()

    if (failedRows.length === 0) {
      setShowImportModal(false)
      showToast(`Imported ${succeeded} products.`, 'success')
      return
    }

    showToast(`Imported ${succeeded} products, ${failedRows.length} failed.`, failedRows.length > 0 ? 'error' : 'success')
  }

  function downloadImportTemplate() {
    void (async () => {
      const XLSX = await loadXLSX()
      const worksheet = XLSX.utils.json_to_sheet([
        {
          skuCode: 'SKU-10001',
          title: 'Example Product',
          categoryId: 'home',
          brandId: 'brand-a',
          tags: 'kitchen,storage',
          costCurrency: 'USD',
        },
      ])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'products')
      XLSX.writeFile(workbook, 'product-import-template.xlsx')
    })()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
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
      className="flex flex-col h-full text-white overflow-hidden"
    >
      {/* Header & Stats Row */}
      <motion.div variants={itemVariants} className="flex-none px-6 py-6 border-b border-white/5 bg-[#0a0a12]/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Boxes className="w-6 h-6 text-brand-400" />
              {t('product.list.title')}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {t('product.list.description')}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 pr-6 border-r border-white/10">
              <div className="flex flex-col">
                <span className="text-xs text-white/40 uppercase tracking-wider">{t('product.list.stats.total')}</span>
                <span className="text-xl font-semibold text-white">{statusSummary.total}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/40 uppercase tracking-wider">{t('product.list.stats.draft')}</span>
                <span className="text-xl font-semibold text-white">{statusSummary.draft}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/40 uppercase tracking-wider">{t('product.list.stats.ready')}</span>
                <span className="text-xl font-semibold text-emerald-400">{statusSummary.readyForListing}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Upload className="h-4 w-4" />
                {t('product.list.import')}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400 shadow-[0_0_20px_rgba(var(--brand-500),0.3)]"
              >
                <Plus className="h-4 w-4" />
                {t('product.list.create')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto relative">
        {/* Table Section */}
        <motion.div variants={itemVariants} className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${previewProduct ? 'pr-0 lg:pr-8' : ''}`}>
          
          {/* Filters Bar */}
          <div className="flex-none p-6 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[300px] max-w-2xl">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder={t('product.list.search')}
                    value={keyword}
                    onChange={event => setKeyword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white/90 outline-none transition focus:border-brand-500/50 focus:bg-white/[0.04] placeholder:text-white/30"
                  />
                </div>
                <div className="relative shrink-0">
                  <select
                    value={filterStatus}
                    onChange={event => setFilterStatus(event.target.value as ProductStatus | 'all')}
                    className="appearance-none rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-4 pr-10 text-sm text-white/90 outline-none transition hover:bg-white/[0.04] focus:border-brand-500/50"
                  >
                    <option value="all">{t('product.list.allStatus')}</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-1.5 hidden md:flex">
                  {COLUMN_KEYS.filter(k => ['sku', 'title', 'status', 'assets', 'updatedAt'].includes(k)).map(column => (
                    <button
                      key={column}
                      onClick={() => toggleColumn(column)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        visibleColumns[column]
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {t(`product.list.table.${column}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch Actions */}
            {selectedProducts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3"
              >
                <span className="text-sm font-medium text-brand-300">
                  {selectedProducts.length} {t('product.list.selected')}
                </span>
                <div className="h-4 w-px bg-brand-500/20" />
                <Link
                  to="/products/workbench/batch-listing"
                  className="text-sm font-medium text-white hover:text-brand-300 transition"
                >
                  {t('product.list.batchListing')}
                </Link>
                <button
                  onClick={() => setSelectedIds([])}
                  className="ml-auto text-sm text-white/50 hover:text-white"
                >
                  {t('product.list.clearSelection')}
                </button>
              </motion.div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto px-6 pb-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md overflow-hidden flex flex-col h-full shadow-2xl">
              {loading ? (
                <div className="flex flex-1 items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-brand-400" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white/40 p-12">
                  <div className="p-4 rounded-full bg-white/5 border border-white/10">
                    <Package className="h-10 w-10 text-white/20" />
                  </div>
                  <div className="text-center">
                    <div className="text-base font-medium text-white/70 mb-1">{t('product.list.noProducts')}</div>
                    <div className="text-sm text-white/40">{t('product.list.noProductsDesc')}</div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-12" />
                      {visibleColumns.sku && <col className="w-32" />}
                      {visibleColumns.title && <col className="w-48" />}
                      {visibleColumns.status && <col className="w-28" />}
                      {visibleColumns.assets && <col className="w-24" />}
                      {visibleColumns.listing && <col className="w-24" />}
                      {visibleColumns.export && <col className="w-24" />}
                      {visibleColumns.category && <col className="w-24" />}
                      {visibleColumns.brand && <col className="w-24" />}
                      {visibleColumns.tags && <col className="w-32" />}
                      {visibleColumns.updatedAt && <col className="w-28" />}
                      <col className="w-24" />
                    </colgroup>
                    <thead className="bg-white/5 text-white/50 sticky top-0 z-10 backdrop-blur-md">
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-white/20 bg-black/20 accent-brand-500"
                            checked={filteredProducts.length > 0 && filteredProducts.every(product => selectedIds.includes(product.id))}
                            onChange={handleSelectAllFiltered}
                          />
                        </th>
                        {visibleColumns.sku ? <th className="px-4 py-4 font-medium">{t('product.list.table.sku')}</th> : null}
                        {visibleColumns.title ? <th className="px-4 py-4 font-medium">{t('product.list.table.title')}</th> : null}
                        {visibleColumns.status ? <th className="px-4 py-4 font-medium">{t('product.list.table.status')}</th> : null}
                        {visibleColumns.assets ? <th className="px-4 py-4 font-medium">{t('product.list.table.assets')}</th> : null}
                        {visibleColumns.listing ? <th className="px-4 py-4 font-medium">{t('product.list.table.listing')}</th> : null}
                        {visibleColumns.export ? <th className="px-4 py-4 font-medium">{t('product.list.table.export')}</th> : null}
                        {visibleColumns.category ? <th className="px-4 py-4 font-medium">{t('product.list.table.category')}</th> : null}
                        {visibleColumns.brand ? <th className="px-4 py-4 font-medium">{t('product.list.table.brand')}</th> : null}
                        {visibleColumns.tags ? <th className="px-4 py-4 font-medium">{t('product.list.table.tags')}</th> : null}
                        {visibleColumns.updatedAt ? <th className="px-4 py-4 font-medium">{t('product.list.table.updatedAt')}</th> : null}
                        <th className="px-4 py-4 font-medium text-right">{t('product.list.table.actions')}</th>
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={{
                        show: { transition: { staggerChildren: 0.03 } }
                      }}
                      initial="hidden"
                      animate="show"
                      className="divide-y divide-white/5"
                    >
                      {filteredProducts.map(product => {
                        const selected = selectedIds.includes(product.id)
                        const deleting = deletingId === product.id
                        const previewing = previewProduct?.id === product.id

                        return (
                          <motion.tr
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              show: { opacity: 1, y: 0 }
                            }}
                            key={product.id}
                            onClick={() => setPreviewProductId(product.id)}
                            className={`group cursor-pointer transition-colors duration-200 ${
                              previewing ? 'bg-brand-500/[0.08]' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <td className="px-4 py-3.5" onClick={event => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelect(product.id)}
                                className="rounded border-white/20 bg-black/20 accent-brand-500"
                              />
                            </td>
                            {visibleColumns.sku ? (
                              <td className="truncate whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-white/90 min-w-0 max-w-[120px]">
                                {product.skuCode}
                              </td>
                            ) : null}
                            {visibleColumns.title ? (
                              <td className="px-4 py-3.5 min-w-0 max-w-[200px]">
                                <div className="truncate font-medium text-white/90 group-hover:text-brand-300 transition-colors">{product.title}</div>
                              </td>
                            ) : null}
                            {visibleColumns.status ? (
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <StatusBadge status={product.status} />
                              </td>
                            ) : null}
                            {visibleColumns.assets ? (
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white/90">{product.assetsCount}</span>
                                  <div className={`w-2 h-2 rounded-full ${product.assetStatus === 'ready' ? 'bg-emerald-400' : product.assetStatus === 'partial' ? 'bg-amber-400' : 'bg-white/20'}`} title={product.assetStatus} />
                                </div>
                              </td>
                            ) : null}
                            {visibleColumns.listing ? (
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white/90">{product.listingVersionsCount}</span>
                                  <div className={`w-2 h-2 rounded-full ${product.listingStatus === 'ready' ? 'bg-emerald-400' : product.listingStatus === 'partial' ? 'bg-blue-400' : 'bg-white/20'}`} title={product.listingStatus} />
                                </div>
                              </td>
                            ) : null}
                            {visibleColumns.export ? (
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${EXPORT_STATUS_BADGE[product.exportStatus]}`}>
                                  {product.exportStatus}
                                </div>
                              </td>
                            ) : null}
                            {visibleColumns.category ? (
                              <td className="truncate whitespace-nowrap px-4 py-3.5 text-white/50 text-xs min-w-0 max-w-[120px]">{product.categoryId || '-'}</td>
                            ) : null}
                            {visibleColumns.brand ? (
                              <td className="truncate whitespace-nowrap px-4 py-3.5 text-white/50 text-xs min-w-0 max-w-[120px]">{product.brandId || '-'}</td>
                            ) : null}
                            {visibleColumns.tags ? (
                              <td className="px-4 py-3.5 min-w-0 max-w-[160px]">
                                <div className="flex flex-wrap gap-1.5 overflow-hidden">
                                  {product.tags.length > 0 ? (
                                    product.tags.slice(0, 2).map(tag => (
                                      <span key={tag} className="truncate max-w-full rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-white/20">-</span>
                                  )}
                                  {product.tags.length > 2 && (
                                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/40">+{product.tags.length - 2}</span>
                                  )}
                                </div>
                              </td>
                            ) : null}
                            {visibleColumns.updatedAt ? (
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-white/40">{formatDate(product.updatedAt)}</td>
                            ) : null}
                            <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={event => event.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                  to={`/products/${product.id}`}
                                  className="p-1.5 text-white/50 hover:text-brand-300 hover:bg-brand-500/10 rounded-lg transition"
                                  title="View Details"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => void handleDelete(product.id)}
                                  disabled={deleting}
                                  className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                                  title="Delete Product"
                                >
                                  {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Preview Drawer */}
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: previewProduct ? 0 : 400, opacity: previewProduct ? 1 : 0 }}
          className="absolute right-0 top-0 bottom-0 w-[360px] bg-[#0d0f17]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 flex flex-col"
        >
          {previewProduct ? (
            <>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="font-semibold text-white">{t('product.list.quickPreview')}</h3>
                <button onClick={() => setPreviewProductId('')} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Hero Info */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-white/50">{previewProduct.skuCode}</span>
                    <StatusBadge status={previewProduct.status} />
                  </div>
                  <h2 className="text-xl font-bold text-white/90 leading-tight">{previewProduct.title}</h2>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-white/40 mb-1">{t('product.list.preview.assets')}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{previewProduct.assetsCount}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                        previewProduct.assetStatus === 'ready' ? 'bg-emerald-400/10 text-emerald-400' :
                        previewProduct.assetStatus === 'partial' ? 'bg-amber-400/10 text-amber-400' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {previewProduct.assetStatus}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-white/40 mb-1">{t('product.list.preview.listings')}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{previewProduct.listingVersionsCount}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                        previewProduct.listingStatus === 'ready' ? 'bg-emerald-400/10 text-emerald-400' :
                        previewProduct.listingStatus === 'partial' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {previewProduct.listingStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm text-white/40">{t('product.list.preview.category')}</span>
                    <span className="text-sm font-medium text-white/80">{previewProduct.categoryId || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm text-white/40">{t('product.list.preview.brand')}</span>
                    <span className="text-sm font-medium text-white/80">{previewProduct.brandId || '-'}</span>
                  </div>
                  <div className="py-3 border-b border-white/5">
                    <span className="block text-sm text-white/40 mb-3">{t('product.list.preview.tags')}</span>
                    <div className="flex flex-wrap gap-2">
                      {previewProduct.tags.length > 0 ? (
                        previewProduct.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 rounded bg-brand-500/10 text-brand-300 text-xs font-medium border border-brand-500/20">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/20">{t('product.list.preview.noTags')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-white/10 bg-[#0a0a12] space-y-3">
                <Link
                  to={`/products/${previewProduct.id}/ai/ai-product`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 shadow-[0_0_20px_rgba(var(--brand-500),0.2)]"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('product.list.preview.visualWorkspace')}
                </Link>
                <Link
                  to={`/products/${previewProduct.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {t('product.list.preview.fullDetails')}
                </Link>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>

      {showCreateModal ? (
        <ModalShell title={t('product.list.createModal.title')} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.skuCode')}>
                <input
                  type="text"
                  value={createForm.skuCode}
                  onChange={event => setCreateForm(prev => ({ ...prev, skuCode: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  placeholder={t('product.list.createModal.skuPlaceholder')}
                />
              </Field>
              <Field label={t('product.list.createModal.currency')}>
                <select
                  value={createForm.costCurrency}
                  onChange={event => setCreateForm(prev => ({ ...prev, costCurrency: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
            </div>

            <Field label={t('product.list.createModal.productTitle')}>
              <input
                type="text"
                value={createForm.title}
                onChange={event => setCreateForm(prev => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                placeholder={t('product.list.createModal.titlePlaceholder')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.category')}>
                <input
                  type="text"
                  value={createForm.categoryId}
                  onChange={event => setCreateForm(prev => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  placeholder={t('product.list.createModal.categoryPlaceholder')}
                />
              </Field>
              <Field label={t('product.list.createModal.brand')}>
                <input
                  type="text"
                  value={createForm.brandId}
                  onChange={event => setCreateForm(prev => ({ ...prev, brandId: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                  placeholder={t('product.list.createModal.brandPlaceholder')}
                />
              </Field>
            </div>

            <Field label={t('product.list.createModal.tags')}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createForm.newTag}
                    onChange={event => setCreateForm(prev => ({ ...prev, newTag: event.target.value }))}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addTag()
                      }
                    }}
                    className="flex-1 rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
                    placeholder={t('product.list.createModal.addTagPlaceholder')}
                  />
                  <button
                    onClick={addTag}
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    {t('product.list.createModal.add')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {createForm.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                      {tag}
                      <button onClick={() => setCreateForm(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Field>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
            >
              {t('product.list.createModal.cancel')}
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={!createForm.skuCode.trim() || !createForm.title.trim()}
              className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >{t('product.list.create')}</button>
          </div>
        </ModalShell>
      ) : null}

      {showImportModal ? (
        <ModalShell title={t('product.list.importModal.title')} onClose={() => setShowImportModal(false)} size="xl">
          <div className="space-y-5">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-white">{t('product.list.importModal.subtitle')}</div>
                  <div className="mt-1 text-sm text-white/45">
                    {t('product.list.importModal.description')}{IMPORT_TEMPLATE_HEADERS.join(', ')}.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={downloadImportTemplate}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                    {t('product.list.importModal.downloadTemplate')}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t('product.list.importModal.chooseFile')}
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) {
                    void handleImportFile(file)
                  }
                }}
              />
            </div>

            {parsingImport ? (
              <div className="flex items-center justify-center py-14">
                <LoaderCircle className="h-7 w-7 animate-spin text-brand-400" />
              </div>
            ) : importRows.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-12 text-center text-sm text-white/40">
                {t('product.list.importModal.uploadPrompt')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/55">
                    {importRows.length} {t('product.list.importModal.rowsParsed')}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    {importRows.filter(isImportRowValid).length} {t('product.list.importModal.valid')}
                  </span>
                  {importRows.some(row => getImportRowErrors(row).length > 0) ? (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      {importRows.filter(row => getImportRowErrors(row).length > 0).length} {t('product.list.importModal.withErrors')}
                    </span>
                  ) : null}
                </div>

                <div className="max-h-[420px] overflow-auto rounded-md border border-white/[0.06]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-white/50">
                      <tr>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.line')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.sku')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.title')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.category')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.brand')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.tags')}</th>
                        <th className="px-4 py-3">{t('product.list.importModal.columns.errors')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map(row => (
                        <tr key={`${row.lineNo}-${row.skuCode}-${row.title}`} className="border-t border-white/[0.06]">
                          <td className="px-4 py-3 text-white/55">{row.lineNo}</td>
                          <td className="px-4 py-3 text-white">{row.skuCode || '-'}</td>
                          <td className="px-4 py-3 text-white">{row.title || '-'}</td>
                          <td className="px-4 py-3 text-white/65">{row.categoryId || '-'}</td>
                          <td className="px-4 py-3 text-white/65">{row.brandId || '-'}</td>
                          <td className="px-4 py-3 text-white/65">{row.tags.join(', ') || '-'}</td>
                          <td className="px-4 py-3">
                            {getImportRowErrors(row).length === 0 ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{t('product.list.importModal.valid')}</span>
                            ) : (
                              <div className="space-y-1">
                                {getImportRowErrors(row).map(error => (
                                  <div key={error} className="text-xs text-amber-300">{error}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setImportRows([])
                setShowImportModal(false)
              }}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
            >
              {t('product.list.importModal.close')}
            </button>
            <button
              onClick={() => void handleImportSubmit()}
              disabled={importRows.filter(isImportRowValid).length === 0 || importing}
              className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? t('product.list.importModal.importing') : t('product.list.importModal.importValidRows')}
            </button>
          </div>
        </ModalShell>
      ) : null}
    </motion.div>
  )
}

export default ProductListPage



function ModalShell({
  title,
  onClose,
  size = 'md',
  children,
}: {
  title: string
  onClose: () => void
  size?: 'md' | 'xl'
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`w-full rounded-xl border border-white/10 bg-[#0a0a12] ${size === 'xl' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-md border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm text-white/70">{label}</div>
      {children}
    </label>
  )
}
