import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import { ArrowRight,
  Clock3, Eye,
  Filter, History,
  ImageIcon, Layers,
  Palette, Package,
  Search, Sparkles,
  Users, } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DetailDrawer from '@/components/DetailDrawer'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import { DESIGN_STATUS_STYLES,
  advanceDesignStatus, copyLocalizedText,
  createMockDesignTask, getDesignWorkbenchMock,
  type DesignTask, type DesignTaskStatus,
  type Locale, type LocalizedText,
} from '@/mock/designWorkbench'
import { } from '@/mock/workflowBridge'
interface DesignConfig { titleKey: string
  icon: LucideIcon
  badge: LocalizedText
  subtitle: LocalizedText
  stats: Array<{ value: string; label: LocalizedText }>
  stages: Array<{ title: LocalizedText; desc: LocalizedText; meta: LocalizedText }>
  actions: Array<{ label: LocalizedText; to: string }> }
const DESIGN_CONFIG: Record<string, DesignConfig> = { '/draw/scene-reference': {
    titleKey: 'pages.drawSceneReference', icon: Eye,
    badge: { zh: '视觉灵感层', en: 'Visual Inspiration Layer' }, subtitle: {
      zh: '沉淀场景参考、趋势图库和优质案例，为视觉生成提供起点。', en: 'Store scene references, trend galleries, and high-performing cases as starting points for generation.',
    }, stats: [
      { value: '520', label: { zh: '场景参考', en: 'Scene References' } }, { value: '12', label: { zh: '风格分组', en: 'Style Buckets' } },
      { value: '5', label: { zh: '热门趋势', en: 'Trending Sets' } }, ],
    stages: [ {
        title: { zh: '灵感瀑布流', en: 'Inspiration Feed' }, desc: { zh: '聚合竞品、案例、团队收藏和历史高转化视觉。', en: 'Aggregate competitor references, cases, team saves, and high-performing visuals.' },
        meta: { zh: '连接图片素材库', en: 'Connected to image library' }, },
      { title: { zh: '带入生成链路', en: 'Feed into Generation' },
        desc: { zh: '后续将支持把参考图一键带入工具页和设计器。', en: 'Later support one-click transfer into tool pages and the designer.' }, meta: { zh: '为生成工具服务', en: 'Serves generation tools' },
      }, ],
    actions: [ { label: { zh: '图片素材库', en: 'Image Library' }, to: '/database/picturelibrary' },
      { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' }, ],
  }, '/draw/product-home': {
    titleKey: 'pages.drawProductHome', icon: Package,
    badge: { zh: '商品视觉主工作台', en: 'Product Visual Workbench' }, subtitle: {
      zh: '统一管理商品、视觉任务、状态流和产出回收，是视觉生产链的主入口。', en: 'Manage products, visual jobs, state flows, and asset recovery in one main production workbench.',
    }, stats: [
      { value: '148', label: { zh: '管理商品', en: 'Managed SKUs' } }, { value: '32', label: { zh: '待生成', en: 'Queued Jobs' } },
      { value: '14', label: { zh: '待审核', en: 'Pending Review' } }, ],
    stages: [ {
        title: { zh: '商品总览视图', en: 'Product Overview' }, desc: { zh: '按平台、品类、上新阶段查看每个商品的视觉状态。', en: 'Inspect each product’s visual status by platform, category, and launch stage.' },
        meta: { zh: '连接商品与视觉任务', en: 'Links products with visual jobs' }, },
      { title: { zh: '资产回收视角', en: 'Asset Recovery View' },
        desc: { zh: '追踪结果进入素材库、下载中心和设计器的去向。', en: 'Track where outputs flow into the asset library, downloads, and designer.' }, meta: { zh: '形成生产闭环', en: 'Closes the production loop' },
      }, ],
    actions: [ { label: { zh: '生成记录', en: 'Generation Records' }, to: '/products/workbench/visual-tools' },
      { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' }, ],
  }, '/draw/product-records': {
    titleKey: 'pages.drawProductRecords', icon: History,
    badge: { zh: '任务记录中心', en: 'Task Record Center' }, subtitle: {
      zh: '记录每次输入素材、参数、执行状态和输出结果，方便复盘与复用。', en: 'Track inputs, parameters, execution states, and outputs as a foundation for async job systems.',
    }, stats: [
      { value: '312', label: { zh: '生成任务', en: 'Generation Jobs' } }, { value: '9', label: { zh: '失败重试', en: 'Retries' } },
      { value: '76%', label: { zh: '成功率', en: 'Success Rate' } }, ],
    stages: [ {
        title: { zh: '任务时间线', en: 'Job Timeline' }, desc: { zh: '展示排队、生成中、完成、失败和重试等任务状态。', en: 'Show queued, generating, completed, failed, and retried job states.' },
        meta: { zh: '后续接任务系统', en: 'Ready for job orchestration' }, },
      { title: { zh: '参数复用能力', en: 'Parameter Reuse' },
        desc: { zh: '按历史任务一键复制配置重新生成。', en: 'Re-run with one click by copying historical parameters.' }, meta: { zh: '高频运营动作', en: 'High-frequency operator action' },
      }, ],
    actions: [ { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' },
      { label: { zh: '历史记录', en: 'History' }, to: '/draw/history' }, ],
  }, '/draw/designer-home': {
    titleKey: 'pages.drawDesignerHome', icon: Palette,
    badge: { zh: '设计加工工作台', en: 'Design Post-Processing Workbench' }, subtitle: {
      zh: '设计器承接海报、详情页、活动页的二次加工，是视觉链条的重要中枢。', en: 'The designer handles posters, PDP sections, and campaign pages as the post-processing center of the visual pipeline.',
    }, stats: [
      { value: '36', label: { zh: '设计模板', en: 'Design Templates' } }, { value: '12', label: { zh: '进行中稿件', en: 'Active Drafts' } },
      { value: '4', label: { zh: '团队共创', en: 'Shared Drafts' } }, ],
    stages: [ {
        title: { zh: '画布工作区', en: 'Canvas Workspace' }, desc: { zh: '后续接入图层、元素库、品牌规范和导出设置。', en: 'Later add layers, element libraries, brand constraints, and export settings.' },
        meta: { zh: '设计加工层', en: 'Design processing layer' }, },
      { title: { zh: '模板 / 稿件双入口', en: 'Template / Draft Dual Entry' },
        desc: { zh: '支持从模板开始，或从已有生成结果继续修改。', en: 'Start from templates or continue from generated assets.' }, meta: { zh: '连接生成与设计', en: 'Bridges generation and design' },
      }, ],
    actions: [ { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: '我的模板', en: 'My Templates' }, to: '/draw/my-template' }, ],
  }, '/draw/my-design': {
    titleKey: 'pages.drawMyDesign', icon: ImageIcon,
    badge: { zh: '个人设计资产层', en: 'Personal Design Asset Layer' }, subtitle: {
      zh: '沉淀个人设计稿、改稿记录和导出历史，形成可追溯的设计资产库。', en: 'Store personal drafts, revision history, and export actions into a traceable design asset library.',
    }, stats: [
      { value: '24', label: { zh: '设计稿', en: 'Drafts' } }, { value: '11', label: { zh: '已导出', en: 'Exported' } },
      { value: '5', label: { zh: '待协作', en: 'Awaiting Review' } }, ],
    stages: [ {
        title: { zh: '草稿卡片视图', en: 'Draft Card View' }, desc: { zh: '每张稿件显示来源素材、最后修改时间与导出版本。', en: 'Each draft shows source assets, last edit time, and export versions.' },
        meta: { zh: '设计资产管理', en: 'Design asset management' }, },
      { title: { zh: '回流生成链路', en: 'Return-to-Generation Flow' },
        desc: { zh: '可继续回到工具页补图、改文案或重新输出。', en: 'Flow back into tool pages for more variants, copy updates, or regeneration.' }, meta: { zh: '形成工作流回路', en: 'Forms a workflow loop' },
      }, ],
    actions: [ { label: { zh: '设计器首页', en: 'Designer Home' }, to: '/draw/designer-home' },
      { label: { zh: '团队空间', en: 'Team Space' }, to: '/draw/team-space' }, ],
  }, '/draw/my-template': {
    titleKey: 'pages.drawMyTemplate', icon: Layers,
    badge: { zh: '视觉模板库', en: 'Visual Template Library' }, subtitle: {
      zh: '把详情页、海报、活动 Banner 等设计模板沉淀成可快速复用的视觉资产。', en: 'Convert PDP, poster, and campaign banner templates into reusable visual assets.',
    }, stats: [
      { value: '18', label: { zh: '模板数', en: 'Templates' } }, { value: '7', label: { zh: '团队共享', en: 'Team Shared' } },
      { value: '4', label: { zh: '最近复用', en: 'Recently Reused' } }, ],
    stages: [ {
        title: { zh: '模板资产卡片', en: 'Template Asset Cards' }, desc: { zh: '按平台、活动、布局和场景组织视觉模板。', en: 'Organize visual templates by platform, campaign, layout, and scenario.' },
        meta: { zh: '支持快速套版', en: 'Supports fast re-application' }, },
      { title: { zh: '模板回写能力', en: 'Template Write-back' },
        desc: { zh: '后续把商品、文案和品牌素材一键带入设计模板。', en: 'Later inject product data, copy, and brand assets into templates with one click.' }, meta: { zh: '偏半自动设计', en: 'Semi-automated design' },
      }, ],
    actions: [ { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: 'AI Agent 模板', en: 'AI Agent Templates' }, to: '/aiChat/template' }, ],
  }, '/draw/team-space': {
    titleKey: 'pages.drawTeamSpace', icon: Users,
    badge: { zh: '团队协作空间', en: 'Team Collaboration Space' }, subtitle: {
      zh: '承接共享模板、成员协作、资产审核和版本管理，是团队版的重要骨架。', en: 'Handle shared templates, member collaboration, asset review, and versioning as the foundation of the team plan.',
    }, stats: [
      { value: '5', label: { zh: '成员', en: 'Members' } }, { value: '12', label: { zh: '共享模板', en: 'Shared Templates' } },
      { value: '9', label: { zh: '待审核', en: 'Awaiting Review' } }, ],
    stages: [ {
        title: { zh: '项目级协作', en: 'Project-level Collaboration' }, desc: { zh: '以项目和商品线组织任务、素材和设计稿。', en: 'Organize tasks, assets, and drafts by project and product line.' },
        meta: { zh: '为团队工作流预埋', en: 'Ready for team workflows' }, },
      { title: { zh: '权限与版本位', en: 'Permission and Version Slots' },
        desc: { zh: '预留角色权限、审批状态和版本回滚逻辑。', en: 'Reserve role permissions, approval states, and version rollback logic.' }, meta: { zh: '后续接权限系统', en: 'Ready for authz' },
      }, ],
    actions: [ { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: '订单列表', en: 'Order List' }, to: '/orderList' }, ],
  }, '/draw/history': {
    titleKey: 'pages.drawHistory', icon: Clock3,
    badge: { zh: '视觉历史总览', en: 'Visual History Overview' }, subtitle: {
      zh: '聚合生成、设计、导出和分享动作，形成视觉工作流统一时间线。', en: 'Aggregate generation, design, export, and sharing actions into a unified visual workflow timeline.',
    }, stats: [
      { value: '429', label: { zh: '历史记录', en: 'History Items' } }, { value: '28', label: { zh: '今日任务', en: 'Today Tasks' } },
      { value: '3', label: { zh: '失败项', en: 'Failures' } }, ],
    stages: [ {
        title: { zh: '跨工具时间线', en: 'Cross-tool Timeline' }, desc: { zh: '将模特图、商品图、设计器、视频等动作放在同一轴线上。', en: 'Place model, product, designer, and video actions on the same timeline.' },
        meta: { zh: '统一历史视角', en: 'Unified history view' }, },
      { title: { zh: '筛选检索位', en: 'Search and Filter Slots' },
        desc: { zh: '按商品、成员、状态和时间范围进行筛选。', en: 'Filter by product, member, status, and time range.' }, meta: { zh: '适合高频复盘', en: 'Ideal for high-frequency review' },
      }, ],
    actions: [ { label: { zh: '生成记录', en: 'Generation Records' }, to: '/products/workbench/visual-tools' },
      { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' }, ],
  }, }
export default function DesignWorkbenchPage() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { showToast } = useToastStore()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const config = DESIGN_CONFIG[pathname] ?? DESIGN_CONFIG['/draw/product-home']
  const Icon = config.icon
  const mock = useMemo(() => getDesignWorkbenchMock(pathname), [pathname])
  const [tasks, setTasks] = useState<DesignTask[]>(mock.tasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState(0)
  const [boardMode, setBoardMode] = useState<'pipeline' | 'detail'>('pipeline')
  const [activeStatus, setActiveStatus] = useState<DesignTaskStatus | 'all'>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(mock.assets[0]?.id ?? null)
  useEffect(() => {
    const nextMock = getDesignWorkbenchMock(pathname)
    setTasks(nextMock.tasks)
    setSearchQuery('')
    setSelectedStage(0)
    setBoardMode('pipeline')
    setActiveStatus('all')
    setSelectedTaskId(null)
    setTaskDrawerOpen(false)
    setSelectedAssetId(nextMock.assets[0]?.id ?? null) }, [pathname])
  const visibleStages = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return config.stages
    return config.stages.filter(stage => {
      const title = copyLocalizedText(locale, stage.title).toLowerCase()
      const desc = copyLocalizedText(locale, stage.desc).toLowerCase()
      const meta = copyLocalizedText(locale, stage.meta).toLowerCase()
      return title.includes(normalized) || desc.includes(normalized) || meta.includes(normalized) })
  }, [config.stages, locale, searchQuery])
  const activeStage = visibleStages[selectedStage] ?? visibleStages[0] ?? config.stages[0]
  const visibleTasks = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    return tasks.filter(task => {
      const matchesStatus = activeStatus === 'all' || task.status === activeStatus
      if (!matchesStatus) return false
      if (!normalized) return true
      return ( copyLocalizedText(locale, task.title).toLowerCase().includes(normalized) ||
        copyLocalizedText(locale, task.product).toLowerCase().includes(normalized) || copyLocalizedText(locale, task.output).toLowerCase().includes(normalized) ||
        task.owner.toLowerCase().includes(normalized) )
    }) }, [activeStatus, locale, searchQuery, tasks])
  const selectedTask = tasks.find(task => task.id === selectedTaskId) ?? visibleTasks[0] ?? null
  const selectedAsset = mock.assets.find(item => item.id === selectedAssetId) ?? mock.assets[0] ?? null
  const handleAdvanceTask = (taskId: string, current: DesignTaskStatus) => { setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, status: advanceDesignStatus(current) } : task)))
  }
  const handleCreateTask = () => { setTasks(prev => [createMockDesignTask(pathname, prev.length), ...prev])
  }
  const pushEvent = (title: LocalizedText, detail: LocalizedText, module: 'design' | 'asset' | 'delivery' | 'template') => { void productWorkspaceRepository.saveWorkflowEvent({
      id: `${module}-${Date.now()}`, module,
      title, detail,
      createdAt: new Date().toISOString(), })
  }
  const handleSyncAssetToLibrary = () => {
    if (!selectedAsset) return
    void productWorkspaceRepository.saveLinkedDesignAsset({ id: selectedAsset.id,
      sourcePath: pathname, title: selectedAsset.title,
      desc: selectedAsset.desc, syncedAt: new Date().toISOString(),
    })
    pushEvent( { zh: '设计产物已同步素材库', en: 'Design asset synced to library' },
      selectedAsset.title, 'asset',
    )
    showToast(locale === 'zh' ? '已同步到图片素材库' : 'Synced to image library', 'success') }
  const handlePushToDelivery = () => {
    if (!selectedAsset) return
    void productWorkspaceRepository.saveLinkedDelivery({ id: `delivery-${selectedAsset.id}`,
      sourcePath: pathname, title: selectedAsset.title,
      size: '420MB', status: 'ready',
      meta: { zh: '来自视觉工作台的导出交付包',
        en: 'Delivery bundle exported from the visual workbench', },
      createdAt: new Date().toISOString(), })
    pushEvent( { zh: '设计产物已加入下载中心', en: 'Design asset added to download center' },
      selectedAsset.title, 'delivery',
    )
    showToast(locale === 'zh' ? '已加入下载中心' : 'Added to download center', 'success') }
  const handleBridgeTemplate = () => {
    if (!selectedAsset) return
    const templateTitle = { zh: `${selectedAsset.title.zh} Agent 模板`,
      en: `${selectedAsset.title.en} Agent Template`, }
    void productWorkspaceRepository.saveTemplateBridge({ id: `bridge-${selectedAsset.id}`,
      designTitle: selectedAsset.title, aiTemplateTitle: templateTitle,
      scenario: { zh: '设计模板与运营模板联动',
        en: 'Design-template and operations-template linkage', },
      createdAt: new Date().toISOString(), })
    void productWorkspaceRepository.saveSavedTemplate({ id: `design-template-${selectedAsset.id}`,
      platform: 'amazon', tags: ['design', 'visual', 'bridge'],
      usageCount: '860', favorite: 4.7,
      savedAt: new Date().toISOString(), sourceType: 'design',
      sourceLabel: locale === 'zh' ? '来自视觉模板桥接' : 'Bridged from design template', zh: {
        title: templateTitle.zh, summary: `${selectedAsset.title.zh} 已映射为可复用 Agent 模板，可继续在 AI 对话与批量 Listing 使用。`,
        scenario: '适合把视觉模板对应的运营动作沉淀为标准模板', },
      en: { title: templateTitle.en,
        summary: `${selectedAsset.title.en} is now mapped into a reusable Agent template for AI chat and batch-listing reuse.`, scenario: 'Suitable for converting design-template workflows into standardized operations templates',
      }, })
    pushEvent( { zh: '视觉模板已桥接到 Agent 模板', en: 'Visual template bridged to Agent template' },
      selectedAsset.title, 'template',
    )
    showToast( locale === 'zh'
        ? '操作已写入回流记录，可到模板中心查看' : 'Action logged in workflow feed, ready for Template Center',
      'success' )
  }
  const boardHeading = pathname === '/draw/team-space'
      ? locale === 'zh' ? '团队协作与审批'
        : 'Team Collaboration and Approval' : pathname === '/draw/history'
        ? locale === 'zh' ? '统一历史时间线'
          : 'Unified History Timeline' : pathname === '/draw/designer-home'
          ? locale === 'zh' ? '设计加工面板'
            : 'Design Processing Board' : locale === 'zh'
            ? '视觉任务与产物面板' : 'Visual Tasks and Assets'
  const boardHint = pathname === '/draw/product-records'
      ? locale === 'zh' ? '把生成记录、失败重试和交付包推进串在一起。'
        : 'Links generation records, retries, and delivery progress together.' : pathname === '/draw/team-space'
        ? locale === 'zh' ? '突出共享模板、审批节点和成员协作。'
          : 'Highlights shared templates, approval nodes, and team collaboration.' : pathname === '/draw/history'
          ? locale === 'zh' ? '把生成、设计、导出和下载动作放在同一条时间线里。'
            : 'Places generation, design, export, and download actions on one timeline.' : locale === 'zh'
            ? '把任务推进、产物沉淀和时间线回收放在一屏里。' : 'Combines task progression, asset retention, and timeline recovery in one screen.'
  return ( <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{copyLocalizedText(locale, config.badge)}</span> </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" /> </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text sm:text-3xl">{t(config.titleKey)}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{copyLocalizedText(locale, config.subtitle)}</p> </div>
              </div> </div>
            <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
              {config.actions.map(action => ( <Link
                  key={action.to}
                  to={action.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white sm:w-auto"
                >
                  <span>{copyLocalizedText(locale, action.label)}</span>
                  <ArrowRight className="h-4 w-4" /> </Link>
              ))} </div>
          </div> </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.stats.map(stat => ( <div key={stat.value + stat.label.zh} className="glass rounded-2xl p-5">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/45">{copyLocalizedText(locale, stat.label)}</div> </div>
          ))} </section>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value)
                      setSelectedStage(0) }}
                    placeholder={locale === 'zh' ? '搜索阶段、动作或流程节点...' : 'Search stages, actions, or workflow nodes...'}
                    className="glass w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white/80 placeholder-white/25 outline-none"
                  /> </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/45">
                  <Filter className="h-3.5 w-3.5 text-brand-400" />
                  <span>{boardHint}</span> </div>
              </div> </div>
            <div className="flex gap-2">
              {[ { key: 'pipeline', zh: '流程视图', en: 'Pipeline' },
                { key: 'detail', zh: '详情视图', en: 'Detail' }, ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setBoardMode(item.key as 'pipeline' | 'detail')}
                  className={`rounded-xl px-4 py-2 text-sm transition-colors ${ boardMode === item.key
                      ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {locale === 'zh' ? item.zh : item.en} </button>
              ))} </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'queued', 'running', 'review', 'done'] as const).map(status => ( <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${ activeStatus === status
                      ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.03] text-white/45 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {status === 'all' ? locale === 'zh' ? '全部状态' : 'All Status'
                    : locale === 'zh' ? DESIGN_STATUS_STYLES[status].zh
                      : DESIGN_STATUS_STYLES[status].en} </button>
              ))} </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleStages.map((stage, index) => ( <article
                  key={stage.title.zh}
                  className={`tool-card glass rounded-2xl p-5 transition-all ${ activeStage?.title.zh === stage.title.zh ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                  }`}
                >
                  <h3 className="mb-3 text-lg font-semibold text-white">{copyLocalizedText(locale, stage.title)}</h3>
                  <p className="mb-5 text-sm leading-6 text-white/55">{copyLocalizedText(locale, stage.desc)}</p>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40">
                    {copyLocalizedText(locale, stage.meta)} </div>
                  <button
                    onClick={() => { setSelectedStage(index)
                      setBoardMode('detail') }}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                  >
                    {locale === 'zh' ? '查看节点' : 'Open Node'}
                    <ArrowRight className="h-4 w-4" /> </button>
                </article> ))}
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-2 text-sm font-medium text-white/75">
                {boardHeading} </div>
              <div className="mb-4 text-sm text-white/45">{boardHint}</div>
              <div className="mb-4">
                <button
                  onClick={handleCreateTask}
                  className="rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-2 text-sm text-brand-300 transition-colors hover:bg-brand-500/15"
                >
                  {locale === 'zh' ? '新增模拟任务' : 'Create Mock Task'} </button>
              </div>
              <div className="space-y-3">
                {visibleTasks.length ? ( visibleTasks.map(task => {
                    const statusCopy = DESIGN_STATUS_STYLES[task.status]
                    return ( <div key={task.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-white/80">{copyLocalizedText(locale, task.title)}</div>
                            <div className="mt-1 text-xs text-white/35">
                              {task.id} · {task.owner} · {copyLocalizedText(locale, task.product)} </div>
                            <div className="mt-2 text-xs text-white/40">{copyLocalizedText(locale, task.output)}</div> </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs ${statusCopy.className}`}>
                            {locale === 'zh' ? statusCopy.zh : statusCopy.en} </span>
                        </div>
                        <button
                          onClick={() => { setSelectedTaskId(task.id)
                            setTaskDrawerOpen(true) }}
                          className="mt-4 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                        >
                          {locale === 'zh' ? '查看任务详情' : 'Open Task Drawer'}
                          <ArrowRight className="h-4 w-4" /> </button>
                      </div> )
                  }) ) : (
                  <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-sm text-white/40">
                    {locale === 'zh' ? '当前筛选条件下没有匹配任务。' : 'No tasks match the current filters.'} </div>
                )} </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '当前产物与协作状态' : 'Current Assets and Collaboration'} </div>
              <div className="space-y-3">
                {mock.assets.map(item => {
                  const style = DESIGN_STATUS_STYLES[item.status]
                  return ( <button
                      key={item.id}
                      onClick={() => setSelectedAssetId(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${ selectedAsset?.id === item.id
                          ? 'border-brand-500/30 bg-brand-500/10' : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">{copyLocalizedText(locale, item.title)}</div>
                          <div className="mt-2 text-sm leading-6 text-white/45">{copyLocalizedText(locale, item.desc)}</div>
                          <div className="mt-2 text-xs text-white/35">{copyLocalizedText(locale, item.meta)}</div> </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${style.className}`}>
                          {locale === 'zh' ? style.zh : style.en} </span>
                      </div> </button>
                  ) })}
              </div> </div>
          </div>
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '当前流程节点' : 'Current Workflow Node'} </div>
              {activeStage ? ( <>
                  <h3 className="text-lg font-semibold text-white">{copyLocalizedText(locale, activeStage.title)}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{copyLocalizedText(locale, activeStage.desc)}</p>
                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40">
                    {copyLocalizedText(locale, activeStage.meta)} </div>
                  <div className="mt-5 space-y-3">
                    {[ locale === 'zh' ? '当前节点已接入任务推进与产物信息。' : 'This node is now connected with task progression and asset details.',
                      locale === 'zh' ? '支持在不同路由下切换为商品、设计、团队和历史视角。' : 'Supports route-specific views for product, design, team, and history.', locale === 'zh' ? '可继续向真实任务系统和导出链路替换。' : 'Ready to be replaced with real job orchestration and export flows.',
                    ].map(item => ( <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                        {item} </div>
                    ))} </div>
                </> ) : (
                <div className="text-sm text-white/40">
                  {locale === 'zh' ? '没有找到匹配节点。' : 'No matching node found.'} </div>
              )} </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '成员与时间线' : 'Members and Timeline'} </div>
              <div className="space-y-3">
                {mock.members.map(member => ( <div key={member.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    <div className="mt-1 text-xs text-white/35">{copyLocalizedText(locale, member.role)}</div>
                    <div className="mt-2 text-xs text-white/45">{copyLocalizedText(locale, member.focus)}</div> </div>
                ))}
                {mock.timeline.map(item => ( <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-white/75">{copyLocalizedText(locale, item.title)}</div>
                      <div className="text-xs text-white/35">{item.time}</div> </div>
                    <div className="mt-2 text-xs text-white/45">{copyLocalizedText(locale, item.meta)}</div> </div>
                ))} </div>
            </div>
            {selectedAsset ? ( <div className="glass rounded-2xl p-5">
                <div className="mb-3 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '当前选中产物' : 'Selected Asset'} </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white">{copyLocalizedText(locale, selectedAsset.title)}</div>
                  <div className="mt-2 text-sm leading-6 text-white/50">{copyLocalizedText(locale, selectedAsset.desc)}</div>
                  <div className="mt-2 text-xs text-white/35">{copyLocalizedText(locale, selectedAsset.meta)}</div> </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleSyncAssetToLibrary}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {locale === 'zh' ? '同步到图片素材库' : 'Sync to Image Library'} </button>
                  <button
                    onClick={handlePushToDelivery}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {locale === 'zh' ? '加入下载中心交付包' : 'Add to Download Center'} </button>
                  <button
                    onClick={handleBridgeTemplate}
                    className="w-full rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-300 transition-colors hover:bg-brand-500/15"
                  >
                    {locale === 'zh' ? '桥接为 Agent 模板' : 'Bridge as Agent Template'} </button>
                </div> </div>
            ) : null} </aside>
        </section> </div>
      {taskDrawerOpen && selectedTask && ( <DetailDrawer
          open={taskDrawerOpen}
          onClose={() => setTaskDrawerOpen(false)}
          subtitle={selectedTask.id}
          title={copyLocalizedText(locale, selectedTask.title)}
        >
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '当前状态' : 'Current Status'} </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${DESIGN_STATUS_STYLES[selectedTask.status].className}`}>
                  {locale === 'zh' ? DESIGN_STATUS_STYLES[selectedTask.status].zh : DESIGN_STATUS_STYLES[selectedTask.status].en} </span>
                <div className="mt-3 text-sm text-white/45">
                  {locale === 'zh' ? `负责人: ${selectedTask.owner}，关联商品: ${copyLocalizedText(locale, selectedTask.product)}。`
                    : `Owner: ${selectedTask.owner}. Linked product: ${copyLocalizedText(locale, selectedTask.product)}.`} </div>
                <div className="mt-2 text-sm text-white/45">{copyLocalizedText(locale, selectedTask.output)}</div> </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-6 text-white/50">
                {locale === 'zh' ? '这条任务现在已经和商品、产物、成员、团队时间线建立了基础关联，可继续替换成真实异步任务和导出回调。'
                  : 'This task is now linked with products, outputs, members, and the team timeline, and can be replaced with real async jobs and export callbacks later.'} </div>
              <button
                onClick={() => handleAdvanceTask(selectedTask.id, selectedTask.status)}
                disabled={selectedTask.status === 'done'}
                className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedTask.status === 'done' ? locale === 'zh' ? '任务已完成' : 'Task Completed'
                  : locale === 'zh' ? '推进到下一状态' : 'Advance to Next State'} </button>
            </div> </DetailDrawer>
      )} </div>
  ) }
