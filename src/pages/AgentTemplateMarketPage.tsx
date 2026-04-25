import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Filter,
  Heart,
  LayoutGrid,
  Search,
  Sparkles,
  Star,
  X,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import DetailDrawer from '@/components/DetailDrawer'
import {
  addFavoriteTemplate,
  copyTemplateToMyTemplates,
  getTemplateDetail,
  listCatalog,
  listCatalogFacets,
  listFavoriteTemplates,
  listRecommendations,
  removeFavoriteTemplate,
  saveUseTemplatePayload,
  useTemplateNow,
  type CatalogFacetBucket,
  type TemplateCatalogFacets,
  type TemplateDetail,
  type TemplateListItem,
} from '@/services/templateCenter'

type Locale = 'zh' | 'en'

const PLATFORM_GROUPS = [
  {
    key: 'amazon',
    emoji: '🛒',
    zh: '亚马逊',
    en: 'Amazon',
    metrics: { zh: 'Amazon', en: 'Amazon' },
  },
  {
    key: 'walmart',
    emoji: '🏬',
    zh: '沃尔玛',
    en: 'Walmart',
    metrics: { zh: 'Walmart', en: 'Walmart' },
  },
  {
    key: 'tiktok-shop',
    emoji: '🎵',
    zh: 'TikTok / TikTok Shop',
    en: 'TikTok / TikTok Shop',
    metrics: { zh: 'TikTok', en: 'TikTok' },
  },
  {
    key: 'independent',
    emoji: '🌐',
    zh: '独立站 / SEO',
    en: 'DTC / SEO',
    metrics: { zh: 'DTC', en: 'DTC' },
  },
] as const

const PLATFORM_FILTERS = ['all', ...PLATFORM_GROUPS.map(item => item.key)] as const

const MODALITY_FILTERS = [
  { key: 'image', zh: '图片模板', en: 'Image' },
  { key: 'text', zh: '文本模板', en: 'Text' },
  { key: 'workflow', zh: '工作流模板', en: 'Workflow' },
] as const

function copy(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

function formatCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

function primaryPlatform(item: TemplateListItem) {
  return item.platformTags[0] ?? 'official'
}

function templateType(locale: Locale, item: TemplateListItem) {
  const modalityMap: Record<TemplateListItem['modality'], string> = {
    text: copy(locale, '文本', 'Text'),
    image: copy(locale, '图片', 'Image'),
    video: copy(locale, '视频', 'Video'),
    workflow: copy(locale, '工作流', 'Workflow'),
  }
  return `${modalityMap[item.modality]} / ${item.executorType}`
}

function displayFacetLabel(locale: Locale, bucket: CatalogFacetBucket) {
  const mapping: Record<string, { zh: string; en: string }> = {
    model_image: { zh: '模特图', en: 'Model Image' },
    product_image: { zh: '商品图', en: 'Product Image' },
    workflow_suite: { zh: '套图工作流', en: 'Workflow Suite' },
    model_swap: { zh: '换模特', en: 'Model Swap' },
    mannequin_to_model: { zh: '人台转真人', en: 'Mannequin To Model' },
    background_replace: { zh: '换背景', en: 'Background Replace' },
    virtual_tryon: { zh: 'AI 穿衣', en: 'Virtual Try-On' },
    accessory_on_model: { zh: '穿戴商品', en: 'Accessory On Model' },
    pose_variation: { zh: '姿势裂变', en: 'Pose Variation' },
    product_scene_compositing: { zh: '场景合成', en: 'Scene Compositing' },
    product_swap: { zh: '商品替换', en: 'Product Replace' },
    scene_multiplication: { zh: '场景裂变', en: 'Scene Fission' },
    scene_asset_generation: { zh: '场景素材生成', en: 'Scene Asset Generation' },
    hand_hold_product: { zh: '手持商品', en: 'Handheld Product' },
    product_retouch: { zh: '商品精修', en: 'Product Retouch' },
    clothing_photo_package: { zh: '服装套图', en: 'Clothing Suite' },
    product_photo_package: { zh: '商品套图', en: 'Product Suite' },
  }
  const mapped = mapping[bucket.key]
  if (mapped) return copy(locale, mapped.zh, mapped.en)
  return bucket.label.replaceAll('_', ' ')
}

function readInputFields(detail: TemplateDetail | null) {
  const fields = detail?.schema.inputSchema?.fields
  return Array.isArray(fields) ? fields : []
}

function readExecutionFlag(detail: TemplateDetail | null, key: 'route' | 'toolSlug') {
  const value = detail?.schema.executionSchema?.[key]
  return typeof value === 'string' ? value : ''
}

function readBoolean(detail: TemplateDetail | null, key: 'supportsAsyncJob' | 'supportsBatch') {
  const value = detail?.schema.executionSchema?.[key]
  return typeof value === 'boolean' ? value : false
}

function readOutputSummary(locale: Locale, detail: TemplateDetail | null) {
  const primaryOutput = detail?.schema.outputSchema?.primaryOutput
  const image = detail?.schema.outputSchema?.image
  if (primaryOutput === 'image' && image && typeof image === 'object') {
    const imageConfig = image as Record<string, unknown>
    const count = typeof imageConfig.count === 'number' ? imageConfig.count : '-'
    const ratio = typeof imageConfig.ratio === 'string' ? imageConfig.ratio : '-'
    return copy(locale, `输出 ${count} 张，比例 ${ratio}`, `${count} outputs, ratio ${ratio}`)
  }
  if (primaryOutput === 'workflow') {
    return copy(locale, '输出为工作流组合结果', 'Outputs a workflow result set')
  }
  if (primaryOutput === 'text') {
    return copy(locale, '输出为结构化文本结果', 'Outputs a structured text result')
  }
  return copy(locale, '输出配置已接入', 'Output schema is connected')
}

export default function AgentTemplateMarketPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const [activePlatform, setActivePlatform] = useState<(typeof PLATFORM_FILTERS)[number]>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModality, setActiveModality] = useState<string | null>(null)
  const [activeSeries, setActiveSeries] = useState<string | null>(null)
  const [activeCapability, setActiveCapability] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recommended' | 'newest' | 'most_used' | 'most_favorited' | 'alphabetical'>('recommended')
  const [facets, setFacets] = useState<TemplateCatalogFacets | null>(null)
  const [globalFacets, setGlobalFacets] = useState<TemplateCatalogFacets | null>(null)
  const [catalog, setCatalog] = useState<TemplateListItem[]>([])
  const [recommendations, setRecommendations] = useState<TemplateListItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const { showToast } = useToastStore()
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [selectedDetail, setSelectedDetail] = useState<TemplateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)
  const [usingNowId, setUsingNowId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const pageSize = 4
  const touchStartX = useRef<number | null>(null)
  const detailRequestVersionRef = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveBannerIndex(prev => (prev + 1) % featuredTemplates.length)
      } else {
        setActiveBannerIndex(prev => (prev - 1 + featuredTemplates.length) % featuredTemplates.length)
      }
    }
    touchStartX.current = null
  }

  useEffect(() => {
    void listCatalogFacets({ locale }).then(setGlobalFacets).catch(() => {})
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      listCatalog({
        locale,
        keyword: searchQuery.trim() || undefined,
        modality: activeModality ?? undefined,
        series: activeSeries ?? undefined,
        capability: activeCapability ?? undefined,
        platform: activePlatform === 'all' ? undefined : activePlatform,
        sortBy,
      }),
      listCatalogFacets({
        locale,
        keyword: searchQuery.trim() || undefined,
        modality: activeModality ?? undefined,
        series: activeSeries ?? undefined,
        capability: activeCapability ?? undefined,
        platform: activePlatform === 'all' ? undefined : activePlatform,
      }),
      listRecommendations(locale),
      listFavoriteTemplates(locale),
    ])
      .then(([catalogItems, facetItems, recommendationItems, favoriteItems]) => {
        if (cancelled) return
        setCatalog(catalogItems)
        setFacets(facetItems)
        setRecommendations(recommendationItems)
        setFavoriteIds(favoriteItems.map(item => item.id))
        setSelectedTemplateId(prev =>
          catalogItems.some(item => item.id === prev) ? prev : (catalogItems[0]?.id ?? ''),
        )
      })
      .catch(() => {
        if (cancelled) return
        // Global toast handles error
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeCapability, activeModality, activePlatform, activeSeries, locale, searchQuery, sortBy])

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedDetail(null)
      return
    }
    const requestVersion = ++detailRequestVersionRef.current
    setDetailLoading(true)
    setSelectedDetail(null)
    void getTemplateDetail(selectedTemplateId, locale)
      .then(detail => {
        if (detailRequestVersionRef.current === requestVersion) {
          setSelectedDetail(detail)
        }
      })
      .finally(() => {
        if (detailRequestVersionRef.current === requestVersion) {
          setDetailLoading(false)
        }
      })
  }, [locale, selectedTemplateId])

  const visibleTemplates = useMemo(() => catalog, [catalog])
  const inputFields = useMemo(() => readInputFields(selectedDetail), [selectedDetail])
  const totalCatalogCount = useMemo(
    () => (globalFacets?.modalities ?? []).reduce((sum, item) => sum + item.count, 0),
    [globalFacets],
  )

  const featuredTemplates = useMemo(() => {
    const featured = recommendations.filter(r => r.isFeatured)
    return featured.length > 0 ? featured.slice(0, 3) : recommendations.slice(0, 3)
  }, [recommendations])

  const recommendedTemplates = useMemo(() => {
    return recommendations.filter(r => !featuredTemplates.find(f => f.id === r.id)).slice(0, 4)
  }, [recommendations, featuredTemplates])

  useEffect(() => {
    if (featuredTemplates.length <= 1) return
    const timer = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % featuredTemplates.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredTemplates.length])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCapability, activeModality, activePlatform, activeSeries, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(visibleTemplates.length / pageSize))
  const normalizedPage = Math.min(currentPage, totalPages)
  const paginatedTemplates = visibleTemplates.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize)

  const selectedTemplate =
    visibleTemplates.find(item => item.id === selectedTemplateId) ??
    paginatedTemplates[0] ??
    visibleTemplates[0]

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(selectedTemplate.id)
    }
  }, [selectedTemplate, selectedTemplateId])

  const toggleFavorite = async (templateId: string) => {
    const wasFavorited = favoriteIds.includes(templateId)
    setFavoriteLoadingId(templateId)
    setFavoriteIds(prev =>
      wasFavorited ? prev.filter(id => id !== templateId) : [...prev, templateId],
    )

    try {
      if (wasFavorited) {
        await removeFavoriteTemplate(templateId)
      } else {
        await addFavoriteTemplate(templateId)
      }
    } catch (err) {
      setFavoriteIds(prev =>
        wasFavorited ? [...prev, templateId] : prev.filter(id => id !== templateId),
      )
    } finally {
      setFavoriteLoadingId(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setActivePlatform('all')
    setActiveModality(null)
    setActiveSeries(null)
    setActiveCapability(null)
    setSortBy('recommended')
    setCurrentPage(1)
  }

  const handleCopyTemplate = async () => {
    if (!selectedTemplate) return
    setCopying(true)
    try {
      await copyTemplateToMyTemplates(selectedTemplate.id)
      showToast(copy(locale, '已复制到我的模板库，可前往“我的模板”继续使用', 'Copied to My Templates. You can continue from My Templates.'), 'success')
    } catch (err) {
      // API error toast is shown by request interceptor
    } finally {
      setCopying(false)
    }
  }

  const handleUseNow = async (templateId: string) => {
    setUsingNowId(templateId)
    try {
      const payload = await useTemplateNow(templateId)
      saveUseTemplatePayload(payload)
      navigate(payload.targetRoute || '/chat', {
        state: { templateUsePayload: payload },
      })
    } catch (err) {
      // Error handled by global toast
    } finally {
      setUsingNowId(null)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-500/12 via-white/[0.03] to-accent-500/10 p-6 sm:p-8">
          <div className="glow-orb h-[260px] w-[260px] bg-brand-500/20 -top-10 -right-10" />
          <div className="glow-orb h-[220px] w-[220px] bg-accent-500/15 -bottom-16 left-8" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{copy(locale, '官方模板中心', 'Official Template Center')}</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold sm:text-4xl">
                  <span className="gradient-text">{copy(locale, 'AI Agent 模板市场', 'AI Agent Template Market')}</span>
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                  {copy(
                    locale,
                    '围绕跨境电商常见场景，汇聚官方精选模板。你可以按平台、任务类型与使用场景快速找到合适模板，一键收藏、复制并开始使用。',
                    'Browse curated templates for cross-border ecommerce. Discover the right prompt by platform, task type, and scenario, then favorite, copy, and launch it in one step.',
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/50">
                <div className="glass rounded-xl px-4 py-3">
                  <div className="text-lg font-semibold text-white">{totalCatalogCount || catalog.length}</div>
                  <div>{copy(locale, '系统模板总数', 'Total Catalog')}</div>
                </div>
                <div className="glass rounded-xl px-4 py-3">
                  <div className="text-lg font-semibold text-white">{recommendations.length}</div>
                  <div>{copy(locale, '推荐模板', 'Recommended')}</div>
                </div>
                <div className="glass rounded-xl px-4 py-3">
                  <div className="text-lg font-semibold text-white">{favoriteIds.length}</div>
                  <div>{copy(locale, '已收藏', 'Favorites')}</div>
                </div>
              </div>
            </div>

            <div className="glass-strong w-full max-w-md rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand-400" />
                <div className="font-medium text-white">
                  {copy(locale, '模板亮点', 'Why Templates Help')}
                </div>
              </div>
              <div className="space-y-3 text-sm text-white/60">
                {[
                  copy(locale, '按平台、场景、品类和任务快速找到适合的模板。', 'Find the right template by platform, scenario, category, and task.'),
                  copy(locale, '支持收藏常用模板，并复制到自己的模板库继续编辑。', 'Favorite useful templates and copy them into your own library.'),
                  copy(locale, '选择模板后可直接进入对应工具，减少重复填写与试错。', 'Open the right tool directly from a template and skip repeated setup.'),
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-brand-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="glass-strong rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
                <LayoutGrid className="h-4 w-4 text-brand-400" />
                <span>{copy(locale, '平台入口', 'Platform Entry')}</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActivePlatform('all')
                    setCurrentPage(1)
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activePlatform === 'all'
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {copy(locale, '全部模板', 'All Templates')}
                </button>
                {PLATFORM_GROUPS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActivePlatform(item.key)
                      setCurrentPage(1)
                    }}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      activePlatform === item.key
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {item.emoji} {locale === 'zh' ? item.zh : item.en}
                      </span>
                      <span className="text-[11px] text-white/30">{locale === 'zh' ? item.metrics.zh : item.metrics.en}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
                <Filter className="h-4 w-4 text-brand-400" />
                <span>{copy(locale, '模态筛选', 'Modality Filters')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MODALITY_FILTERS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveModality(prev => (prev === item.key ? null : item.key))
                      setCurrentPage(1)
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      activeModality === item.key
                        ? 'border-brand-500/30 bg-brand-500/15 text-brand-300'
                        : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {copy(locale, item.zh, item.en)}
                  </button>
                ))}
              </div>
              {(activePlatform !== 'all' || activeModality || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70"
                >
                  <X className="h-3.5 w-3.5" />
                  {copy(locale, '清空筛选', 'Clear Filters')}
                </button>
              )}
            </div>

            {facets?.series?.length ? (
              <div className="glass rounded-2xl p-4">
                <div className="mb-3 text-sm text-white/70">{copy(locale, '系列分类', 'Series')}</div>
                <div className="space-y-2">
                  {facets.series.slice(0, 8).map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveSeries(prev => (prev === item.key ? null : item.key))
                        setCurrentPage(1)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        activeSeries === item.key
                          ? 'bg-brand-500/15 text-brand-300'
                          : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span>{displayFacetLabel(locale, item)}</span>
                      <span className="text-[11px] text-white/35">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {facets?.capabilities?.length ? (
              <div className="glass rounded-2xl p-4">
                <div className="mb-3 text-sm text-white/70">{copy(locale, '能力分类', 'Capabilities')}</div>
                <div className="flex flex-wrap gap-2">
                  {facets.capabilities.slice(0, 10).map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveCapability(prev => (prev === item.key ? null : item.key))
                        setCurrentPage(1)
                      }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        activeCapability === item.key
                          ? 'border-brand-500/30 bg-brand-500/15 text-brand-300'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {displayFacetLabel(locale, item)} · {item.count}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <div className="space-y-6">
            {featuredTemplates.length > 0 && (
              <div 
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#080b12] aspect-[21/9] sm:aspect-[3/1] touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {featuredTemplates.map((item, index) => (
                  <div
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    {item.coverAssetUrl && (
                      <img
                        src={item.coverAssetUrl}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover opacity-50"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080b12] via-[#080b12]/80 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 w-full sm:w-2/3 pb-16">
                      <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{copy(locale, '精选推荐', 'Featured')}</span>
                      </div>
                      <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-white">{item.name}</h2>
                      <div className="mb-6">
                        <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
                          {item.summary}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(item.id)
                            setDetailOpen(true)
                          }}
                          className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
                        >
                          {copy(locale, '查看详情', 'View Details')}
                        </button>
                        <button
                          type="button"
                          disabled={usingNowId === item.id}
                          onClick={() => void handleUseNow(item.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                        >
                          {usingNowId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : copy(locale, '立即使用', 'Use Now')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {featuredTemplates.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveBannerIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === activeBannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {recommendedTemplates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium text-white">
                    {copy(locale, '为你推荐', 'Recommended for You')}
                  </div>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 sm:grid sm:grid-cols-2 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {recommendedTemplates.map(item => (
                    <article
                      key={item.id}
                      onClick={() => {
                        setSelectedTemplateId(item.id)
                        setDetailOpen(true)
                      }}
                      className="group min-w-[280px] snap-start sm:min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:bg-white/[0.04] hover:border-white/[0.1]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                        {item.coverAssetUrl ? (
                          <img
                            src={item.coverAssetUrl}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Bot className="h-8 w-8 text-white/10" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white/90 backdrop-blur-md">
                          {primaryPlatform(item).toUpperCase()}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-amber-400 backdrop-blur-md">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{item.successRateHint || 98}%</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 text-sm font-medium text-white line-clamp-1 group-hover:text-brand-300 transition-colors">{item.name}</h3>
                        <p className="mb-4 text-xs text-white/50 line-clamp-2">{item.summary}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40">
                            {formatCount(item.useCount)} {copy(locale, '次使用', 'uses')}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
                            {copy(locale, '查看详情', 'View More')} <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-strong rounded-2xl p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={copy(locale, '搜索模板名称、平台、场景、任务类型...', 'Search by name, platform, scenario, or task...')}
                    className="glass w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white/80 placeholder-white/25 outline-none"
                  />
                </div>
                <div className="min-w-[180px]">
                  <select
                    value={sortBy}
                    onChange={e => {
                      setSortBy(e.target.value as typeof sortBy)
                      setCurrentPage(1)
                    }}
                    className="glass w-full rounded-xl px-3 py-3 text-sm text-white/80 outline-none"
                  >
                    <option value="recommended">{copy(locale, '推荐优先', 'Recommended')}</option>
                    <option value="newest">{copy(locale, '最新优先', 'Newest')}</option>
                    <option value="most_used">{copy(locale, '使用最多', 'Most Used')}</option>
                    <option value="most_favorited">{copy(locale, '收藏最多', 'Most Favorited')}</option>
                    <option value="alphabetical">{copy(locale, '字母排序', 'Alphabetical')}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <span>{copy(locale, '从模板发现到开始使用，当前页已支持完整浏览与操作流程。', 'This page supports the full flow from discovery to launch.')}</span>
                </div>
              </div>
            </div>



            <div className="flex items-center justify-between text-sm text-white/45">
              <span>
                {copy(locale, '筛选结果', 'Results')}:
                {' '}
                <span className="text-white/80">{visibleTemplates.length}</span>
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {activeModality && (
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                    {copy(locale, '当前模态', 'Active Modality')}: {activeModality}
                  </span>
                )}
                {activeSeries && (
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                    {copy(locale, '当前系列', 'Active Series')}: {displayFacetLabel(locale, { key: activeSeries, label: activeSeries, count: 0 })}
                  </span>
                )}
                {activeCapability && (
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                    {copy(locale, '当前能力', 'Active Capability')}: {displayFacetLabel(locale, { key: activeCapability, label: activeCapability, count: 0 })}
                  </span>
                )}
              </div>
            </div>

            {facets && (
              <div className="grid gap-3 md:grid-cols-4">
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/35">{copy(locale, '平台分类数', 'Platforms')}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{facets.platforms.length}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/35">{copy(locale, '模态分类数', 'Modalities')}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{facets.modalities.length}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/35">{copy(locale, '系列分类数', 'Series')}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{facets.series.length}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/35">{copy(locale, '能力分类数', 'Capabilities')}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{facets.capabilities.length}</div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="tool-card glass rounded-2xl p-5 animate-pulse">
                    <div className="mb-4 h-48 w-full rounded-2xl bg-white/[0.04]"></div>
                    <div className="mb-4 h-5 w-1/3 rounded-lg bg-white/[0.04]"></div>
                    <div className="mb-4 h-12 w-full rounded-lg bg-white/[0.04]"></div>
                    <div className="mb-5 h-8 w-2/3 rounded-lg bg-white/[0.04]"></div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="h-10 rounded-xl bg-white/[0.04]"></div>
                      <div className="h-10 rounded-xl bg-white/[0.04]"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleTemplates.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <Search className="h-5 w-5 text-white/35" />
                </div>
                <div className="text-lg font-semibold text-white">
                  {copy(locale, '没有找到匹配模板', 'No matching templates')}
                </div>
                <div className="mt-2 text-sm text-white/45">
                  {copy(locale, '尝试切换平台、清空筛选或修改搜索关键词。', 'Try switching platforms, clearing filters, or adjusting keywords.')}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {paginatedTemplates.map(card => {
                const isFavorite = favoriteIds.includes(card.id)
                const isSelected = selectedTemplate?.id === card.id

                return (
                  <article
                    key={card.id}
                    onClick={() => {
                      setSelectedTemplateId(card.id)
                      setDetailOpen(true)
                    }}
                    className={`tool-card glass rounded-2xl p-5 transition-all ${
                      isSelected ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                    }`}
                  >
                    {card.coverAssetUrl && (
                      <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#080b12]">
                        <img
                          src={card.coverAssetUrl}
                          alt={card.name}
                          className="h-48 w-full object-cover object-center"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 text-xs text-white/35">{primaryPlatform(card).toUpperCase()}</div>
                        <h3 className="text-base font-semibold text-white">{card.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          void toggleFavorite(card.id)
                        }}
                        disabled={favoriteLoadingId === card.id}
                        className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs transition-colors ${
                          isFavorite
                            ? 'border-rose-400/20 bg-rose-400/10 text-rose-300'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                        {card.favoriteCount}
                      </button>
                    </div>

                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-white/55">{card.summary}</p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {[...card.platformTags, ...card.industryTags].slice(0, 4).map(tag => (
                        <span key={tag} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white/45">
                      {templateType(locale, card)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/35">
                      <span>{copy(locale, '累计使用', 'Usage')}</span>
                      <span>{formatCount(card.useCount)}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedTemplateId(card.id)
                          setDetailOpen(true)
                        }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        {copy(locale, '预览模板', 'Preview')}
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          void handleUseNow(card.id)
                        }}
                        disabled={usingNowId === card.id}
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {usingNowId === card.id ? copy(locale, '跳转中...', 'Opening...') : copy(locale, '立即使用', 'Use Now')}
                        {usingNowId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </article>
                )
                })}
              </div>
            )}

            {visibleTemplates.length > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                <span>
                  {copy(locale, '第', 'Page')} <span className="text-white/80">{normalizedPage}</span> / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={normalizedPage === 1}
                    className="rounded-xl border border-white/[0.08] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/[0.06]"
                  >
                    {copy(locale, '上一页', 'Prev')}
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={normalizedPage === totalPages}
                    className="rounded-xl border border-white/[0.08] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/[0.06]"
                  >
                    {copy(locale, '下一页', 'Next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        <DetailDrawer
          open={detailOpen && !!selectedTemplate}
          onClose={() => setDetailOpen(false)}
          subtitle={selectedTemplate ? primaryPlatform(selectedTemplate).toUpperCase() : ''}
          title={selectedTemplate?.name ?? copy(locale, '模板详情', 'Template Detail')}
        >
          {selectedTemplate ? (
            <>
              <div className="text-sm leading-6 text-white/55">{selectedTemplate.summary}</div>

              {selectedDetail?.examples?.length ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm font-medium text-white/75">
                    {copy(locale, '示例素材', 'Examples')}
                  </div>
                  <div className="grid gap-3">
                    {selectedDetail.examples.slice(0, 3).map(example => (
                      <div key={example.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#080b12]">
                        {example.previewAssetUrl && (
                          <img
                            src={example.previewAssetUrl}
                            alt={example.title || selectedTemplate.name}
                            className="max-h-[22rem] w-full object-contain p-2"
                          />
                        )}
                        <div className="p-3">
                          <div className="text-sm font-medium text-white/75">
                            {example.title || copy(locale, '示例预览', 'Example Preview')}
                          </div>
                          <div className="mt-1 text-xs text-white/40">{example.exampleType}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {[...selectedTemplate.platformTags, ...selectedTemplate.industryTags, ...selectedTemplate.scenarioTags].slice(0, 8).map(tag => (
                  <span key={tag} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-300">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white/75">
                  {copy(locale, '适用场景', 'Best-fit Scenario')}
                </div>
                <div className="text-sm leading-6 text-white/50">
                  {detailLoading
                    ? copy(locale, '正在加载详情...', 'Loading detail...')
                    : selectedDetail?.locale.scenarioDescription || selectedDetail?.locale.description || selectedTemplate.summary}
                </div>
              </div>

              {selectedDetail?.locale.inputDescription && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-2 text-sm font-medium text-white/75">
                    {copy(locale, '输入说明', 'Input Guidance')}
                  </div>
                  <div className="text-sm leading-6 text-white/50">{selectedDetail.locale.inputDescription}</div>
                </div>
              )}

              {selectedDetail?.locale.outputDescription && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-2 text-sm font-medium text-white/75">
                    {copy(locale, '输出说明', 'Output Guidance')}
                  </div>
                  <div className="text-sm leading-6 text-white/50">{selectedDetail.locale.outputDescription}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="text-white/35">{copy(locale, '累计使用', 'Usage')}</div>
                  <div className="mt-1 font-semibold text-white">{formatCount(selectedTemplate.useCount)}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="text-white/35">{copy(locale, '模板评分', 'Rating')}</div>
                  <div className="mt-1 font-semibold text-white">{selectedTemplate.successRateHint}%</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white/75">
                  {copy(locale, '模板状态', 'Template Status')}
                </div>
                <div className="space-y-2 text-sm text-white/50">
                  <div>{copy(locale, `版本: ${selectedDetail?.version.versionLabel ?? 'v1'}`, `Version: ${selectedDetail?.version.versionLabel ?? 'v1'}`)}</div>
                  <div>{copy(locale, `执行器: ${selectedTemplate.executorType}`, `Executor: ${selectedTemplate.executorType}`)}</div>
                  <div>{copy(locale, `模态: ${selectedTemplate.modality}`, `Modality: ${selectedTemplate.modality}`)}</div>
                  <div>{copy(locale, `目标路由: ${readExecutionFlag(selectedDetail, 'route') || '-'}`, `Target route: ${readExecutionFlag(selectedDetail, 'route') || '-'}`)}</div>
                  {selectedDetail?.version.sourceAssetRef && (
                    <div className="break-all">
                      {copy(locale, `来源规范: ${selectedDetail.version.sourceAssetRef}`, `Spec source: ${selectedDetail.version.sourceAssetRef}`)}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white/75">
                  {copy(locale, '执行配置', 'Execution Setup')}
                </div>
                <div className="space-y-2 text-sm text-white/50">
                  <div>{readOutputSummary(locale, selectedDetail)}</div>
                  <div>
                    {copy(
                      locale,
                      `支持异步任务: ${readBoolean(selectedDetail, 'supportsAsyncJob') ? '是' : '否'}`,
                      `Supports async job: ${readBoolean(selectedDetail, 'supportsAsyncJob') ? 'Yes' : 'No'}`,
                    )}
                  </div>
                  <div>
                    {copy(
                      locale,
                      `支持批量执行: ${readBoolean(selectedDetail, 'supportsBatch') ? '是' : '否'}`,
                      `Supports batch execution: ${readBoolean(selectedDetail, 'supportsBatch') ? 'Yes' : 'No'}`,
                    )}
                  </div>
                  <div>
                    {copy(
                      locale,
                      `工具标识: ${readExecutionFlag(selectedDetail, 'toolSlug') || '-'}`,
                      `Tool slug: ${readExecutionFlag(selectedDetail, 'toolSlug') || '-'}`,
                    )}
                  </div>
                </div>
              </div>

              {inputFields.length > 0 && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm font-medium text-white/75">
                    {copy(locale, '输入字段', 'Input Fields')}
                  </div>
                  <div className="space-y-2">
                    {inputFields.slice(0, 6).map((field, index) => {
                      const record = typeof field === 'object' && field ? (field as Record<string, unknown>) : {}
                      const key = typeof record.key === 'string' ? record.key : `field_${index}`
                      const type = typeof record.type === 'string' ? record.type : 'unknown'
                      const required = record.required === true
                      return (
                        <div key={key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <div className="truncate text-white/75">{key}</div>
                            <div className="text-xs text-white/35">{type}</div>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[11px] ${required ? 'bg-rose-500/10 text-rose-300' : 'bg-white/[0.06] text-white/45'}`}>
                            {required ? copy(locale, '必填', 'Required') : copy(locale, '可选', 'Optional')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => void handleCopyTemplate()}
                  disabled={copying}
                  className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
                >
                  {copying
                    ? copy(locale, '复制中...', 'Copying...')
                    : copy(locale, '复制到我的模板库', 'Copy to My Templates')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUseNow(selectedTemplate.id)}
                  disabled={usingNowId === selectedTemplate.id}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {usingNowId === selectedTemplate.id
                    ? copy(locale, '正在跳转执行...', 'Opening execution...')
                    : copy(locale, '立即在业务工具中使用', 'Use in Business Tool')}
                  {usingNowId === selectedTemplate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : null}
        </DetailDrawer>
      </div>
    </div>
  )
}
