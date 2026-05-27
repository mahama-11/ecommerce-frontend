import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Image as ImageIcon, Package, Sparkles, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TOOLS, getLocalizedTool } from '@/mock/data'
import { Button } from '@/components/ui/Button'
import { listProducts } from '@/services/product'
import type { ProductListItem } from '@/types/product'
import {
  GenerationActionDock,
  ProductAssetStrip,
  ProductHeroStage,
  RecommendedToolRail,
  ResultDestinationCard,
  SoftInspectorPanel,
  ToolCategoryCarousel,
  VisualOutcomePreview,
  WorkflowProgressRail,
} from '@/components/product-composition'

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
          if (presetProductID && items.some(item => item.id === presetProductID)) return presetProductID
          if (current && items.some(item => item.id === current)) return current
          return items[0]?.id ?? ''
        })
      } catch (error) {
        console.error('Failed to load products for visual tools:', error)
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    void load()
    return () => { canceled = true }
  }, [presetProductID])

  const selectedProduct = products.find(item => item.id === selectedProductID) ?? null
  const selectedTool = TOOLS.find(item => item.slug === selectedToolSlug) ?? TOOLS[0]
  const selectedToolIsVideo = selectedTool?.category === 'video'
  const localizedSelectedTool = selectedTool ? getLocalizedTool(selectedTool, i18n.language) : null

  const groupedTools = useMemo(() => Object.entries(
    TOOLS.reduce<Record<string, typeof TOOLS>>((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = []
      acc[tool.category].push(tool)
      return acc
    }, {}),
  ), [])

  const recommendedTools = useMemo(() => {
    const slugs = ['changing-model', 'ai-wearable', 'ai-product']
    return slugs.map(slug => TOOLS.find(tool => tool.slug === slug)).filter(Boolean) as typeof TOOLS
  }, [])

  function openWorkspace() {
    if (!selectedProduct || !selectedTool || selectedToolIsVideo) return
    navigate(`/products/${selectedProduct.id}/ai/${selectedTool.slug}`)
  }

  const assetCount = selectedProduct?.assetsCount ?? 0
  const stageSteps = [
    { label: t('product.visualToolsStudio.steps.product'), desc: selectedProduct ? selectedProduct.skuCode : t('product.visualToolsStudio.steps.chooseProduct'), status: selectedProduct ? 'done' as const : 'active' as const },
    { label: t('product.visualToolsStudio.steps.visualGoal'), desc: localizedSelectedTool?.name ?? t('product.visualToolsStudio.steps.chooseGoal'), status: selectedTool ? 'active' as const : 'locked' as const },
    { label: t('product.visualToolsStudio.steps.result'), desc: t('product.visualToolsStudio.steps.resultDesc'), status: selectedProduct && selectedTool ? 'locked' as const : 'locked' as const },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-page-shell="production-station"
      className="relative min-h-[calc(100vh-52px)] overflow-x-hidden bg-[var(--ecom-bg)] text-[var(--ecom-text-primary)]"
    >
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6">
        <ProductHeroStage
          eyebrow={t('product.visualToolsStudio.eyebrow')}
          title={t('product.visualToolsStudio.title')}
          description={t('product.visualToolsStudio.subtitle')}
          objectLabel={selectedProduct ? t('product.visualToolsStudio.currentProduct') : t('product.visualToolsStudio.noProductLabel')}
          objectValue={selectedProduct ? `${selectedProduct.skuCode} · ${selectedProduct.title}` : t('product.visualToolsStudio.chooseProductFirst')}
          primaryAction={{ label: selectedProduct ? t('product.visualToolsStudio.primaryReady') : t('product.visualToolsStudio.primaryChooseProduct'), onClick: selectedProduct ? openWorkspace : () => navigate('/products'), disabled: selectedProduct ? !selectedTool || selectedToolIsVideo : false }}
          secondary={<div className="flex flex-wrap gap-2 text-sm">
            <Link to="/products" className="rounded-2xl border border-white/10 bg-white/[.055] px-4 py-2 text-white/68 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white">{t('product.visualTools.productHome')}</Link>
            <Link to="/aiChat/template" className="rounded-2xl border border-white/10 bg-white/[.055] px-4 py-2 text-white/68 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white">{t('product.visualTools.batchListing')}</Link>
            <Link to={`/products/workbench/downloads${selectedProductID ? `?productIds=${encodeURIComponent(selectedProductID)}&source=visual` : '?source=visual'}`} className="rounded-2xl border border-white/10 bg-white/[.055] px-4 py-2 text-white/68 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white">{t('product.visualTools.downloadCenter')}</Link>
          </div>}
        >
          <WorkflowProgressRail steps={stageSteps} />
        </ProductHeroStage>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
              <VisualOutcomePreview
                title={t('product.visualToolsStudio.previewTitle')}
                subtitle={selectedProduct ? t('product.visualToolsStudio.previewDescReady') : t('product.visualToolsStudio.previewDescEmpty')}
                selectedLabel={localizedSelectedTool?.name ?? t('product.visualToolsStudio.chooseGoal')}
              />

              <div className="rounded-[30px] border border-white/10 bg-white/[.055] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <ImageIcon className="h-4 w-4 text-cyan-100" />
                    {t('product.visualToolsStudio.assetTitle')}
                  </div>
                  {loading ? <span className="text-xs text-white/40">{t('product.visualTools.loadingProducts')}</span> : null}
                </div>
                <ProductAssetStrip
                  assets={[
                    { label: t('product.visualTools.sourceSlots.primary'), desc: assetCount > 0 ? t('product.visualTools.sourceSlots.available') : t('product.visualTools.sourceSlots.empty'), status: assetCount > 0 ? 'ready' : 'needed' },
                    { label: t('product.visualTools.sourceSlots.lifestyle'), desc: assetCount > 1 ? t('product.visualTools.sourceSlots.available') : t('product.visualTools.sourceSlots.empty'), status: assetCount > 1 ? 'ready' : 'optional' },
                    { label: t('product.visualTools.sourceSlots.video'), desc: t('product.visualToolsStudio.videoLater'), status: 'optional' },
                  ]}
                />
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold text-white/52" htmlFor="visual-tools-product">{t('product.visualToolsStudio.productSelector')}</label>
                  {products.length > 0 ? (
                    <select
                      id="visual-tools-product"
                      value={selectedProductID}
                      onChange={event => setSelectedProductID(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/88 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-200/55"
                    >
                      {products.map(item => <option key={item.id} value={item.id}>{item.skuCode} · {item.title}</option>)}
                    </select>
                  ) : (
                    <Link to="/products" className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50">{t('product.visualTools.createProduct')}</Link>
                  )}
                </div>
              </div>
            </div>

            <section className="rounded-[30px] border border-white/10 bg-white/[.045] p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('product.visualToolsStudio.recommendedTitle')}</h2>
                  <p className="mt-1 text-sm text-white/48">{t('product.visualToolsStudio.recommendedDesc')}</p>
                </div>
              </div>
              <RecommendedToolRail
                tools={recommendedTools.map(tool => {
                  const localized = getLocalizedTool(tool, i18n.language)
                  return {
                    id: tool.id,
                    title: localized.name,
                    desc: localized.desc,
                    icon: tool.icon,
                    active: tool.slug === selectedToolSlug,
                    recommended: true,
                    onClick: () => setSelectedToolSlug(tool.slug),
                  }
                })}
              />
            </section>

            <details className="group rounded-[30px] border border-white/10 bg-white/[.03] p-5">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white/78 marker:hidden">
                {t('product.visualToolsStudio.exploreMore')}
                <span className="ml-3 text-xs font-normal text-white/42">{t('product.visualToolsStudio.exploreMoreHint')}</span>
              </summary>
              <div className="mt-6 space-y-7">
                {groupedTools.map(([category, items]) => (
                  <ToolCategoryCarousel key={category} title={t(`toolCategories.${category}` as any, category)}>
                    {items.map(tool => {
                      const localized = getLocalizedTool(tool, i18n.language)
                      const active = tool.slug === selectedToolSlug
                      const disabled = tool.category === 'video'
                      return (
                        <Button
                          key={tool.id}
                          type="button"
                          onClick={() => setSelectedToolSlug(tool.slug)}
                          className={`h-auto min-h-[108px] w-full items-stretch justify-start whitespace-normal rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 ${active ? 'border-cyan-200/40 bg-cyan-200/[.10]' : 'border-white/10 bg-white/[.035] hover:bg-[var(--ecom-surface-hover)]'} ${disabled ? 'opacity-55' : ''}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/22 text-xl">{tool.icon}</div>
                            <div className="min-w-0">
                              <div className="break-words text-sm font-semibold leading-snug text-white/88">{localized.name}</div>
                              <div className="mt-1.5 text-xs leading-5 text-white/42">{disabled ? t('product.visualToolsStudio.comingSoon') : localized.desc}</div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </ToolCategoryCarousel>
                ))}
              </div>
            </details>
          </section>

          <div className="space-y-5">
            <SoftInspectorPanel title={t('product.visualToolsStudio.inspectorTitle')}>
              {selectedTool ? (
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-black/22 text-2xl">{selectedTool.icon}</div>
                  <div className="min-w-0">
                    <div className="break-words text-lg font-semibold leading-snug text-white">{localizedSelectedTool?.name}</div>
                    <p className="mt-2 text-sm leading-6 text-white/48">{selectedToolIsVideo ? t('product.visualToolsStudio.comingSoon') : localizedSelectedTool?.desc}</p>
                  </div>
                </div>
              ) : null}
              <div className="mt-5 rounded-[22px] bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/60"><Package className="h-4 w-4 text-cyan-100" />{t('product.visualToolsStudio.currentProduct')}</div>
                <div className="text-sm font-semibold text-white/90">{selectedProduct ? selectedProduct.title : t('product.visualToolsStudio.chooseProductFirst')}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-2xl bg-white/[.055] p-2"><div className="text-white/36">{t('product.visualTools.metrics.assets')}</div><div className="mt-1 truncate text-white/86">{assetCount}</div></div>
                  <div className="rounded-2xl bg-white/[.055] p-2"><div className="text-white/36">{t('product.visualTools.metrics.listing')}</div><div className="mt-1 truncate text-white/86">{selectedProduct?.listingVersionsCount ?? 0}</div></div>
                  <div className="rounded-2xl bg-white/[.055] p-2"><div className="text-white/36">{t('product.visualTools.metrics.export')}</div><div className="mt-1 truncate text-white/86">{selectedProduct?.exportStatus ?? t('product.visualTools.pending')}</div></div>
                </div>
              </div>
            </SoftInspectorPanel>

            <GenerationActionDock
              primaryAction={{ label: selectedToolIsVideo ? t('product.visualToolsStudio.comingSoon') : t('product.visualToolsStudio.primaryReady'), onClick: openWorkspace, disabled: !selectedProduct || !selectedTool || selectedToolIsVideo }}
              note={selectedProduct ? t('product.visualToolsStudio.actionNoteReady') : t('product.visualToolsStudio.actionNoteEmpty')}
            />

            <ResultDestinationCard title={t('product.visualToolsStudio.destinationTitle')} description={t('product.visualToolsStudio.destinationDesc')} />

            <SoftInspectorPanel title={t('product.visualToolsStudio.helpTitle')}>
              <div className="space-y-3 text-sm leading-6 text-white/52">
                <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-100" />{t('product.visualToolsStudio.helpProduct')}</p>
                <p><Sparkles className="mr-2 inline h-4 w-4 text-cyan-100" />{t('product.visualToolsStudio.helpGoal')}</p>
                <p><Video className="mr-2 inline h-4 w-4 text-amber-100" />{t('product.visualToolsStudio.helpVideo')}</p>
              </div>
            </SoftInspectorPanel>

            {selectedProduct ? <Link to={`/products/${selectedProduct.id}`} className="flex items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white/68 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white">{t('product.visualTools.viewProductDetail')}<ArrowRight className="h-4 w-4" /></Link> : null}
          </div>
        </div>
      </main>
    </motion.div>
  )
}
