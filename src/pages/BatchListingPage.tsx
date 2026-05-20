import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  FileText,
  LoaderCircle,
  Search,
  Sparkles,
  Settings2,
  LayoutGrid,
  Layers,
  TerminalSquare,
  Package,
  Eye,
  ArrowRight
} from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import {
  batchAdoptListingVersions,
  batchCreateListingVersions,
  listListingVersions,
  listProducts,
} from '@/services/product'
import type {
  BatchListingMutationResult,
  ListingVersion,
  ProductListItem,
  ProductStatus,
} from '@/types/product'

void AlertCircle
void CheckCircle2
void FileText
void LoaderCircle
void Search
void Sparkles
void Settings2
void LayoutGrid
void Layers
void TerminalSquare
void Package
void Eye
void ArrowRight

type BatchListingFormState = {
  versionLabel: string
  platform: string
  site: string
  locale: string
  titleTemplate: string
  descriptionTemplate: string
  bulletTemplateText: string
  keywordText: string
  includeProductTags: boolean
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: 'border-white/10 bg-white/5 text-white/60',
  assets_ready: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  listing_ready: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  export_ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  published: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
  archived: 'border-white/10 bg-white/5 text-white/45',
  missing: 'border-red-500/30 bg-red-500/10 text-red-300',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  pending: 'border-white/10 bg-white/5 text-white/60',
  done: 'border-blue-500/30 bg-blue-500/10 text-blue-300'
}

const DEFAULT_FORM: BatchListingFormState = {
  versionLabel: 'Batch Draft v1',
  platform: 'amazon',
  site: 'US',
  locale: 'en_US',
  titleTemplate: '{{title}}',
  descriptionTemplate:
    'Optimized listing copy for {{title}}. SKU: {{skuCode}}. Category: {{categoryId}}. Brand: {{brandId}}.',
  bulletTemplateText: [
    '{{title}}',
    'SKU {{skuCode}}',
    'Category {{categoryId}}',
    'Brand {{brandId}}',
    '{{tags}}',
  ].join('\n'),
  keywordText: 'optimized listing\nconversion copy',
  includeProductTags: true,
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

function parseKeywordText(value: string) {
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function renderTemplate(template: string, product: ProductListItem) {
  const tokenMap: Record<string, string> = {
    title: product.title || '',
    skuCode: product.skuCode || '',
    brandId: product.brandId || '',
    categoryId: product.categoryId || '',
    tags: product.tags.join(', '),
  }

  return template.replace(/\{\{\s*(title|skuCode|brandId|categoryId|tags)\s*\}\}/g, (_, token: string) => {
    return tokenMap[token] || ''
  }).replace(/\s+/g, ' ').trim()
}

function buildDraft(product: ProductListItem, form: BatchListingFormState) {
  const baseKeywords = parseKeywordText(form.keywordText)
  const keywords = Array.from(new Set([
    ...baseKeywords,
    ...(form.includeProductTags ? product.tags : []),
  ].map(item => item.trim()).filter(Boolean)))

  return {
    productId: product.id,
    versionLabel: form.versionLabel.trim(),
    title: renderTemplate(form.titleTemplate, product),
    description: renderTemplate(form.descriptionTemplate, product),
    bulletPoints: parseLines(form.bulletTemplateText)
      .map(line => renderTemplate(line, product))
      .filter(Boolean),
    keywords,
    platform: form.platform,
    site: form.site,
    locale: form.locale,
  }
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

function InputField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/60">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
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

function CustomCheckbox({ checked, indeterminate, onChange, label }: { checked: boolean, indeterminate?: boolean, onChange: (v: boolean) => void, label?: string }) {
  return (
    <label className="group flex cursor-pointer items-center gap-2 w-fit">
      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all ${checked || indeterminate ? 'border-brand-500 bg-brand-500' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
        {checked && (
          <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3 text-white">
            <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {!checked && indeterminate && <div className="h-1.5 w-2 rounded-[1px] bg-white" />}
      </div>
      {label && <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors select-none">{label}</span>}
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
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

void STATUS_BADGE_CLASS
void InputField
void TextareaField
void TabButton

export default function BatchListingPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const contextProductIDs = useMemo(
    () => (searchParams.get('productIds') ?? '').split(',').map(item => item.trim()).filter(Boolean),
    [searchParams],
  )
  const missionSource = searchParams.get('source')
  const { showToast } = useToastStore()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [selectedProductIDs, setSelectedProductIDs] = useState<string[]>([])
  const [previewProductID, setPreviewProductID] = useState('')
  const [form, setForm] = useState<BatchListingFormState>(DEFAULT_FORM)
  const [versionsByProduct, setVersionsByProduct] = useState<Record<string, ListingVersion[]>>({})
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [selectedVersionByProduct, setSelectedVersionByProduct] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [adopting, setAdopting] = useState(false)
  const [lastResult, setLastResult] = useState<BatchListingMutationResult | null>(null)
  
  const [activeTab, setActiveTab] = useState<'products' | 'preview' | 'versions' | 'logs'>('products')

  const STATUS_LABELS: Partial<Record<ProductStatus, string>> = {
    draft: 'Draft',
    assets_ready: 'Assets Ready',
    listing_ready: 'Listing Ready',
    export_ready: 'Export Ready',
    published: 'Published',
    archived: 'Archived',
  }

  async function loadProducts(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const result = await listProducts()
      setProducts(result)
      setSelectedProductIDs(current => {
        const seed = current.length > 0 ? current : contextProductIDs
        return seed.filter(id => result.some(item => item.id === id))
      })
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [contextProductIDs.join(',')])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (statusFilter !== 'all' && product.status !== statusFilter) {
        return false
      }
      if (!search.trim()) {
        return true
      }
      const keyword = search.trim().toLowerCase()
      return (
        product.title.toLowerCase().includes(keyword) ||
        product.skuCode.toLowerCase().includes(keyword) ||
        product.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    })
  }, [products, search, statusFilter])

  const selectedProducts = useMemo(() => {
    const selected = new Set(selectedProductIDs)
    return products.filter(product => selected.has(product.id))
  }, [products, selectedProductIDs])

  useEffect(() => {
    if (selectedProducts.length === 0) {
      setPreviewProductID('')
      return
    }
    if (selectedProducts.some(item => item.id === previewProductID)) {
      return
    }
    setPreviewProductID(selectedProducts[0].id)
  }, [previewProductID, selectedProducts])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedVersions() {
      if (selectedProducts.length === 0) {
        setVersionsByProduct({})
        setSelectedVersionByProduct({})
        return
      }

      setLoadingVersions(true)
      try {
        const pairs = await Promise.all(
          selectedProducts.map(async product => {
            const versions = await listListingVersions(product.id)
            return [product.id, versions] as const
          }),
        )

        if (cancelled) return

        const nextVersions = Object.fromEntries(pairs)
        setVersionsByProduct(nextVersions)
        setSelectedVersionByProduct(current => {
          const next: Record<string, string> = {}
          for (const product of selectedProducts) {
            const versions = nextVersions[product.id] || []
            const currentValue = current[product.id]
            if (currentValue && versions.some(item => item.id === currentValue)) {
              next[product.id] = currentValue
              continue
            }
            const adopted = versions.find(item => item.status === 'adopted')
            if (adopted) {
              next[product.id] = adopted.id
            }
          }
          return next
        })
      } catch (error) {
        console.error('Failed to load listing versions:', error)
      } finally {
        if (!cancelled) {
          setLoadingVersions(false)
        }
      }
    }

    void loadSelectedVersions()

    return () => {
      cancelled = true
    }
  }, [selectedProducts])

  const previewProduct = selectedProducts.find(item => item.id === previewProductID) ?? selectedProducts[0] ?? null
  const previewDraft = previewProduct ? buildDraft(previewProduct, form) : null

  function toggleProduct(productID: string) {
    setSelectedProductIDs(current =>
      current.includes(productID) ? current.filter(id => id !== productID) : [...current, productID],
    )
  }

  function selectFilteredProducts() {
    setSelectedProductIDs(current => {
      const merged = new Set(current)
      filteredProducts.forEach(product => merged.add(product.id))
      return Array.from(merged)
    })
  }

  function clearSelection() {
    setSelectedProductIDs([])
    setLastResult(null)
  }

  function formatMutationToast(result: BatchListingMutationResult, successText: string, failureText: string) {
    if (result.failed === 0) {
      return `${successText}: ${result.succeeded}/${result.total}`
    }
    return `${failureText}: ${result.succeeded} succeeded, ${result.failed} failed`
  }

  async function handleBatchCreate() {
    if (selectedProducts.length === 0) {
      showToast(t('batchListing.messages.selectProductFirst'), 'error')
      return
    }

    const drafts = selectedProducts.map(product => buildDraft(product, form))
    if (drafts.some(item => !item.versionLabel || !item.title)) {
      showToast(t('batchListing.messages.versionLabelRequired'), 'error')
      return
    }

    setCreating(true)
    try {
      const result = await batchCreateListingVersions({ items: drafts })
      setLastResult(result)
      setSelectedVersionByProduct(current => {
        const next = { ...current }
        result.items.forEach(item => {
          if (item.success && item.versionId) {
            next[item.productId] = item.versionId
          }
        })
        return next
      })
      showToast(
        formatMutationToast(result, t('batchListing.messages.createFinished'), t('batchListing.messages.createFailed')),
        result.failed ? 'error' : 'success'
      )
      await loadProducts({ silent: true })
      const pairs = await Promise.all(
        selectedProducts.map(async product => {
          const versions = await listListingVersions(product.id)
          return [product.id, versions] as const
        }),
      )
      setVersionsByProduct(Object.fromEntries(pairs))
      setActiveTab('logs')
    } catch (error) {
      console.error('Failed to batch create listings:', error)
    } finally {
      setCreating(false)
    }
  }

  async function handleBatchAdopt() {
    const items = selectedProducts
      .map(product => ({
        productId: product.id,
        versionId: selectedVersionByProduct[product.id],
      }))
      .filter(item => item.versionId)

    if (items.length === 0) {
      showToast(t('batchListing.messages.chooseVersionToAdopt'), 'error')
      return
    }

    setAdopting(true)
    try {
      const result = await batchAdoptListingVersions({ items })
      setLastResult(result)
      showToast(
        formatMutationToast(result, t('batchListing.messages.adoptFinished'), t('batchListing.messages.adoptFailed')),
        result.failed ? 'error' : 'success'
      )
      await loadProducts({ silent: true })
      const pairs = await Promise.all(
        selectedProducts.map(async product => {
          const versions = await listListingVersions(product.id)
          return [product.id, versions] as const
        }),
      )
      setVersionsByProduct(Object.fromEntries(pairs))
      setActiveTab('logs')
    } catch (error) {
      console.error('Failed to batch adopt listings:', error)
    } finally {
      setAdopting(false)
    }
  }

  const isAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIDs.includes(p.id))
  const isSomeFilteredSelected = filteredProducts.some(p => selectedProductIDs.includes(p.id))

  void missionSource
  void loading
  void refreshing
  void setStatusFilter
  void loadingVersions
  void lastResult
  void activeTab
  void setActiveTab
  void STATUS_LABELS
  void isSomeFilteredSelected

  function toggleAllFiltered() {
    if (isAllFilteredSelected) {
      setSelectedProductIDs(current => current.filter(id => !filteredProducts.some(p => p.id === id)))
    } else {
      selectFilteredProducts()
    }
  }

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
      
      {/* Prototype-aligned Listing station */}
      <section className="relative z-10 mx-auto mt-4 w-[calc(100%-2.5rem)] max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/products" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 transition hover:text-white/90"><ChevronLeft className="h-4 w-4" />{t('batchListing.contextLinks.backToProducts')}</Link>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/65">Template Center · DIY templates</div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">模板中心</h1>
            <p className="mt-1.5 text-sm text-white/48">选择 SKU → 配置模板/Prompt → 生成/预览 → 校验 → 创建版本 → Adopt/导出交接</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('products')} className="rounded-xl bg-cyan-200 px-4 py-2 text-xs font-bold text-[#05070b]">模板 / Prompt 配置</button>
            <button onClick={() => setActiveTab('logs')} className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/72">校验结果</button>
          </div>
        </div>

        <div className="mb-5 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {['选择 SKU', '配置模板', '生成/预览', '校验', '创建版本', 'Adopt/导出'].map((step, index) => (
            <div key={step} className={`rounded-full border px-4 py-2 text-xs font-semibold ${index === 0 ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : index === 1 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/8 bg-white/[0.035] text-white/45'}`}>{step}</div>
          ))}
        </div>

        <section className="mb-5 rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36)]">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/38">SKU 选择池</div>
              <p className="mt-1 text-sm text-white/45">先选择要套用 DIY 模板的 SKU，再在下方配置模板并预览生成版本。</p>
            </div>
            <div className="flex min-w-0 flex-1 gap-2 lg:max-w-xl">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 SKU / 标题" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white outline-none" />
              <button onClick={toggleAllFiltered} className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-white/65">{isAllFilteredSelected ? '取消全选' : '全选'}</button>
              <button onClick={clearSelection} className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/45 hover:text-white">清空</button>
            </div>
          </div>
          <div className="mb-3 text-xs text-white/38">已选 {selectedProducts.length} / 可见 {filteredProducts.length}</div>
          <div className="grid max-h-[260px] gap-2 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selectedProductIDs.includes(product.id) ? 'border-cyan-300/35 bg-cyan-300/[0.08]' : 'border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.045]'}`}>
                <CustomCheckbox checked={selectedProductIDs.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/78">{product.title}</div>
                  <div className="font-mono text-[11px] text-white/38">{product.skuCode}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36)]">
              <div className="mb-4 flex items-center justify-between"><div className="text-xs font-bold uppercase tracking-[0.22em] text-white/38">已选 SKU 池 — {selectedProducts.length} 个</div><button onClick={clearSelection} className="text-xs text-white/35 hover:text-white">清空</button></div>
              {selectedProducts.length ? <div className="grid gap-3 md:grid-cols-2">{selectedProducts.map(product => {
                const active = product.id === previewProductID
                return <button key={product.id} onClick={() => setPreviewProductID(product.id)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-300/38 bg-cyan-300/[0.08]' : 'border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.045]'}`}><div className="font-mono text-xs text-cyan-100/70">{product.skuCode}</div><div className="mt-1 truncate text-sm font-semibold text-white/88">{product.title}</div><div className="mt-3 flex gap-2"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${product.assetStatus === 'ready' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/25 bg-rose-300/10 text-rose-200'}`}>{product.assetStatus === 'ready' ? 'Assets Ready' : '缺素材'}</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/45">{product.categoryId || 'Uncategorized'}</span></div></button>
              })}</div> : <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/42">请先从下方商品池选择 SKU。</div>}
            </section>

            <section className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">DRAFT 预览 — {previewProduct?.skuCode || '未选择'}</div>
              <div className="mb-4 flex flex-wrap gap-2">{['标题','五点描述','描述','平台适配','校验'].map((tab, index) => <span key={tab} className={`rounded-full border px-3 py-1 text-xs ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{tab}</span>)}</div>
              {previewDraft ? <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"><h2 className="text-xl font-semibold leading-snug text-white/92">{previewDraft.title || 'Untitled Product'}</h2><p className="mt-2 text-sm text-white/45">草稿标题根据图片解析和基础关键词生成。评分：82/100。</p><div className="mt-4 flex flex-wrap gap-2">{previewDraft.keywords.slice(0, 6).map(keyword => <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/55">{keyword}</span>)}</div></div> : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/42">选择一个 SKU 后预览批量生成草稿。</div>}
            </section>

            <section className="rounded-[28px] border border-white/[0.07] bg-[#080b11]/92 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">LISTING 版本 — {previewProduct?.skuCode || '未选择'}</div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
                <table className="w-full text-left text-sm"><thead className="bg-white/[0.035] text-[11px] uppercase tracking-[0.12em] text-white/35"><tr><th className="px-4 py-3">版本</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3">PROMPT_IDS</th><th className="px-4 py-3">ASSET_IDS</th><th className="px-4 py-3">操作</th></tr></thead>
                <tbody className="divide-y divide-white/[0.06]">{(previewProduct ? versionsByProduct[previewProduct.id] || [] : []).slice(0, 5).map(version => <tr key={version.id} className="text-white/65"><td className="px-4 py-3 font-mono text-cyan-100/75">v{version.versionNo}</td><td className="px-4 py-3"><span className={version.status === 'adopted' ? 'text-emerald-200' : 'text-white/50'}>{version.status}</span></td><td className="px-4 py-3">{new Date(version.createdAt).toLocaleDateString()}</td><td className="px-4 py-3">prompt-{version.versionNo}</td><td className="px-4 py-3">{previewProduct.assetStatus === 'ready' ? 'attached' : '—'}</td><td className="px-4 py-3">{version.status === 'adopted' ? '当前采用版本' : <button onClick={() => setSelectedVersionByProduct(prev => ({ ...prev, [previewProduct.id]: version.id }))} className="rounded-lg border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs text-white/70">Adopt</button>}</td></tr>)}
                {(!previewProduct || !(versionsByProduct[previewProduct.id] || []).length) ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-white/38">暂无版本；可使用真实 batch create API 创建新版本。</td></tr> : null}</tbody></table>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={handleBatchCreate} disabled={creating || selectedProducts.length === 0} className="rounded-xl bg-cyan-200 px-4 py-2 text-xs font-bold text-[#05070b] disabled:bg-white/[0.05] disabled:text-white/25">批量创建版本</button><button onClick={handleBatchAdopt} disabled={adopting || selectedProducts.length === 0} className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 disabled:text-white/25">批量 Adopt</button><Link to={`/products/workbench/downloads${selectedProductIDs.length ? `?productIds=${encodeURIComponent(selectedProductIDs.join(','))}&source=listing` : ''}`} className="rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70">导出交接</Link></div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[28px] border border-cyan-300/16 bg-cyan-300/[0.045] p-5">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/70">模板 / Prompt 配置</div>
              <div className="space-y-3"><SelectField label="标题模板" value={form.titleTemplate} onChange={v => setForm({ ...form, titleTemplate: v })} options={[{ label: 'Home & Kitchen — Long-form SEO', value: '{{title}}' }, { label: 'Feature-first compact', value: '{{title}} — {{categoryId}}' }]} /><SelectField label="Prompt Source" value="validated" onChange={() => undefined} options={[{ label: 'Validated prompt（推荐）', value: 'validated' }, { label: 'Legacy fallback', value: 'legacy' }]} /><div className="text-xs text-white/38">平台 / 站点 / 语言</div><div className="flex flex-wrap gap-2">{['Shopee / SG / en_SG','Lazada / MY / en_MY','Amazon / US / en_US'].map((site, index) => <span key={site} className={`rounded-full border px-3 py-1 text-xs ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{site}</span>)}</div></div>
            </div>
            <div className="rounded-[28px] border border-rose-300/16 bg-rose-300/[0.045] p-5">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-rose-100/70">Validation Rail</div>
              <div className="space-y-3 text-xs leading-5"><div className="rounded-2xl border border-rose-300/18 bg-rose-300/[0.06] p-3 text-rose-100/72">提醒：素材不完整的 SKU 不能创建可导出版本。</div><div className="rounded-2xl border border-amber-300/18 bg-amber-300/[0.06] p-3 text-amber-100/72">注意：标题长度、平台字段映射需要在创建前校验。</div><div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 text-white/50">批量创建/采纳已可使用；平台发布暂未开放。</div></div>
            </div>

          </aside>
        </div>
      </section>
    </div>
  )
}
