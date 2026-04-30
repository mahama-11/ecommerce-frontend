import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function BatchListingPage() {
  const { t } = useTranslation()
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
    draft: t('product.status.draft'),
    assets_ready: t('product.status.assets_ready'),
    listing_ready: t('product.status.listing_ready'),
    export_ready: t('product.status.export_ready'),
    published: t('product.status.published'),
    archived: t('product.status.archived'),
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
      setSelectedProductIDs(current => current.filter(id => result.some(item => item.id === id)))
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

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

  function toggleAllFiltered() {
    if (isAllFilteredSelected) {
      setSelectedProductIDs(current => current.filter(id => !filteredProducts.some(p => p.id === id)))
    } else {
      selectFilteredProducts()
    }
  }

  return (
    <div className="flex h-full w-full bg-[#09090b] text-white overflow-hidden font-sans">
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
            <ChevronLeft className="h-4 w-4" />
            {t('batchListing.contextLinks.backToProducts')}
          </Link>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500/20 text-brand-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-white/90">{t('batchListing.title')}</h1>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed">{t('batchListing.subtitle')}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Settings2 className="h-4 w-4 text-brand-400" />
              Target Marketplace
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label={t('batchListing.template.platform')} value={form.platform} onChange={v => setForm({...form, platform: v})} options={[{label: 'Amazon', value: 'amazon'}, {label: 'Shopee', value: 'shopee'}, {label: 'Lazada', value: 'lazada'}]} />
              <SelectField label={t('batchListing.template.site')} value={form.site} onChange={v => setForm({...form, site: v})} options={[{label: 'US', value: 'US'}, {label: 'UK', value: 'UK'}, {label: 'SG', value: 'SG'}]} />
            </div>
            <SelectField label={t('batchListing.template.locale')} value={form.locale} onChange={v => setForm({...form, locale: v})} options={[{label: 'en_US', value: 'en_US'}, {label: 'en_GB', value: 'en_GB'}, {label: 'en_SG', value: 'en_SG'}]} />
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <FileText className="h-4 w-4 text-brand-400" />
              Listing Template
            </div>
            <InputField label={t('batchListing.template.versionLabel')} value={form.versionLabel} onChange={v => setForm({...form, versionLabel: v})} placeholder="Batch Draft v1" />
            <InputField label={t('batchListing.template.titleTemplate')} value={form.titleTemplate} onChange={v => setForm({...form, titleTemplate: v})} />
            <TextareaField label={t('batchListing.template.descriptionTemplate')} value={form.descriptionTemplate} onChange={v => setForm({...form, descriptionTemplate: v})} rows={4} />
            <TextareaField label={t('batchListing.template.bulletTemplate')} value={form.bulletTemplateText} onChange={v => setForm({...form, bulletTemplateText: v})} rows={5} hint={t('batchListing.template.bulletHint')} />
            <TextareaField label={t('batchListing.template.keywords')} value={form.keywordText} onChange={v => setForm({...form, keywordText: v})} rows={2} placeholder={t('batchListing.template.keywordHint')} />
            <div className="pt-1">
              <CustomCheckbox label={t('batchListing.template.appendTags')} checked={form.includeProductTags} onChange={v => setForm({...form, includeProductTags: v})} />
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t border-white/5 bg-[#0c0c10]/90 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Selected</span>
            <span className="text-sm font-bold text-brand-400">{selectedProducts.length} <span className="text-white/30 font-normal">items</span></span>
          </div>
          <button
            onClick={handleBatchCreate}
            disabled={creating || selectedProducts.length === 0}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(var(--brand-500),0.15)] hover:shadow-[0_0_25px_rgba(var(--brand-500),0.25)] overflow-hidden"
          >
            {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            {creating ? t('batchListing.template.creating') : t('batchListing.template.createBtn')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        <header className="flex-none px-8 pt-8 border-b border-white/5 flex gap-8">
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="h-4 w-4" />} label={t('batchListing.tabs.products', { selected: selectedProducts.length, total: products.length })} />
          <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={<Eye className="h-4 w-4" />} label={t('batchListing.tabs.preview')} />
          <TabButton active={activeTab === 'versions'} onClick={() => setActiveTab('versions')} icon={<Layers className="h-4 w-4" />} label={t('batchListing.tabs.versions')} />
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<TerminalSquare className="h-4 w-4" />} label={t('batchListing.tabs.logs')} hasDot={!!lastResult} />
        </header>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          {activeTab === 'products' && (
            <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={t('batchListing.selectProducts.searchPlaceholder')}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all hover:bg-white/[0.07]"
                    />
                  </div>
                  <SelectField
                    value={statusFilter}
                    onChange={v => setStatusFilter(v as ProductStatus | 'all')}
                    options={[
                      { label: t('batchListing.selectProducts.allStatuses'), value: 'all' },
                      ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ label: l, value: v }))
                    ]}
                    inline
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => void loadProducts({ silent: true })} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 transition-colors">
                    <LoaderCircle className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
                    {t('batchListing.selectProducts.refresh')}
                  </button>
                  <button onClick={clearSelection} className="px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 transition-colors">
                    {t('batchListing.selectProducts.clear')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0c0c10] shadow-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-white/70 whitespace-nowrap">
                    <thead className="bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-white/40 border-b border-white/10">
                      <tr>
                        <th className="w-14 px-4 py-3 text-center">
                           <div className="flex justify-center">
                             <CustomCheckbox checked={isAllFilteredSelected} indeterminate={isSomeFilteredSelected && !isAllFilteredSelected} onChange={toggleAllFiltered} />
                           </div>
                        </th>
                        <th className="px-4 py-3">{t('batchListing.selectProducts.columns.productSku')}</th>
                        <th className="px-4 py-3">{t('batchListing.selectProducts.columns.status')}</th>
                        <th className="px-4 py-3">{t('batchListing.selectProducts.columns.assetsVersions')}</th>
                        <th className="px-4 py-3 w-1/3">{t('batchListing.selectProducts.columns.tags')}</th>
                      </tr>
                    </thead>
                    {loading ? (
                      <tbody>
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <LoaderCircle className="h-6 w-6 animate-spin text-brand-400 mx-auto" />
                          </td>
                        </tr>
                      </tbody>
                    ) : filteredProducts.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-white/40">
                            {t('batchListing.selectProducts.noMatch')}
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody className="divide-y divide-white/5">
                        {filteredProducts.map(product => {
                          const isSelected = selectedProductIDs.includes(product.id)
                          return (
                            <tr key={product.id} className={`transition-colors hover:bg-white/[0.03] ${isSelected ? 'bg-brand-500/[0.03]' : ''}`}>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                   <CustomCheckbox checked={isSelected} onChange={() => toggleProduct(product.id)} />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className={`font-medium transition-colors ${isSelected ? 'text-brand-300' : 'text-white/90'}`}>{product.title}</div>
                                <div className="font-mono text-xs text-white/40 mt-1">{product.skuCode}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_BADGE_CLASS[product.status]}`}>
                                  {t(`product.status.${product.status}` as any, STATUS_LABELS[product.status] || product.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-white/50 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{product.assetsCount} {t('batchListing.selectProducts.tableAssets')}</span>
                                  <span className="text-white/30">{product.assetStatus}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{product.listingVersionsCount} {t('batchListing.selectProducts.tableVersions')}</span>
                                  <span className="text-white/30">{product.listingStatus}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {product.tags.slice(0, 4).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/50">{tag}</span>
                                  ))}
                                  {product.tags.length > 4 && <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/50">+{product.tags.length - 4}</span>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/60">Previewing the output for:</div>
                <div className="w-80">
                  <SelectField
                    value={previewProductID}
                    onChange={setPreviewProductID}
                    options={selectedProducts.map(p => ({label: p.skuCode + ' - ' + p.title, value: p.id}))}
                  />
                </div>
              </div>

              {!previewProduct || !previewDraft ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-sm text-white/40">
                  {t('batchListing.preview.selectPrompt')}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0c0c10] shadow-2xl overflow-hidden">
                  <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-brand-500/20 text-brand-300 text-xs font-mono font-medium border border-brand-500/20 uppercase tracking-wider">{previewDraft.platform}</span>
                    <span className="px-2.5 py-1 rounded bg-white/10 text-white/70 text-xs font-mono font-medium border border-white/10 uppercase tracking-wider">{previewDraft.site}</span>
                    <span className="px-2.5 py-1 rounded bg-white/10 text-white/70 text-xs font-mono font-medium border border-white/10">{previewDraft.locale}</span>
                  </div>
                  <div className="p-8 space-y-10">
                    <div>
                      <h2 className="text-2xl font-bold text-white/90 leading-snug">{previewDraft.title || 'Untitled Product'}</h2>
                      <div className="mt-3 text-sm text-white/40 font-mono">SKU: {previewProduct?.skuCode}</div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> About this item
                      </h3>
                      <ul className="space-y-3">
                        {previewDraft.bulletPoints.map((bp, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500/60 shrink-0 shadow-[0_0_8px_rgba(var(--brand-500),0.8)]" />
                            <span className="leading-relaxed">{bp}</span>
                          </li>
                        ))}
                        {previewDraft.bulletPoints.length === 0 && <li className="text-sm text-white/30 italic">No bullet points provided.</li>}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" /> Description
                      </h3>
                      <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-white/[0.02] p-5 rounded-xl border border-white/5">
                        {previewDraft.description || 'No description provided.'}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                        <Search className="h-4 w-4" /> Search Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {previewDraft.keywords.map(kw => (
                          <span key={kw} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[13px] font-medium text-white/60">{kw}</span>
                        ))}
                        {previewDraft.keywords.length === 0 && <span className="text-sm text-white/30 italic">No keywords.</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-sm text-white/70">
                  Select a version for each product, then batch adopt them to finalize the listing preparation.
                </div>
                <button
                  onClick={handleBatchAdopt}
                  disabled={adopting || selectedProducts.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:ring-2 focus:ring-emerald-500/50"
                >
                  {adopting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {t('batchListing.selectedVersions.batchAdoptBtn')}
                </button>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center text-sm text-white/40">
                  {t('batchListing.selectedVersions.selectFirstPrompt')}
                </div>
              ) : loadingVersions ? (
                <div className="flex items-center justify-center py-20">
                  <LoaderCircle className="h-8 w-8 animate-spin text-brand-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {selectedProducts.map(product => {
                    const versions = versionsByProduct[product.id] || []
                    return (
                      <div key={product.id} className="rounded-xl border border-white/10 bg-[#0c0c10] overflow-hidden flex flex-col shadow-lg">
                        <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-center justify-between">
                          <div className="min-w-0 pr-4">
                            <div className="text-sm font-semibold text-white/90 truncate" title={product.title}>{product.title}</div>
                            <div className="text-[11px] text-white/40 font-mono mt-1">{product.skuCode}</div>
                          </div>
                          <Link to={`/products/${product.id}`} className="shrink-0 text-xs font-medium text-brand-400 hover:text-brand-300">
                            Details
                          </Link>
                        </div>
                        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[360px] custom-scrollbar bg-[#09090b]/50">
                          {versions.length === 0 ? (
                            <div className="text-xs text-white/40 text-center py-8 italic">
                              {t('batchListing.selectedVersions.noVersionsYet')}
                            </div>
                          ) : (
                            versions.map(v => {
                              const checked = selectedVersionByProduct[product.id] === v.id
                              return (
                                <label key={v.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'}`}>
                                  <div className="mt-0.5 shrink-0">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-white/30'}`}>
                                      {checked && <div className="w-1.5 h-1.5 rounded-full bg-[#0c0c10]" />}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <span className={`text-sm font-semibold truncate ${checked ? 'text-emerald-400' : 'text-white/80'}`}>{v.versionLabel}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${v.status === 'adopted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white/50 border border-white/5'}`}>{v.status}</span>
                                    </div>
                                    <div className="text-xs text-white/50 truncate mb-2" title={v.title}>{v.title}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-wider">
                                      <span className="text-white/60">v{v.versionNo}</span>
                                      <span>|</span>
                                      <span>{v.platform}</span>
                                      <span>|</span>
                                      <span>{v.site}</span>
                                    </div>
                                  </div>
                                </label>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
              {!lastResult ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center text-sm text-white/40">
                  No actions performed yet in this session.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-5 bg-[#0c0c10] border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <TerminalSquare className="h-8 w-8 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white/90">Action Completed</h3>
                      <div className="text-sm text-white/50 mt-1.5 flex items-center gap-3">
                        <span>Processed <strong className="text-white/80">{lastResult.total}</strong> items</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-emerald-400">{lastResult.succeeded} Succeeded</span>
                        {lastResult.failed > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-red-400">{lastResult.failed} Failed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {lastResult.items.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className={`flex items-start gap-4 p-5 rounded-xl border ${item.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        {item.success ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
                        <div>
                          <div className="text-sm font-semibold text-white/90">{item.productTitle || item.productId}</div>
                          {item.skuCode && <div className="text-[11px] font-mono text-white/40 mt-1">{item.skuCode}</div>}
                          <div className="text-sm text-white/60 mt-2">{item.message || (item.success ? t('batchListing.lastResult.completed') : t('batchListing.lastResult.failed'))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
