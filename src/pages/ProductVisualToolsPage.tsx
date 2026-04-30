import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, LoaderCircle, Package, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import { listProducts } from '@/services/product'
import type { ProductListItem } from '@/types/product'

export default function ProductVisualToolsPage() {
  const { t, i18n } = useTranslation()
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
      className="flex flex-col h-full text-white overflow-hidden"
    >
      <motion.div variants={itemVariants} className="flex-none px-6 py-6 border-b border-white/5 bg-[#0a0a12]/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-brand-400" />
              {t('product.visualTools.title')}
            </h1>
            <p className="mt-2 text-sm text-white/50 max-w-3xl">
              {t('product.visualTools.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t('product.visualTools.productHome')}
            </Link>
            <Link
              to="/products/workbench/batch-listing"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t('product.visualTools.batchListing')}
            </Link>
            <Link
              to="/products/workbench/downloads"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t('product.visualTools.downloadCenter')}
            </Link>
            {selectedProduct ? (
              <Link
                to={`/products/${selectedProduct.id}`}
                className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm text-brand-200 transition hover:bg-brand-500/20"
              >
                {t('product.visualTools.openSelectedProduct')}
              </Link>
            ) : null}
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto relative p-6">
        <div className="flex-1 flex gap-6 overflow-hidden h-full flex-col xl:flex-row">
          {/* Main List */}
          <motion.div variants={itemVariants} className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md shadow-2xl p-6 flex flex-col min-w-0">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
              <div className="mb-3 text-sm font-medium text-white">{t('product.visualTools.boundProduct')}</div>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-white/45">
                  <LoaderCircle className="h-4 w-4 animate-spin text-brand-400" />
                  {t('product.visualTools.loadingProducts')}
                </div>
              ) : products.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-white/45">{t('product.visualTools.noProducts')}</div>
                  <Link
                    to="/products"
                    className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400"
                  >
                    {t('product.visualTools.createProduct')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <select
                    value={selectedProductID}
                    onChange={event => setSelectedProductID(event.target.value)}
                    className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-brand-500/50"
                  >
                    {products.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.skuCode} · {item.title}
                      </option>
                    ))}
                  </select>
                  {selectedProduct ? (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Package className="h-4 w-4 text-brand-400" />
                        <span className="font-medium">{selectedProduct.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/40">{selectedProduct.skuCode}</div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                        <span className="px-2 py-1 rounded bg-white/5">{selectedProduct.assetStatus} {t('product.list.table.assets')}</span>
                        <span className="px-2 py-1 rounded bg-white/5">{selectedProduct.listingStatus} {t('product.list.table.listing')}</span>
                        <span className="px-2 py-1 rounded bg-white/5">{t(`product.status.${selectedProduct.status}`)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto space-y-8 pr-2">
              {groupedTools.map(([category, items]) => (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-4 w-1 bg-brand-500 rounded-full" />
                    <span className="text-sm font-medium text-white/90">{t(`toolCategories.${category}` as any, category)}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map(tool => {
                      const localized = getLocalizedTool(tool, i18n.language)
                      const active = tool.slug === selectedToolSlug
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => setSelectedToolSlug(tool.slug)}
                          className={`rounded-xl border p-4 text-left transition-all ${
                            active
                              ? 'border-brand-500/40 bg-brand-500/10 shadow-[0_0_15px_rgba(var(--brand-500),0.15)]'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl">
                              {tool.icon}
                            </div>
                            <div className="min-w-0 flex-1 mt-0.5">
                              <div className={`font-medium ${active ? 'text-brand-300' : 'text-white/90'}`}>{localized.name}</div>
                              <div className="mt-1.5 text-xs text-white/40 leading-relaxed line-clamp-2">{localized.desc}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div variants={itemVariants} className="xl:w-[360px] flex-shrink-0 flex flex-col gap-6 h-full overflow-y-auto">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md p-6 shadow-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 mb-5">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{t('product.visualTools.selectedTool')}</span>
              </div>
              
              {selectedTool ? (
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl shadow-inner">
                      {selectedTool.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-white/90">{getLocalizedTool(selectedTool, i18n.language).name}</div>
                      <div className="mt-1 text-xs font-mono text-white/40">{selectedTool.slug}</div>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-white/50">
                    {t('product.visualTools.toolLaunchDesc')}
                  </p>
                </div>
              ) : null}

              <button
                onClick={openWorkspace}
                disabled={!selectedProduct || !selectedTool}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(var(--brand-500),0.2)]"
              >
                {t('product.visualTools.openWorkspace')}
                <ArrowRight className="h-4 w-4" />
              </button>

              {selectedProduct ? (
                <div className="mt-4 grid gap-3">
                  <Link
                    to={`/products/${selectedProduct.id}`}
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {t('product.visualTools.viewProductDetail')}
                  </Link>
                  <Link
                    to="/products/workbench/downloads"
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {t('product.visualTools.openDownloadCenter')}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md p-6 shadow-xl">
              <div className="flex items-center gap-2 text-white/90 mb-4">
                <Bot className="h-4 w-4 text-brand-400" />
                <h3 className="font-semibold">{t('product.visualTools.workflowRule')}</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/50 list-disc list-inside pl-1">
                <li>{t('product.visualTools.rules.rule1')}</li>
                <li>{t('product.visualTools.rules.rule2')}</li>
                <li>{t('product.visualTools.rules.rule3')}</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
