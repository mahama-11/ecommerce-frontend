import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, CheckCircle2, Image as ImageIcon, LoaderCircle, LockKeyhole, Package, Sparkles, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import { listProducts } from '@/services/product'
import type { ProductListItem } from '@/types/product'
import { Button } from '@/components/ui/Button'

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
  const selectedToolIsVideo = selectedTool?.category === 'video'

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
    if (!selectedProduct || !selectedTool || selectedToolIsVideo) return
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
      className="relative flex min-h-[calc(100vh-52px)] flex-col overflow-x-hidden bg-[var(--ecom-bg)] text-[var(--ecom-text-primary)]"
    >
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>
      <motion.div variants={itemVariants} className="relative z-10 mx-auto mt-6 w-[calc(100%-2.5rem)] max-w-[1600px] rounded-[32px] border border-white/10 bg-[var(--ecom-surface)] px-6 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] ring-1 ring-cyan-300/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-[1600px] mx-auto">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/65">Visual Station · SKU-bound generation</div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-cyan-200" />
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
              to="/aiChat/template"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t('product.visualTools.batchListing')}
            </Link>
            <Link
              to={`/products/workbench/downloads${selectedProductID ? `?productIds=${encodeURIComponent(selectedProductID)}&source=visual` : '?source=visual'}`}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t('product.visualTools.downloadCenter')}
            </Link>
            {selectedProduct ? (
              <Link
                to={`/products/${selectedProduct.id}`}
                className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-brand-500/20"
              >
                {t('product.visualTools.openSelectedProduct')}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mx-auto mt-5 grid max-w-[1600px] gap-3 md:grid-cols-3">
          {[
            { title: t('product.visualTools.pipeline.bindSkuTitle'), desc: selectedProduct ? selectedProduct.skuCode : t('product.visualTools.pipeline.selectRealProduct'), tone: 'border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100' },
            { title: t('product.visualTools.pipeline.chooseStationTitle'), desc: selectedTool ? getLocalizedTool(selectedTool, i18n.language).name : t('product.visualTools.pipeline.noStation'), tone: 'border-brand-300/20 bg-brand-300/[0.06] text-brand-100' },
            { title: t('product.visualTools.pipeline.imageLiveTitle'), desc: t('product.visualTools.pipeline.imageLiveDesc'), tone: 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100' },
          ].map(item => (
            <div key={item.title} className={`rounded-2xl border px-4 py-3 ${item.tone}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{item.title}</div>
              <div className="mt-1 text-sm font-medium text-white/85">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex w-full max-w-[1600px] mx-auto relative p-4 sm:p-6">
        <div className="flex w-full min-w-0 gap-6 flex-col xl:flex-row">
          {/* Main List */}
          <motion.div variants={itemVariants} className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] p-4 shadow-2xl backdrop-blur-md sm:p-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">{t('product.visualTools.sourceStripTitle')}</div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-100/75">{t('product.visualTools.imageRuntimeLive')}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[t('product.visualTools.sourceSlots.primary'), t('product.visualTools.sourceSlots.lifestyle'), t('product.visualTools.sourceSlots.video')].map((label, index) => (
                  <div key={label} className={`min-h-[86px] rounded-2xl border p-3 ${index < (selectedProduct?.assetsCount ?? 0) ? 'border-emerald-300/20 bg-emerald-300/[0.07]' : index === 2 ? 'border-amber-300/20 bg-amber-300/[0.07]' : 'border-white/8 bg-white/[0.03]'}`}>
                    <div className="text-xs font-semibold text-white/70">{label}</div>
                    <div className="mt-2 text-[11px] leading-5 text-white/45">{index < (selectedProduct?.assetsCount ?? 0) ? t('product.visualTools.sourceSlots.available') : index === 2 ? t('product.visualTools.sourceSlots.videoNeeded') : t('product.visualTools.sourceSlots.empty')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
              <div className="mb-3 text-sm font-medium text-white">{t('product.visualTools.boundProduct')}</div>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-white/45">
                  <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
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
                    className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white/90 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 transition focus:border-brand-500/50"
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
                        <Package className="h-4 w-4 text-cyan-200" />
                        <span className="font-medium">{selectedProduct.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/40">{selectedProduct.skuCode}</div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                        <span className="px-2 py-1 rounded bg-white/5">{selectedProduct.assetStatus} {t('product.list.table.assets')}</span>
                        <span className="px-2 py-1 rounded bg-white/5">{selectedProduct.listingStatus} {t('product.list.table.listing')}</span>
                        <span className="px-2 py-1 rounded bg-white/5">{selectedProduct.status}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-8">
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
                        <Button
                          key={tool.id}
                          type="button"
                          onClick={() => setSelectedToolSlug(tool.slug)}
                          className={`h-auto min-h-[112px] w-full items-stretch justify-start whitespace-normal rounded-xl border p-4 text-left transition-colors ${
                            active
                              ? 'border-brand-500/40 bg-brand-500/10 shadow-[0_0_15px_rgba(var(--brand-500),0.15)]'
                              : 'border-white/10 bg-white/[0.02] hover:bg-[var(--ecom-surface-hover)]'
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl leading-none">
                              {tool.icon}
                            </div>
                            <div className="min-w-0 flex-1 mt-0.5">
                              <div className={`break-words font-medium leading-snug ${active ? 'text-brand-300' : 'text-white/90'}`}>{localized.name}</div>
                              <div className="mt-1.5 text-xs text-white/40 leading-relaxed line-clamp-2">{localized.desc}</div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div variants={itemVariants} className="flex min-w-0 flex-shrink-0 flex-col gap-6 xl:w-[360px]">
            <div className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] backdrop-blur-md p-6 shadow-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 mb-5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                <span>{t('product.visualTools.selectedTool')}</span>
              </div>
              
              {selectedTool ? (
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl leading-none shadow-inner">
                      {selectedTool.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="break-words text-lg font-semibold leading-snug text-white/90">{getLocalizedTool(selectedTool, i18n.language).name}</div>
                      <div className="mt-1 truncate text-xs font-mono text-white/40">{selectedTool.slug}</div>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-white/50">
                    {t('product.visualTools.toolLaunchDesc')}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 space-y-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
                  <ImageIcon className="h-4 w-4" /> {t('product.visualTools.realSkuBinding')}
                </div>
                <div className="text-sm font-semibold text-white">{selectedProduct ? selectedProduct.title : t('product.visualTools.selectSkuBeforeLaunch')}</div>
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <div className="min-w-0 rounded-xl border border-white/8 bg-black/20 p-2"><div className="truncate text-white/35">{t('product.visualTools.metrics.assets')}</div><div className="mt-1 truncate text-white">{selectedProduct?.assetsCount ?? 0}</div></div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-black/20 p-2"><div className="truncate text-white/35">{t('product.visualTools.metrics.listing')}</div><div className="mt-1 truncate text-white">{selectedProduct?.listingVersionsCount ?? 0}</div></div>
                  <div className="min-w-0 rounded-xl border border-white/8 bg-black/20 p-2"><div className="truncate text-white/35">{t('product.visualTools.metrics.export')}</div><div className="mt-1 truncate text-white">{selectedProduct?.exportStatus ?? t('product.visualTools.pending')}</div></div>
                </div>
              </div>

              <Button
                onClick={openWorkspace}
                disabled={!selectedProduct || !selectedTool || selectedToolIsVideo}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_20px_rgba(var(--brand-500),0.2)]"
              >
                {selectedToolIsVideo ? t('product.visualTools.videoContractNeeded') : t('product.visualTools.startImageGeneration')}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                disabled
                className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm font-semibold text-amber-100/55"
                title={t('product.visualTools.videoProviderNotWired')}
              >
                <Video className="h-4 w-4" /> {t('product.visualTools.videoWorkspaceContractNeeded')}
              </Button>

              {selectedProduct ? (
                <div className="mt-4 grid gap-3">
                  <Link
                    to={`/products/${selectedProduct.id}`}
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {t('product.visualTools.viewProductDetail')}
                  </Link>
                  <Link
                    to={`/products/workbench/downloads?productIds=${encodeURIComponent(selectedProduct.id)}&source=visual`}
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {t('product.visualTools.openDownloadCenter')}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] backdrop-blur-md p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2 text-white/90">
                <Bot className="h-4 w-4 text-cyan-200" />
                <h3 className="font-semibold">{t('product.visualTools.taskQueueTitle')}</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-3">
                  <div className="font-semibold text-cyan-100">{t('product.visualTools.imageJobLiveTitle')}</div>
                  <div className="mt-1 text-cyan-100/55">{t('product.visualTools.imageJobLiveDesc')}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="font-semibold text-white/75">{t('product.visualTools.reviewBoardTitle')}</div>
                  <div className="mt-1 text-white/45">{t('product.visualTools.reviewBoardDesc')}</div>
                </div>
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-amber-100/70">{t('product.visualTools.videoQueueDisabled')}</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] backdrop-blur-md p-6 shadow-xl">
              <div className="flex items-center gap-2 text-white/90 mb-4">
                <Bot className="h-4 w-4 text-cyan-200" />
                <h3 className="font-semibold">{t('product.visualTools.workflowRule')}</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/50 list-disc list-inside pl-1">
                <li>{t('product.visualTools.rules.rule1')}</li>
                <li>{t('product.visualTools.rules.rule2')}</li>
                <li>{t('product.visualTools.rules.rule3')}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <CheckCircle2 className="h-4 w-4" /> {t('product.visualTools.attachBackTitle')}
              </div>
              <div className="space-y-3 text-xs leading-5 text-emerald-100/65">
                <p>{t('product.visualTools.attachBackDesc')}</p>
                <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-100/75"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> {t('product.visualTools.batchVideoDisabled')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
