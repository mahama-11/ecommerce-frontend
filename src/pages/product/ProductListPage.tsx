import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, LoaderCircle, Plus, Search, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import type { ProductListItem } from '@/types/product'
import { createProduct, listProducts } from '@/services/product'
import { ProductWorkflowNav } from '@/components/product-workbench/ProductWorkflowNav'
import type { MissionStage } from './utils/productMission'
import { deriveMissionWorkUnit } from './utils/productMission'

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
  const [createForm, setCreateForm] = useState<ProductCreateForm>(INITIAL_CREATE_FORM)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [parsingImport, setParsingImport] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    void loadProducts()
  }, [])

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
      setFocusedProductId(current => (current && data.some(item => item.id === current) ? current : data[0]?.id ?? ''))
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
  const selectedUnits = missionUnits.filter(unit => selectedIds.includes(unit.product.id))

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } } }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative min-h-full bg-[#0a0a12] text-[#e8eaf0]">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-10">
        <motion.header variants={itemVariants} className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.65rem] font-bold tracking-[-0.03em] text-white">商品中心 / SKU 队列</h1>
            <p className="mt-1 text-[13px] text-white/55">Create/Import → Queue → SKU Detail → Visual/Video → Assets → Listing → Export → Downloads</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#05070b] transition hover:bg-white"><Plus className="h-4 w-4" />新建 SKU</button>
            <button onClick={() => setShowImportModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/[0.07]"><Upload className="h-4 w-4" />导入表格</button>
            <button onClick={() => setShowPreviewDrawer(true)} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/[0.07]">快速预览</button>
          </div>
        </motion.header>

        <motion.div variants={itemVariants} className="mb-4">
          <ProductWorkflowNav active="queue" productId={focusedUnit?.product.id} productIds={selectedIds} source="queue" />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索 SKU / 标题 / 标签..." className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/35" />
          </div>
          {[
            ['all', '全部'],
            ['production', '缺素材'],
            ['listing', '待 Listing'],
            ['export', '可导出'],
            ['delivery', '交付中心'],
          ].map(([stage, label]) => (
            <button key={stage} onClick={() => setActiveStage(stage as MissionStage | 'all')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeStage === stage ? 'border-cyan-300/40 bg-cyan-300/12 text-cyan-100' : 'border-white/[0.08] bg-white/[0.035] text-white/50 hover:text-white/75'}`}>{label}</button>
          ))}
        </motion.div>

        <motion.section variants={itemVariants} className="mb-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">SKU 工作队列 — {filteredUnits.length} 个活跃</div>
          <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0d14] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.55fr)_minmax(72px,0.5fr)_minmax(80px,0.55fr)_minmax(72px,0.5fr)_minmax(72px,0.5fr)_minmax(150px,0.9fr)] border-b border-white/[0.06] bg-[#0b0d14] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/34 max-xl:hidden">
              <div>SKU</div><div>标题 / 类目</div><div>Readiness</div><div>素材</div><div>Listing</div><div>导出</div><div>更新时间</div><div>操作</div>
            </div>
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-cyan-200" /></div>
            ) : filteredUnits.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center text-sm text-white/40">没有匹配的 SKU。</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filteredUnits.slice(0, 8).map(unit => {
                  const product = unit.product
                  const focused = focusedUnit?.product.id === product.id
                  const selected = selectedIds.includes(product.id)
                  return (
                    <div key={product.id} onClick={() => navigate(`/products/${product.id}`)} className={`grid cursor-pointer gap-3 px-3 py-3 text-sm transition max-xl:grid-cols-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.55fr)_minmax(72px,0.5fr)_minmax(80px,0.55fr)_minmax(72px,0.5fr)_minmax(72px,0.5fr)_minmax(150px,0.9fr)] xl:items-center ${focused ? 'bg-cyan-300/[0.075]' : 'hover:bg-white/[0.025]'} ${selected ? 'outline outline-1 outline-cyan-300/30' : ''}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <input type="checkbox" checked={selected} onClick={event => event.stopPropagation()} onChange={() => { setFocusedProductId(product.id); toggleSelect(product.id) }} className="shrink-0 rounded border-white/20 bg-black/30 accent-cyan-300" />
                        <Link to={`/products/${product.id}`} onClick={event => event.stopPropagation()} title={product.skuCode} className="min-w-0 truncate font-mono text-xs text-cyan-100/82 underline-offset-4 transition hover:text-white hover:underline">{product.skuCode}</Link>
                      </div>
                      <div className="min-w-0 overflow-hidden"><Link to={`/products/${product.id}`} onClick={event => event.stopPropagation()} title={product.title} className="block truncate font-semibold text-white/90 underline-offset-4 transition hover:text-cyan-100 hover:underline">{product.title}</Link><div className="mt-0.5 truncate text-xs text-white/40">{product.categoryId || 'Uncategorized'} / {product.brandId || 'No brand'}</div></div>
                      <div className="min-w-0 overflow-hidden"><div className="flex flex-wrap gap-1.5">{unit.readiness.slice(0, 4).map(item => <QueueTag key={item.key} label={item.label.replace('Template/Prompt Lineage', 'Info').replace('SKU.assets', 'Assets').replace('Listing Station', 'Listing').replace('Delivery Downloadability', 'Export')} tone={item.state === 'available' ? 'green' : item.state === 'partial' ? 'orange' : item.state === 'contract-needed' ? 'orange' : item.state === 'blocked' ? 'red' : 'muted'} />)}</div></div>
                      <QueueTag label={`${product.assetsCount}/5`} tone={product.assetStatus === 'ready' ? 'green' : product.assetsCount > 0 ? 'orange' : 'red'} />
                      <QueueTag label={product.listingStatus === 'ready' ? 'Adopted' : product.listingStatus === 'partial' ? 'Draft' : 'Missing'} tone={product.listingStatus === 'ready' ? 'green' : product.listingStatus === 'partial' ? 'orange' : 'red'} />
                      <QueueTag label={product.exportStatus === 'done' ? 'Done' : product.exportStatus === 'ready' ? 'Ready' : 'Pending'} tone={product.exportStatus === 'done' || product.exportStatus === 'ready' ? 'green' : 'red'} />
                      <div className="text-xs text-white/38">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <Link to={`/products/${product.id}`} onClick={event => event.stopPropagation()} className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#05070b] transition hover:bg-cyan-100">详情</Link>
                        <Link to={unit.nextBestAction.href} onClick={event => event.stopPropagation()} className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${unit.nextBestAction.station === 'visual' || unit.nextBestAction.station === 'listing' ? 'bg-cyan-200 text-[#05070b] hover:bg-white' : 'border border-white/[0.08] bg-white/[0.04] text-white/72 hover:bg-white/[0.08]'}`}>{unit.nextBestAction.label.replace('Route to Visual Station', '进入生产线').replace('Route to Listing Station', '生成 Listing').replace('Route to Delivery Station', '查看下载').replace('Open Export Handoff', '创建导出任务')}</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="mb-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">批量操作栏（选中后激活）</div>
          <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-white/[0.06] bg-[#0b0d14] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.42)]">
            <span className="text-sm text-white/50">已选 {selectedUnits.length} 个 SKU</span>
            <Link to={selectedUnits.length ? `/products/workbench/batch-listing?productIds=${encodeURIComponent(selectedUnits.map(unit => unit.product.id).join(','))}&source=product-center` : '#'} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${selectedUnits.length ? 'border-white/[0.08] bg-white/[0.04] text-white/75 hover:bg-white/[0.08]' : 'pointer-events-none border-white/[0.05] bg-white/[0.02] text-white/25'}`}>批量生成 Listing</Link>
            <button disabled className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/25">批量 Adopt</button>
            <Link to={selectedUnits.length ? `/products/workbench/downloads?productIds=${encodeURIComponent(selectedUnits.map(unit => unit.product.id).join(','))}&source=product-center` : '#'} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${selectedUnits.length ? 'border-white/[0.08] bg-white/[0.04] text-white/75 hover:bg-white/[0.08]' : 'pointer-events-none border-white/[0.05] bg-white/[0.02] text-white/25'}`}>批量导出</Link>
            <Link to={selectedUnits[0] ? `/products/${selectedUnits[0].product.id}/production/prep` : '#'} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${selectedUnits.length ? 'border-white/[0.08] bg-white/[0.04] text-white/75 hover:bg-white/[0.08]' : 'pointer-events-none border-white/[0.05] bg-white/[0.02] text-white/25'}`}>进入生产线</Link>
            <span className="text-xs text-white/34">真实后端未接的批量动作保持 disabled / contract-needed。</span>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">工作站点</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StationCard code="SKU" title="SKU 详情 / 生产中心" desc="基础信息、素材、Listing、利润、导出、状态总览" status="业务锚点页面" tone="info" href={focusedUnit ? `/products/${focusedUnit.product.id}` : '/products'} />
            <StationCard code="LST" title="批量 Listing" desc="选择 SKU → 配置模板 → 生成/预览 → 校验 → 创建版本 → Adopt/导出" status={`${products.reduce((sum, item) => sum + item.listingVersionsCount, 0)} versions live`} tone="draft" href={focusedUnit ? `/products/workbench/batch-listing?productIds=${encodeURIComponent(focusedUnit.product.id)}&source=product-center` : '/products/workbench/batch-listing'} />
            <StationCard code="PROD" title="AI 生产线" desc="Prep → Sandbox → Workshop：解析、执行、迭代" status="Intent-driven pipeline" tone="info" href={focusedUnit ? `/products/${focusedUnit.product.id}/production/prep` : '/products'} />
            <StationCard code="DLV" title="交付中心" desc="导出任务队列、下载追踪、包完整性校验" status="real DownloadRecord gate" tone="ready" href={focusedUnit ? `/products/workbench/downloads?productIds=${encodeURIComponent(focusedUnit.product.id)}&source=product-center` : '/products/workbench/downloads'} />
          </div>
        </motion.section>
      </div>

      {showCommandPalette ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-md" onClick={() => setShowCommandPalette(false)}>
          <div className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[#0b0d14] shadow-[0_28px_90px_rgba(0,0,0,0.65)]" onClick={event => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"><Search className="h-4 w-4 text-white/35" /><input autoFocus placeholder="搜索命令、SKU、站点..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32" /><span className="text-xs text-white/28">ESC</span></div>
            <div className="p-2 text-sm">{['商品队列 ⌘1', '批量 Listing ⌘2', '视觉工作区 ⌘3', '交付中心 ⌘4'].map(item => <div key={item} className="rounded-xl px-3 py-2 text-white/70 hover:bg-white/[0.05]">{item}</div>)}</div>
          </div>
        </div>
      ) : null}

      {showPreviewDrawer && focusedUnit ? (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowPreviewDrawer(false)}>
          <aside className="ml-auto h-full w-full max-w-md border-l border-white/10 bg-[#0b0d14] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.65)]" onClick={event => event.stopPropagation()}>
            <button className="float-right rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50" onClick={() => setShowPreviewDrawer(false)}>x</button>
            <h3 className="text-lg font-semibold text-white">{focusedUnit.product.skuCode}</h3>
            <p className="mt-1 text-sm text-white/55">{focusedUnit.product.title}</p>
            <div className="mt-5 space-y-4">
              <div><h4 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/35">READINESS 维度</h4><div className="flex flex-wrap gap-2">{focusedUnit.readiness.map(item => <QueueTag key={item.key} label={item.label} tone={item.state === 'available' ? 'green' : item.state === 'partial' ? 'orange' : item.state === 'blocked' ? 'red' : 'orange'} />)}</div></div>
              <div><h4 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/35">下一步动作</h4><p className="text-sm text-white/55">{focusedUnit.nextBestAction.helper}</p></div>
            </div>
            <div className="mt-6 flex gap-2"><button onClick={() => setShowPreviewDrawer(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70">关闭</button><Link to={`/products/${focusedUnit.product.id}`} className="rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#05070b]">进入 SKU 详情</Link></div>
          </aside>
        </div>
      ) : null}

      {showCreateModal ? (
        <ModalShell title={t('product.list.createModal.title')} onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.skuCode')}>
                <input type="text" value={createForm.skuCode} onChange={event => setCreateForm(prev => ({ ...prev, skuCode: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" placeholder={t('product.list.createModal.skuPlaceholder')} />
              </Field>
              <Field label={t('product.list.createModal.currency')}>
                <select value={createForm.costCurrency} onChange={event => setCreateForm(prev => ({ ...prev, costCurrency: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20">
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
            </div>
            <Field label={t('product.list.createModal.productTitle')}>
              <input type="text" value={createForm.title} onChange={event => setCreateForm(prev => ({ ...prev, title: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" placeholder={t('product.list.createModal.titlePlaceholder')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('product.list.createModal.category')}>
                <input type="text" value={createForm.categoryId} onChange={event => setCreateForm(prev => ({ ...prev, categoryId: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" placeholder={t('product.list.createModal.categoryPlaceholder')} />
              </Field>
              <Field label={t('product.list.createModal.brand')}>
                <input type="text" value={createForm.brandId} onChange={event => setCreateForm(prev => ({ ...prev, brandId: event.target.value }))} className="w-full rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" placeholder={t('product.list.createModal.brandPlaceholder')} />
              </Field>
            </div>
            <Field label={t('product.list.createModal.tags')}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="text" value={createForm.newTag} onChange={event => setCreateForm(prev => ({ ...prev, newTag: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} className="flex-1 rounded-md border border-white/10 bg-[#0a0a12] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20" placeholder={t('product.list.createModal.addTagPlaceholder')} />
                  <button onClick={addTag} className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10">{t('product.list.createModal.add')}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {createForm.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                      {tag}
                      <button onClick={() => setCreateForm(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </Field>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowCreateModal(false)} className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10">{t('product.list.createModal.cancel')}</button>
            <button onClick={() => void handleCreate()} disabled={!createForm.skuCode.trim() || !createForm.title.trim()} className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">{t('product.list.create')}</button>
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
                  <button onClick={downloadImportTemplate} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"><Download className="h-4 w-4" />{t('product.list.importModal.downloadTemplate')}</button>
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"><FileSpreadsheet className="h-4 w-4" />{t('product.list.importModal.chooseFile')}</button>
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
            <button onClick={() => { setImportRows([]); setShowImportModal(false) }} className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10">{t('product.list.importModal.close')}</button>
            <button onClick={() => void handleImportSubmit()} disabled={importRows.filter(isImportRowValid).length === 0 || importing} className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">{importing ? t('product.list.importModal.importing') : t('product.list.importModal.importValidRows')}</button>
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
    <Link to={href} className="group flex min-h-[150px] flex-col gap-3 rounded-[28px] border border-white/[0.06] bg-[#0b0d14] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.42)] transition hover:border-white/12 hover:bg-white/[0.025]">
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
      <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className={`w-full rounded-xl border border-white/10 bg-[#0a0a12] ${size === 'xl' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 id="product-modal-title" className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close modal" className="rounded-md border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
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
