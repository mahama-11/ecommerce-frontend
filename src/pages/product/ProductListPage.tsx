import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, LoaderCircle, Plus, Search, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import { Button, ButtonLink } from '@/components/ui/Button'
import type { ProductListItem } from '@/types/product'
import { createProduct, listProducts } from '@/services/product'
import type { MissionStage } from './utils/productMission'
import { deriveMissionWorkUnit, buildProductionRail } from './utils/productMission'
import { ProductHeroStage, ProductAssetStrip, WorkflowProgressRail, ResultDestinationCard } from '@/components/product-composition'

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

const INITIAL_CREATE_FORM: ProductCreateForm = {
  skuCode: '',
  title: '',
  categoryId: '',
  brandId: '',
  costCurrency: 'USD',
  tags: [],
  newTag: '',
}

const SKU_PAGE_SIZE = 10

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
      if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim()
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

function ProductListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusedProductQuery = searchParams.get('productId') || ''
  const { showToast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [keyword, setKeyword] = useState('')
  const [activeStage, setActiveStage] = useState<MissionStage | 'all'>('all')
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [focusedProductId, setFocusedProductId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [createForm, setCreateForm] = useState<ProductCreateForm>(INITIAL_CREATE_FORM)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [parsingImport, setParsingImport] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    void loadProducts()
  }, [focusedProductQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeStage, keyword])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowCommandPalette(true)
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false)
        setShowPreviewDrawer(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await listProducts()
      setProducts(data)
      setSelectedIds(current => current.filter(id => data.some(item => item.id === id)))
      setFocusedProductId(current => {
        if (focusedProductQuery && data.some(item => item.id === focusedProductQuery)) return focusedProductQuery
        return current && data.some(item => item.id === current) ? current : data[0]?.id ?? ''
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


  function addTag() {
    const nextTag = createForm.newTag.trim()
    if (nextTag && !createForm.tags.includes(nextTag)) setCreateForm(prev => ({ ...prev, tags: [...prev.tags, nextTag], newTag: '' }))
  }

  function toggleSelect(productId: string) {
    setSelectedIds(current => (current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId]))
  }

  function visualProductionHref(productId: string) {
    return `/products/${encodeURIComponent(productId)}/production/prep`
  }

  function productCenterFocusHref(productId: string) {
    return `/products?productId=${encodeURIComponent(productId)}&source=sku-queue`
  }

  function focusProductCenter(productId: string) {
    setFocusedProductId(productId)
    window.requestAnimationFrame(() => {
      document.getElementById('product-center-overview')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
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
      if (normalized.length === 0) showToast('No rows found in the spreadsheet.', 'error')
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
    showToast(`Imported ${succeeded} products, ${failedRows.length} failed.`, 'error')
  }

  function downloadImportTemplate() {
    void (async () => {
      const XLSX = await loadXLSX()
      const worksheet = XLSX.utils.json_to_sheet([{ skuCode: 'SKU-10001', title: 'Example Product', categoryId: 'home', brandId: 'brand-a', tags: 'kitchen,storage', costCurrency: 'USD' }])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'products')
      XLSX.writeFile(workbook, 'product-import-template.xlsx')
    })()
  }

  const missionUnits = useMemo(() => products.map(deriveMissionWorkUnit), [products])
  const productionRail = useMemo(() => buildProductionRail(products), [products])
  const filteredUnits = useMemo(() => {
    let result = missionUnits
    if (activeStage !== 'all') result = result.filter(unit => unit.stage === activeStage)
    const q = keyword.trim().toLowerCase()
    if (q) {
      result = result.filter(unit => {
        const product = unit.product
        return product.title.toLowerCase().includes(q)
          || product.skuCode.toLowerCase().includes(q)
          || (product.categoryId || '').toLowerCase().includes(q)
          || (product.brandId || '').toLowerCase().includes(q)
          || product.tags.some(tag => tag.toLowerCase().includes(q))
      })
    }
    return [...result].sort((a, b) => a.stageIndex - b.stageIndex || b.healthScore - a.healthScore)
  }, [activeStage, keyword, missionUnits])

  const focusedUnit = missionUnits.find(unit => unit.product.id === focusedProductId) ?? filteredUnits[0] ?? missionUnits[0] ?? null
  const visualTodoCount = missionUnits.filter(unit => unit.stage === 'visual').length
  const listingTodoCount = missionUnits.filter(unit => unit.stage === 'listing').length
  const deliveryReadyCount = missionUnits.filter(unit => unit.stage === 'delivery' || unit.product.exportStatus === 'ready' || unit.product.exportStatus === 'done').length
  const selectedUnits = missionUnits.filter(unit => selectedIds.includes(unit.product.id))
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / SKU_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * SKU_PAGE_SIZE
  const pageEnd = Math.min(filteredUnits.length, pageStart + SKU_PAGE_SIZE)
  const visibleUnits = filteredUnits.slice(pageStart, pageEnd)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } } }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" data-page-shell="workspace-home" className="relative min-h-full bg-[var(--ecom-bg)] text-[var(--ecom-text-primary)]">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-10">
        <motion.header id="product-center-overview" variants={itemVariants} className="mb-5">
          <ProductHeroStage
            eyebrow="Workspace Home · SKU Business Entry"
            title="商品队列工作台"
            description="从这里判断当前 SKU 该先补素材、进入视觉生产、完善 Listing，还是交付导出；它是业务入口，不是单纯 SKU 表格。"
            objectLabel="当前聚焦 SKU"
            objectValue={focusedUnit ? `${focusedUnit.product.skuCode} · ${focusedUnit.product.title}` : '等待 SKU 数据'}
            primaryAction={{ label: '新建 SKU', onClick: () => setShowCreateModal(true) }}
            secondary={<Button onClick={() => setShowImportModal(true)} variant="secondary" className="rounded-2xl px-5 py-3 text-sm"><Upload className="h-4 w-4" />导入表格</Button>}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <WorkflowProgressRail
                steps={productionRail.slice(0, 4).map(item => ({
                  label: item.label,
                  desc: `${item.count} 个 SKU · ${item.blocked} 个待处理`,
                  status: item.stage === (focusedUnit?.stage ?? 'visual') ? 'active' : item.count > 0 ? 'done' : 'locked',
                }))}
              />
              <ProductAssetStrip
                assets={[
                  { label: '待视觉生产', desc: `${visualTodoCount} 个 SKU 需要补素材/主图`, status: visualTodoCount ? 'needed' : 'ready' },
                  { label: '待 Listing', desc: `${listingTodoCount} 个 SKU 需要文案/版本`, status: listingTodoCount ? 'needed' : 'ready' },
                  { label: '可交付', desc: `${deliveryReadyCount} 个 SKU 已进入交付`, status: deliveryReadyCount ? 'ready' : 'optional' },
                ]}
              />
            </div>
          </ProductHeroStage>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ResultDestinationCard title="当前业务状态" description={`${products.length} 个 SKU，${filteredUnits.length} 个在当前筛选中。`} />
            <ResultDestinationCard title="推荐下一步" description={focusedUnit?.nextBestAction.helper ?? '先创建或导入 SKU。'} />
            <ResultDestinationCard title="结果去向" description="视觉结果回写 SKU.assets，Listing 进入模板中心，导出进入交付中心。" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setShowCreateModal(true)} variant="primary"><Plus className="h-4 w-4" />新建 SKU</Button>
            <Button onClick={() => setShowImportModal(true)} variant="secondary"><Upload className="h-4 w-4" />导入表格</Button>
            <Button onClick={() => setShowPreviewDrawer(true)} variant="secondary">快速预览</Button>
          </div>
        </motion.header>


        <motion.div variants={itemVariants} className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索 SKU / 标题 / 标签..." className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 placeholder:text-white/30 focus:border-cyan-300/35" />
          </div>
          {[
            ['all', '全部'],
            ['visual', '待素材/生产准备'],
            ['listing', '待 Listing'],
            ['export', '待导出'],
            ['delivery', '交付中心'],
          ].map(([stage, label]) => (
            <Button key={stage} onClick={() => setActiveStage(stage as MissionStage | 'all')} variant={activeStage === stage ? 'primary' : 'quiet'} size="sm" className="rounded-full">{label}</Button>
          ))}
        </motion.div>

        <motion.section variants={itemVariants} className="mb-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">
            <span>SKU 工作队列 — {filteredUnits.length} 个活跃</span>
            {filteredUnits.length > SKU_PAGE_SIZE ? <span data-testid="sku-pagination-summary">第 {safeCurrentPage} / {totalPages} 页 · 当前 {pageStart + 1}-{pageEnd}</span> : null}
          </div>
          <div data-testid="sku-list-panel" className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[var(--ecom-surface)] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)_minmax(0,1.35fr)_minmax(64px,0.45fr)_minmax(72px,0.5fr)_minmax(64px,0.45fr)_minmax(64px,0.45fr)_minmax(220px,1.05fr)] border-b border-white/[0.06] bg-[var(--ecom-surface)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/34 max-xl:hidden">
              <div>SKU</div><div>标题 / 类目</div><div>真实就绪项</div><div>素材</div><div>Listing</div><div>导出</div><div>更新时间</div><div>操作</div>
            </div>
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-cyan-200" /></div>
            ) : filteredUnits.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center text-sm text-white/40">没有匹配的 SKU。</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {visibleUnits.map(unit => {
                  const product = unit.product
                  const focused = focusedUnit?.product.id === product.id
                  const selected = selectedIds.includes(product.id)
                  return (
                    <div key={product.id} role="button" tabIndex={0} onClick={() => navigate(`/products/${product.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') navigate(`/products/${product.id}`) }} className={`grid cursor-pointer gap-3 px-3 py-3 text-sm transition max-xl:grid-cols-1 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)_minmax(0,1.35fr)_minmax(64px,0.45fr)_minmax(72px,0.5fr)_minmax(64px,0.45fr)_minmax(64px,0.45fr)_minmax(220px,1.05fr)] xl:items-center ${focused ? 'bg-cyan-300/[0.075]' : 'hover:bg-[var(--ecom-surface-hover)]'} ${selected ? 'outline outline-1 outline-cyan-300/30' : ''}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <input type="checkbox" checked={selected} onClick={event => event.stopPropagation()} onChange={() => { setFocusedProductId(product.id); toggleSelect(product.id) }} className="shrink-0 rounded border-white/20 bg-black/30 accent-cyan-300" />
                        <Link to={`/products/${product.id}`} onClick={event => event.stopPropagation()} title={product.skuCode} className="min-w-0 truncate font-mono text-xs text-cyan-100/82 underline-offset-4 transition hover:text-white hover:underline">{product.skuCode}</Link>
                      </div>
                      <div className="min-w-0 overflow-hidden"><Link to={`/products/${product.id}`} onClick={event => event.stopPropagation()} title={product.title} className="block truncate font-semibold text-white/90 underline-offset-4 transition hover:text-cyan-100 hover:underline">{product.title}</Link><div className="mt-0.5 truncate text-xs text-white/40">{product.categoryId || 'Uncategorized'} / {product.brandId || 'No brand'}</div></div>
                      <div className="min-w-0 overflow-hidden"><div className="flex flex-wrap gap-1.5">{unit.readiness.slice(0, 4).map(item => <QueueTag key={item.key} label={item.label.replace('SKU.assets', '素材').replace('Listing Station', 'Listing').replace('Export package', '导出包')} tone={item.state === 'available' ? 'green' : item.state === 'partial' ? 'orange' : item.state === 'contract-needed' ? 'orange' : item.state === 'blocked' ? 'red' : 'muted'} />)}</div></div>
                      <QueueTag label={product.assetStatus === 'ready' ? `完整(${product.assetsCount})` : product.assetsCount > 0 ? `部分(${product.assetsCount})` : '缺失'} tone={product.assetStatus === 'ready' ? 'green' : product.assetsCount > 0 ? 'orange' : 'red'} />
                      <QueueTag label={product.listingStatus === 'ready' ? '已采用' : product.listingStatus === 'partial' ? '草稿' : '缺失'} tone={product.listingStatus === 'ready' ? 'green' : product.listingStatus === 'partial' ? 'orange' : 'red'} />
                      <QueueTag label={product.exportStatus === 'done' ? '已完成' : product.exportStatus === 'ready' ? '可交付' : '待导出'} tone={product.exportStatus === 'done' || product.exportStatus === 'ready' ? 'green' : 'red'} />
                      <div className="text-xs text-white/38">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</div>
                      <div className="flex flex-wrap gap-1.5 xl:flex-nowrap">
                        <ButtonLink to={`/products/${product.id}`} onClick={event => event.stopPropagation()} variant="primary" size="sm" className="px-2.5">详情</ButtonLink>
                        <ButtonLink to={visualProductionHref(product.id)} onClick={event => event.stopPropagation()} variant="secondary" size="sm" className="px-2.5">进入视觉生产</ButtonLink>
                        <ButtonLink to={productCenterFocusHref(product.id)} onClick={event => { event.stopPropagation(); focusProductCenter(product.id) }} variant="quiet" size="sm" className="px-2.5">进入产品中心</ButtonLink>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {!loading && filteredUnits.length > SKU_PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/45">
                <span data-testid="sku-pagination-range">显示 {pageStart + 1}-{pageEnd} / {filteredUnits.length} 个 SKU</span>
                <div className="flex items-center gap-2" data-testid="sku-pagination-controls">
                  <Button
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    variant="quiet"
                    size="sm"
                  >
                    上一页
                  </Button>
                  <span className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-1.5 text-white/55">{safeCurrentPage} / {totalPages}</span>
                  <Button
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    variant="quiet"
                    size="sm"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="mb-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">模板中心交接（选中后激活）</div>
          <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-white/[0.06] bg-[var(--ecom-surface)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.42)]">
            <span className="text-sm text-white/50">已选 {selectedUnits.length} 个 SKU</span>
            <Button disabled variant="quiet" size="sm">应用模板</Button>
            <ButtonLink to={selectedUnits.length ? `/products/workbench/downloads?productIds=${encodeURIComponent(selectedUnits.map(unit => unit.product.id).join(','))}&source=product-center` : '#'} variant="secondary" size="sm" className={selectedUnits.length ? '' : 'pointer-events-none opacity-45'}>查看交付历史</ButtonLink>
            <span className="text-xs text-white/34">未开放的模板动作会保持不可点击。</span>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">工作站点</div>
          <div className="grid gap-3 md:grid-cols-3">
            <StationCard code="SKU" title="商品队列" desc="按 SKU 判断素材、Listing、导出状态和下一步动作" status="business queue" tone="info" href={focusedUnit ? productCenterFocusHref(focusedUnit.product.id) : '/products'} />
            <StationCard code="VISUAL" title="视觉生产" desc="带着当前 SKU 进入视觉任务工作台" status="SKU.assets" tone="info" href={focusedUnit ? visualProductionHref(focusedUnit.product.id) : '/products/workbench/visual-tools'} />
            <StationCard code="DONE" title="交付中心" desc="历史已完成生成的任务、导出记录与下载追踪" status="completed history" tone="ready" href={focusedUnit ? `/products/workbench/downloads?productIds=${encodeURIComponent(focusedUnit.product.id)}&source=product-center` : '/products/workbench/downloads'} />
          </div>
        </motion.section>
      </div>

      {showCommandPalette ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-md" role="button" tabIndex={-1} aria-label="关闭命令面板" onClick={() => setShowCommandPalette(false)} onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') setShowCommandPalette(false) }}>
          <div className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[var(--ecom-surface)] shadow-[0_28px_90px_rgba(0,0,0,0.65)]" role="presentation" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"><Search className="h-4 w-4 text-white/35" /><input autoFocus placeholder="搜索命令、SKU、站点..." className="flex-1 bg-transparent text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 placeholder:text-white/32" /><span className="text-xs text-white/28">ESC</span></div>
            <div className="p-2 text-sm">{['商品队列 ⌘1', '视觉生产 ⌘2', '模板中心 ⌘3', '交付中心 ⌘4'].map(item => <div key={item} className="rounded-xl px-3 py-2 text-white/70 hover:bg-[var(--ecom-surface-hover)]">{item}</div>)}</div>
          </div>
        </div>
      ) : null}

      {showPreviewDrawer && focusedUnit ? (
        <div className="fixed inset-0 z-40 bg-black/40" role="button" tabIndex={-1} aria-label="关闭预览抽屉" onClick={() => setShowPreviewDrawer(false)} onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') setShowPreviewDrawer(false) }}>
          <aside className="ml-auto h-full w-full max-w-md border-l border-white/10 bg-[var(--ecom-surface)] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.65)]" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
            <Button className="float-right" size="icon-sm" variant="quiet" aria-label="关闭预览" onClick={() => setShowPreviewDrawer(false)}>x</Button>
            <h3 className="text-lg font-semibold text-white">{focusedUnit.product.skuCode}</h3>
            <p className="mt-1 text-sm text-white/55">{focusedUnit.product.title}</p>
            <div className="mt-5 space-y-4">
              <div><h4 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/35">READINESS 维度</h4><div className="flex flex-wrap gap-2">{focusedUnit.readiness.map(item => <QueueTag key={item.key} label={item.label} tone={item.state === 'available' ? 'green' : item.state === 'partial' ? 'orange' : item.state === 'blocked' ? 'red' : 'orange'} />)}</div></div>
              <div><h4 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/35">下一步动作</h4><p className="text-sm text-white/55">{focusedUnit.nextBestAction.helper}</p></div>
            </div>
            <div className="mt-6 flex gap-2"><Button onClick={() => setShowPreviewDrawer(false)} variant="secondary">关闭</Button><ButtonLink to={`/products/${focusedUnit.product.id}`} variant="primary">进入 SKU 详情</ButtonLink></div>
          </aside>
        </div>
      ) : null}

      {showCreateModal ? (
        <ModalShell title={t('product.list.createModal.title')} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.skuCode')}>
                <input type="text" value={createForm.skuCode} onChange={event => setCreateForm(prev => ({ ...prev, skuCode: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" placeholder={t('product.list.createModal.skuPlaceholder')} />
              </Field>
              <Field label={t('product.list.createModal.currency')}>
                <select value={createForm.costCurrency} onChange={event => setCreateForm(prev => ({ ...prev, costCurrency: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20">
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
            </div>
            <Field label={t('product.list.createModal.productTitle')}>
              <input type="text" value={createForm.title} onChange={event => setCreateForm(prev => ({ ...prev, title: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" placeholder={t('product.list.createModal.titlePlaceholder')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.category')}>
                <input type="text" value={createForm.categoryId} onChange={event => setCreateForm(prev => ({ ...prev, categoryId: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" placeholder={t('product.list.createModal.categoryPlaceholder')} />
              </Field>
              <Field label={t('product.list.createModal.brand')}>
                <input type="text" value={createForm.brandId} onChange={event => setCreateForm(prev => ({ ...prev, brandId: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" placeholder={t('product.list.createModal.brandPlaceholder')} />
              </Field>
            </div>
            <Field label={t('product.list.createModal.tags')}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="text" value={createForm.newTag} onChange={event => setCreateForm(prev => ({ ...prev, newTag: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} className="flex-1 rounded-md border border-white/10 bg-[var(--ecom-bg)] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" placeholder={t('product.list.createModal.addTagPlaceholder')} />
                  <Button onClick={addTag} variant="secondary">{t('product.list.createModal.add')}</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {createForm.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                      {tag}
                      <Button onClick={() => setCreateForm(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))} size="icon-sm" variant="ghost" aria-label={`Remove ${tag}`}><X className="h-3 w-3" /></Button>
                    </span>
                  ))}
                </div>
              </div>
            </Field>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setShowCreateModal(false)} className="flex-1" variant="secondary">{t('product.list.createModal.cancel')}</Button>
            <Button onClick={() => void handleCreate()} disabled={!createForm.skuCode.trim() || !createForm.title.trim()} className="flex-1" variant="primary">{t('product.list.create')}</Button>
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
                  <div className="mt-1 text-sm text-white/45">{t('product.list.importModal.description')}{IMPORT_TEMPLATE_HEADERS.join(', ')}.</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={downloadImportTemplate} variant="secondary"><Download className="h-4 w-4" />{t('product.list.importModal.downloadTemplate')}</Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="primary"><FileSpreadsheet className="h-4 w-4" />{t('product.list.importModal.chooseFile')}</Button>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void handleImportFile(file) }} />
            </div>

            {parsingImport ? (
              <div className="flex items-center justify-center py-14"><LoaderCircle className="h-7 w-7 animate-spin text-brand-400" /></div>
            ) : importRows.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-12 text-center text-sm text-white/40">{t('product.list.importModal.uploadPrompt')}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/55">{importRows.length} {t('product.list.importModal.rowsParsed')}</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{importRows.filter(isImportRowValid).length} {t('product.list.importModal.valid')}</span>
                  {importRows.some(row => getImportRowErrors(row).length > 0) ? <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">{importRows.filter(row => getImportRowErrors(row).length > 0).length} {t('product.list.importModal.withErrors')}</span> : null}
                </div>
                <div className="max-h-[420px] overflow-auto rounded-md border border-white/[0.06]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-white/50"><tr><th className="px-4 py-3">{t('product.list.importModal.columns.line')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.sku')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.title')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.category')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.brand')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.tags')}</th><th className="px-4 py-3">{t('product.list.importModal.columns.errors')}</th></tr></thead>
                    <tbody>{importRows.map(row => <tr key={`${row.lineNo}-${row.skuCode}-${row.title}`} className="border-t border-white/[0.06]"><td className="px-4 py-3 text-white/55">{row.lineNo}</td><td className="px-4 py-3 text-white">{row.skuCode || '-'}</td><td className="px-4 py-3 text-white">{row.title || '-'}</td><td className="px-4 py-3 text-white/65">{row.categoryId || '-'}</td><td className="px-4 py-3 text-white/65">{row.brandId || '-'}</td><td className="px-4 py-3 text-white/65">{row.tags.join(', ') || '-'}</td><td className="px-4 py-3">{getImportRowErrors(row).length === 0 ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{t('product.list.importModal.valid')}</span> : <div className="space-y-1">{getImportRowErrors(row).map(error => <div key={error} className="text-xs text-amber-300">{error}</div>)}</div>}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setImportRows([]); setShowImportModal(false) }} className="flex-1" variant="secondary">{t('product.list.importModal.close')}</Button>
            <Button onClick={() => void handleImportSubmit()} disabled={importRows.filter(isImportRowValid).length === 0 || importing} className="flex-1" variant="primary">{importing ? t('product.list.importModal.importing') : t('product.list.importModal.importValidRows')}</Button>
          </div>
        </ModalShell>
      ) : null}
    </motion.div>
  )
}

export default ProductListPage

function QueueTag({ label, tone = 'muted' }: { label: string; tone?: 'green' | 'orange' | 'red' | 'cyan' | 'muted' }) {
  const cls = tone === 'green'
    ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-200'
    : tone === 'orange'
      ? 'border-amber-300/30 bg-amber-300/12 text-amber-200'
      : tone === 'red'
        ? 'border-rose-300/30 bg-rose-300/12 text-rose-200'
        : tone === 'cyan'
          ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-100'
          : 'border-white/[0.08] bg-white/[0.045] text-white/55'
  return <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
}

function StationCard({ code, title, desc, status, tone, href }: { code: string; title: string; desc: string; status: string; tone: 'info' | 'draft' | 'blocked' | 'ready'; href: string }) {
  const statusClass = tone === 'ready'
    ? 'bg-emerald-300/12 text-emerald-200'
    : tone === 'draft'
      ? 'bg-amber-300/12 text-amber-200'
      : tone === 'blocked'
        ? 'bg-rose-300/12 text-rose-200'
        : 'bg-cyan-300/12 text-cyan-100'
  return (
    <Link to={href} className="group flex min-h-[150px] flex-col gap-3 rounded-[28px] border border-white/[0.06] bg-[var(--ecom-surface)] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.42)] transition hover:border-white/12 hover:bg-[var(--ecom-surface-hover)]">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/18 bg-cyan-300/10 text-[11px] font-bold tracking-[0.08em] text-cyan-100">{code}</div>
      <div>
        <div className="font-semibold text-white/90">{title}</div>
        <div className="mt-1 text-[13px] leading-5 text-white/48">{desc}</div>
      </div>
      <div className={`mt-auto w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>{status}</div>
    </Link>
  )
}

function ModalShell({ title, onClose, size = 'md', children }: { title: string; onClose: () => void; size?: 'md' | 'xl'; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className={`w-full rounded-xl border border-white/10 bg-[var(--ecom-bg)] ${size === 'xl' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 id="product-modal-title" className="text-xl font-semibold text-white">{title}</h2>
          <Button onClick={onClose} aria-label="Close modal" size="icon-sm" variant="quiet"><X className="h-4 w-4" /></Button>
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
