import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  FileText,
  LoaderCircle,
  Search,
  Sparkles,
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
  archived: 'border-white/10 bg-white/5 text-white/45',
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

function formatMutationToast(result: BatchListingMutationResult, successText: string, failureText: string) {
  if (result.failed === 0) {
    return `${successText}: ${result.succeeded}/${result.total}`
  }
  return `${failureText}: ${result.succeeded} succeeded, ${result.failed} failed`
}

export default function BatchListingPage() {
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

  async function handleBatchCreate() {
    if (selectedProducts.length === 0) {
      showToast('Select at least one product first.', 'error')
      return
    }

    const drafts = selectedProducts.map(product => buildDraft(product, form))
    if (drafts.some(item => !item.versionLabel || !item.title)) {
      showToast('Version label and generated title are required.', 'error')
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
      showToast(formatMutationToast(result, 'Batch listing created', 'Batch listing partially failed'), result.failed ? 'error' : 'success')
      await loadProducts({ silent: true })
      const pairs = await Promise.all(
        selectedProducts.map(async product => {
          const versions = await listListingVersions(product.id)
          return [product.id, versions] as const
        }),
      )
      setVersionsByProduct(Object.fromEntries(pairs))
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
      showToast('Choose at least one listing version to adopt.', 'error')
      return
    }

    setAdopting(true)
    try {
      const result = await batchAdoptListingVersions({ items })
      setLastResult(result)
      showToast(formatMutationToast(result, 'Batch adopt finished', 'Batch adopt partially failed'), result.failed ? 'error' : 'success')
      await loadProducts({ silent: true })
      const pairs = await Promise.all(
        selectedProducts.map(async product => {
          const versions = await listListingVersions(product.id)
          return [product.id, versions] as const
        }),
      )
      setVersionsByProduct(Object.fromEntries(pairs))
    } catch (error) {
      console.error('Failed to batch adopt listings:', error)
    } finally {
      setAdopting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#0a0a12] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>Real Batch Listing Workflow</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold gradient-text">Batch Listing</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/55">
                  Select real products from Product Center, render a reusable listing template,
                  create version drafts in bulk, then adopt the chosen versions back to each SKU.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="glass rounded-2xl p-4">
                <div className="text-2xl font-semibold text-white">{products.length}</div>
                <div className="mt-1 text-xs text-white/45">Products in center</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-2xl font-semibold text-white">{selectedProducts.length}</div>
                <div className="mt-1 text-xs text-white/45">Selected for batch</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="text-2xl font-semibold text-white">
                  {selectedProducts.reduce((sum, product) => sum + (versionsByProduct[product.id]?.length || 0), 0)}
                </div>
                <div className="mt-1 text-xs text-white/45">Loaded listing versions</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-6">
            <div className="glass rounded-3xl p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Select Products</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Search by title, SKU, or tags and batch-pick the products that should receive a new listing version.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={selectFilteredProducts}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Select filtered
                  </button>
                  <button
                    onClick={clearSelection}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => void loadProducts({ silent: true })}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search products"
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] py-3 pl-10 pr-4 text-sm text-white/80 outline-none placeholder:text-white/25 focus:border-brand-500/40"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value as ProductStatus | 'all')}
                  className="rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderCircle className="h-8 w-8 animate-spin text-brand-400" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-10 text-center text-sm text-white/40">
                    No products match the current filter.
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const selected = selectedProductIDs.includes(product.id)
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                          selected
                            ? 'border-brand-500/40 bg-brand-500/10'
                            : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${selected ? 'border-brand-400 bg-brand-500 text-white' : 'border-white/20 bg-transparent text-transparent'}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-white">{product.title}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_BADGE_CLASS[product.status]}`}>
                              {STATUS_LABELS[product.status]}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-white/40">{product.skuCode}</div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
                            <span>{product.assetsCount} assets</span>
                            <span>{product.listingVersionsCount} listing versions</span>
                            <span>{product.assetStatus} assets state</span>
                            <span>{product.listingStatus} listing state</span>
                          </div>
                          {product.tags.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {product.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[11px] text-white/50">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Selected Listing Versions</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Each selected product loads its current listing history. Choose one version per product for batch adopt.
                  </p>
                </div>
                <button
                  onClick={handleBatchAdopt}
                  disabled={adopting || selectedProducts.length === 0}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adopting ? 'Adopting...' : 'Batch Adopt Selected Versions'}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {selectedProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-10 text-center text-sm text-white/40">
                    Select products to inspect and adopt listing versions.
                  </div>
                ) : loadingVersions ? (
                  <div className="flex items-center justify-center py-12">
                    <LoaderCircle className="h-7 w-7 animate-spin text-brand-400" />
                  </div>
                ) : (
                  selectedProducts.map(product => {
                    const versions = versionsByProduct[product.id] || []
                    return (
                      <div key={product.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-medium text-white">{product.title}</div>
                            <div className="mt-1 text-xs text-white/40">{product.skuCode}</div>
                          </div>
                          <Link to={`/products/${product.id}`} className="text-sm text-brand-300 hover:text-brand-200">
                            Open product
                          </Link>
                        </div>

                        <div className="mt-4 space-y-3">
                          {versions.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm text-white/40">
                              No listing versions yet for this product.
                            </div>
                          ) : (
                            versions.map(version => {
                              const checked = selectedVersionByProduct[product.id] === version.id
                              return (
                                <label
                                  key={version.id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                    checked
                                      ? 'border-emerald-500/30 bg-emerald-500/10'
                                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`selected-version-${product.id}`}
                                    checked={checked}
                                    onChange={() =>
                                      setSelectedVersionByProduct(current => ({ ...current, [product.id]: version.id }))
                                    }
                                    className="mt-1"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-white">{version.versionLabel}</span>
                                      <span className="text-xs text-white/35">v{version.versionNo}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                                        version.status === 'adopted'
                                          ? 'bg-emerald-500/15 text-emerald-300'
                                          : version.status === 'ready'
                                            ? 'bg-blue-500/15 text-blue-300'
                                            : 'bg-white/5 text-white/50'
                                      }`}>
                                        {version.status}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-white/70">{version.title}</div>
                                    <div className="mt-2 text-xs text-white/40">
                                      {version.platform.toUpperCase()} · {version.site} · {version.locale}
                                    </div>
                                  </div>
                                </label>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {lastResult ? (
              <div className="glass rounded-3xl p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">Last Batch Result</h2>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-white/55">
                    {lastResult.succeeded}/{lastResult.total} succeeded
                  </span>
                  {lastResult.failed > 0 ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                      {lastResult.failed} failed
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-3">
                  {lastResult.items.map(item => (
                    <div
                      key={`${item.productId}-${item.versionId || item.message}`}
                      className={`flex items-start gap-3 rounded-2xl border p-4 ${
                        item.success
                          ? 'border-emerald-500/20 bg-emerald-500/10'
                          : 'border-amber-500/20 bg-amber-500/10'
                      }`}
                    >
                      {item.success ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white">
                          {item.productTitle || item.productId}
                          {item.skuCode ? <span className="ml-2 text-white/35">{item.skuCode}</span> : null}
                        </div>
                        <div className="mt-1 text-sm text-white/65">
                          {item.message || (item.success ? 'Completed' : 'Failed')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-3xl p-5">
              <h2 className="text-lg font-semibold text-white">Listing Template</h2>
              <p className="mt-1 text-sm text-white/45">
                Use product tokens to render per-SKU drafts: <code>{'{{title}}'}</code>, <code>{'{{skuCode}}'}</code>,
                <code>{'{{brandId}}'}</code>, <code>{'{{categoryId}}'}</code>, <code>{'{{tags}}'}</code>.
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm text-white/70">Platform</label>
                    <select
                      value={form.platform}
                      onChange={event => setForm(current => ({ ...current, platform: event.target.value }))}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
                    >
                      <option value="amazon">Amazon</option>
                      <option value="shopee">Shopee</option>
                      <option value="lazada">Lazada</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/70">Site</label>
                    <select
                      value={form.site}
                      onChange={event => setForm(current => ({ ...current, site: event.target.value }))}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
                    >
                      <option value="US">US</option>
                      <option value="UK">UK</option>
                      <option value="SG">SG</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/70">Locale</label>
                    <select
                      value={form.locale}
                      onChange={event => setForm(current => ({ ...current, locale: event.target.value }))}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
                    >
                      <option value="en_US">en_US</option>
                      <option value="en_GB">en_GB</option>
                      <option value="en_SG">en_SG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">Version Label</label>
                  <input
                    value={form.versionLabel}
                    onChange={event => setForm(current => ({ ...current, versionLabel: event.target.value }))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
                    placeholder="Batch Draft v1"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">Title Template</label>
                  <input
                    value={form.titleTemplate}
                    onChange={event => setForm(current => ({ ...current, titleTemplate: event.target.value }))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">Description Template</label>
                  <textarea
                    rows={4}
                    value={form.descriptionTemplate}
                    onChange={event => setForm(current => ({ ...current, descriptionTemplate: event.target.value }))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">Bullet Template</label>
                  <textarea
                    rows={6}
                    value={form.bulletTemplateText}
                    onChange={event => setForm(current => ({ ...current, bulletTemplateText: event.target.value }))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
                  />
                  <div className="mt-1 text-xs text-white/35">One bullet per line.</div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/70">Keywords</label>
                  <textarea
                    rows={3}
                    value={form.keywordText}
                    onChange={event => setForm(current => ({ ...current, keywordText: event.target.value }))}
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/25"
                    placeholder="One keyword per line, or comma-separated"
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm text-white/65">
                    <input
                      type="checkbox"
                      checked={form.includeProductTags}
                      onChange={event => setForm(current => ({ ...current, includeProductTags: event.target.checked }))}
                    />
                    Append product tags into keywords
                  </label>
                </div>

                <button
                  onClick={handleBatchCreate}
                  disabled={creating || selectedProducts.length === 0}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Creating batch drafts...' : 'Create Listing Versions For Selected Products'}
                </button>
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Preview</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Check one rendered draft before sending the batch request.
                  </p>
                </div>
                {selectedProducts.length > 0 ? (
                  <select
                    value={previewProductID}
                    onChange={event => setPreviewProductID(event.target.value)}
                    className="rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
                  >
                    {selectedProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.skuCode} · {product.title}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="mt-5">
                {!previewProduct || !previewDraft ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-10 text-center text-sm text-white/40">
                    Select at least one product to preview the rendered listing draft.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/30">Product</div>
                      <div className="mt-2 text-sm text-white/70">
                        {previewProduct.title} · {previewProduct.skuCode}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/30">Title</div>
                      <div className="mt-2 text-white">{previewDraft.title || '-'}</div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/30">Description</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">
                        {previewDraft.description || '-'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
                        <FileText className="h-3.5 w-3.5" />
                        Bullet Points
                      </div>
                      <div className="mt-3 space-y-2">
                        {previewDraft.bulletPoints.length > 0 ? (
                          previewDraft.bulletPoints.map(point => (
                            <div key={point} className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2 text-sm text-white/70">
                              {point}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-white/40">No bullet points rendered.</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/30">Keywords</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previewDraft.keywords.length > 0 ? (
                          previewDraft.keywords.map(keyword => (
                            <span key={keyword} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-white/40">No keywords rendered.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <h2 className="text-lg font-semibold text-white">Context Links</h2>
              <div className="mt-4 space-y-3 text-sm text-white/55">
                <Link to="/products" className="flex items-center gap-2 text-brand-300 hover:text-brand-200">
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                  Back to Product Center
                </Link>
                <Link to="/products/workbench/downloads" className="flex items-center gap-2 text-brand-300 hover:text-brand-200">
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                  Open Download Center
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
