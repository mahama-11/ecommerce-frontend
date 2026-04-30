import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bot, LoaderCircle, Package, Sparkles } from 'lucide-react'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import { listProducts } from '@/services/product'
import type { ProductListItem } from '@/types/product'

const CATEGORY_LABELS: Record<string, string> = {
  model: 'Model',
  product: 'Product',
  suite: 'Suite',
  video: 'Video',
  designer: 'Designer',
}

export default function ProductVisualToolsPage() {
  const navigate = useNavigate()
  const { toolSlug } = useParams()
  const [searchParams] = useSearchParams()
  const presetProductID = searchParams.get('productId') ?? ''

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductID, setSelectedProductID] = useState('')
  const [selectedToolSlug, setSelectedToolSlug] = useState(toolSlug ?? TOOLS[0]?.slug ?? '')

  useEffect(() => {
    setSelectedToolSlug(toolSlug ?? TOOLS[0]?.slug ?? '')
  }, [toolSlug])

  useEffect(() => {
    let canceled = false

    async function load() {
      setLoading(true)
      try {
        const items = await listProducts()
        if (canceled) return
        setProducts(items)
        setSelectedProductID(current => {
          if (presetProductID && items.some(item => item.id === presetProductID)) {
            return presetProductID
          }
          if (current && items.some(item => item.id === current)) {
            return current
          }
          return items[0]?.id ?? ''
        })
      } catch (error) {
        console.error('Failed to load products for visual tools:', error)
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      canceled = true
    }
  }, [presetProductID])

  const selectedProduct = products.find(item => item.id === selectedProductID) ?? null
  const selectedTool = TOOLS.find(item => item.slug === selectedToolSlug) ?? TOOLS[0]

  const groupedTools = useMemo(() => {
    return Object.entries(
      TOOLS.reduce<Record<string, typeof TOOLS>>((acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = []
        }
        acc[tool.category].push(tool)
        return acc
      }, {}),
    )
  }, [])

  function openWorkspace() {
    if (!selectedProduct || !selectedTool) return
    navigate(`/products/${selectedProduct.id}/ai/${selectedTool.slug}`)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <section className="glass rounded-3xl p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Visual Production Inside Product Context</h2>
            <p className="mt-1 text-sm text-white/45">
              Select a SKU first, then open the exact AI tool inside the product workflow.
              This replaces the old standalone `draw` entry.
            </p>
          </div>
          <Link to="/products" className="text-sm text-brand-300 hover:text-brand-200">
            Back to products
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/products"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
          >
            Product home
          </Link>
          <Link
            to="/products/workbench/batch-listing"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
          >
            Batch listing
          </Link>
          <Link
            to="/products/workbench/downloads"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
          >
            Download center
          </Link>
          {selectedProduct ? (
            <Link
              to={`/products/${selectedProduct.id}`}
              className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20"
            >
              Open selected product
            </Link>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="mb-2 text-sm font-medium text-white">Bound Product</div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/45">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-400" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-white/45">No products available yet. Create a SKU before opening visual production.</div>
              <Link
                to="/products"
                className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Create or manage products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedProductID}
                onChange={event => setSelectedProductID(event.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-[#0f0f18] px-4 py-3 text-sm text-white/80 outline-none"
              >
                {products.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.skuCode} · {item.title}
                  </option>
                ))}
              </select>
              {selectedProduct ? (
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Package className="h-4 w-4 text-brand-300" />
                    <span className="font-medium">{selectedProduct.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">{selectedProduct.skuCode}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
                    <span>{selectedProduct.assetStatus} assets</span>
                    <span>{selectedProduct.listingStatus} listing</span>
                    <span>{selectedProduct.status} product</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {groupedTools.map(([category, items]) => (
            <div key={category}>
              <div className="mb-3 text-sm font-medium text-white/70">{CATEGORY_LABELS[category] ?? category}</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map(tool => {
                  const localized = getLocalizedTool(tool, 'zh')
                  const active = tool.slug === selectedToolSlug
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setSelectedToolSlug(tool.slug)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-brand-500/40 bg-brand-500/10'
                          : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-xl">
                          {tool.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white">{localized.name}</div>
                          <div className="mt-1 text-xs text-white/40">{localized.desc}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="glass rounded-3xl p-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Selected Tool</span>
          </div>
          {selectedTool ? (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl">
                  {selectedTool.icon}
                </div>
                <div>
                  <div className="font-semibold text-white">{getLocalizedTool(selectedTool, 'zh').name}</div>
                  <div className="mt-1 text-sm text-white/45">{selectedTool.slug}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/55">
                Launch this tool inside the selected product. Source images, runtime jobs,
                generated assets, and follow-up downloads stay attached to the SKU.
              </p>
            </div>
          ) : null}

          <button
            onClick={openWorkspace}
            disabled={!selectedProduct || !selectedTool}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open Product AI Workspace
            <ArrowRight className="h-4 w-4" />
          </button>

          {selectedProduct ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link
                to={`/products/${selectedProduct.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
              >
                View product detail
              </Link>
              <Link
                to="/products/workbench/downloads"
                className="inline-flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
              >
                Open download center
              </Link>
            </div>
          ) : null}
        </section>

        <section className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 text-white">
            <Bot className="h-4 w-4 text-brand-300" />
            <h3 className="font-semibold">Workflow Rule</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-white/55">
            <li>Bind product first, then upload source assets.</li>
            <li>Keep generation history under the product workspace.</li>
            <li>Return all outputs to assets, listing, and download flows.</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
