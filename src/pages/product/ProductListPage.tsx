import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, Download, FileSpreadsheet, LoaderCircle, Package, Plus, Search, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CommandStrip, MissionDossier, ProductionRail, SkuWorkUnitCard, StationNav } from '@/components/product-workbench'
import { useToastStore } from '@/store/toastStore'
import type { ProductListItem } from '@/types/product'
import { createProduct, deleteProduct, listProducts } from '@/services/product'
import type { MissionStage } from './utils/productMission'
import { buildProductionRail, deriveMissionWorkUnit } from './utils/productMission'

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
  const { showToast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [keyword, setKeyword] = useState('')
  const [activeStage, setActiveStage] = useState<MissionStage | 'all'>('all')
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [focusedProductId, setFocusedProductId] = useState<string>('')
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

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product? All related data will be lost.')) return
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
    return result.sort((a, b) => a.stageIndex - b.stageIndex || b.healthScore - a.healthScore)
  }, [activeStage, keyword, missionUnits])

  const focusedUnit = missionUnits.find(unit => unit.product.id === focusedProductId) ?? filteredUnits[0] ?? missionUnits[0] ?? null
  const selectedUnits = missionUnits.filter(unit => selectedIds.includes(unit.product.id))
  const blockedCount = missionUnits.filter(unit => unit.readiness.some(item => item.state === 'blocked')).length
  const contractNeededCount = missionUnits.filter(unit => unit.readiness.some(item => item.state === 'contract-needed')).length

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } } }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative min-h-full overflow-auto bg-[#05070b] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[-14rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(circle_at_top,black,transparent_74%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1760px] flex-col gap-5 px-4 py-5 lg:px-6">
        <motion.header variants={itemVariants} className="rounded-[30px] border border-white/10 bg-[#080b11]/90 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                  <Boxes className="h-4 w-4" /> Mission Control
                </span>
                <StationNav />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">SKU Mission Control / Production Cockpit</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/56">
                Production Rail, SKU Board / Command Queue, Mission Dossier and Command Strip for moving real product records through AI commerce operations without faking generation, export, download or commercial readiness.
              </p>
            </div>
            <div className="grid min-w-[320px] grid-cols-3 gap-3">
              <HeaderStat label="Work units" value={String(products.length)} />
              <HeaderStat label="Blocked" value={String(blockedCount)} tone="warn" />
              <HeaderStat label="Contract-needed" value={String(contractNeededCount)} tone="amber" />
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search SKU Board / Command Queue by SKU, title, brand, tag..."
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40 focus:bg-black/35"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowImportModal(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10">
                <Upload className="h-4 w-4" /> {t('product.list.import')}
              </button>
              <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white">
                <Plus className="h-4 w-4" /> {t('product.list.create')}
              </button>
            </div>
          </div>
        </motion.header>

        <motion.div variants={itemVariants}>
          <ProductionRail stages={productionRail} activeStage={activeStage} onStageChange={setActiveStage} />
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <motion.main variants={itemVariants} className="rounded-[30px] border border-white/10 bg-[#080b11]/88 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/38">SKU Board / Command Queue</div>
                <h2 className="mt-1 text-xl font-semibold text-white">Production work units · {filteredUnits.length}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedIds(filteredUnits.map(unit => unit.product.id))} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/55 transition hover:text-white">Select filtered</button>
                <button onClick={() => setSelectedIds([])} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/55 transition hover:text-white">Clear</button>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/8 bg-white/[0.025]">
                <LoaderCircle className="h-8 w-8 animate-spin text-cyan-200" />
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.025] p-12 text-center text-white/45">
                <Package className="mb-4 h-10 w-10 text-white/25" />
                <div className="text-base font-semibold text-white/70">{t('product.list.noProducts')}</div>
                <div className="mt-1 text-sm">No SKU work units match this Production Rail filter.</div>
              </div>
            ) : (
              <div className="grid gap-3 2xl:grid-cols-2">
                {filteredUnits.map(unit => (
                  <SkuWorkUnitCard
                    key={unit.product.id}
                    unit={unit}
                    selected={selectedIds.includes(unit.product.id)}
                    focused={focusedUnit?.product.id === unit.product.id}
                    onSelect={() => toggleSelect(unit.product.id)}
                    onFocus={() => setFocusedProductId(unit.product.id)}
                    onDelete={() => void handleDelete(unit.product.id)}
                    deleting={deletingId === unit.product.id}
                  />
                ))}
              </div>
            )}
          </motion.main>

          <motion.div variants={itemVariants}>
            <MissionDossier unit={focusedUnit} />
          </motion.div>
        </div>
      </div>

      <CommandStrip selectedUnits={selectedUnits} onClear={() => setSelectedIds([])} />

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

function HeaderStat({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'warn' | 'amber' }) {
  const toneClass = tone === 'warn' ? 'text-rose-200' : tone === 'amber' ? 'text-amber-200' : 'text-white'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  )
}

function ModalShell({ title, onClose, size = 'md', children }: { title: string; onClose: () => void; size?: 'md' | 'xl'; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`w-full rounded-xl border border-white/10 bg-[#0a0a12] ${size === 'xl' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-md border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
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
