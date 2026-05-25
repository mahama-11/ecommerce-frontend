import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight,
  Bookmark, CheckCircle2,
  Database, Download,
  FileText, Filter,
  ImageIcon, Inbox,
  Package2, Search,
  ShieldAlert, Sparkles,
  Tag, UploadCloud,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DetailDrawer from '@/components/DetailDrawer'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import { DELIVERY_ITEMS,
  ORDER_ITEMS, UPLOAD_GROUPS,
  copyText, createMockDelivery,
  createMockOrder, createMockUpload,
  type DeliveryItem, type DeliveryStatus,
  type Locale, type LocalizedText,
  type OrderItem, type OrderStatus,
  type UploadItem, type UploadStatus,
} from '@/mock/assetCommerce'
import { createLinkedUploadFromDesign,
  type WorkflowEvent, } from '@/mock/workflowBridge'
import { Button } from '@/components/ui/Button'
interface PageConfig { titleKey: string
  icon: LucideIcon
  badge: LocalizedText
  subtitle: LocalizedText
  stats: Array<{ value: string; label: LocalizedText }>
  collections: Array<{ title: LocalizedText; desc: LocalizedText; meta: LocalizedText }>
  actions: Array<{ label: LocalizedText; to: string }> }
type AssetCommercePageKey = keyof typeof PAGE_CONFIG
const PAGE_CONFIG: Record<string, PageConfig> = { '/database/knowledge': {
    titleKey: 'pages.databaseKnowledge', icon: Database,
    badge: { zh: 'AI 可消费知识层', en: 'AI-Consumable Knowledge Layer' }, subtitle: {
      zh: '把品牌、平台、合规和 SOP 资料沉淀成知识资产，为问答和模板提供上下文。', en: 'Turn brand, platform, compliance, and SOP content into knowledge assets for chat and templates.',
    }, stats: [
      { value: '248', label: { zh: '知识条目', en: 'Knowledge Entries' } }, { value: '16', label: { zh: '主题分类', en: 'Topic Buckets' } },
      { value: '12', label: { zh: '最近更新', en: 'Recent Updates' } }, ],
    collections: [ {
        title: { zh: '品牌规则手册', en: 'Brand Rule Handbook' }, desc: { zh: '管理语气、禁用词、卖点描述和营销边界。', en: 'Manage tone, restricted terms, selling-point phrasing, and marketing boundaries.' },
        meta: { zh: '适合知识库问答', en: 'Best for knowledge chat grounding' }, },
      { title: { zh: '平台合规文档', en: 'Platform Compliance Docs' },
        desc: { zh: '沉淀站点政策、敏感词规则和发布约束。', en: 'Store marketplace policies, risk terms, and publishing constraints.' }, meta: { zh: '后续接引用式回答', en: 'Ready for citation answers' },
      }, ],
    actions: [ { label: { zh: '知识库对话', en: 'Knowledge Chat' }, to: '/chat/doc' },
      { label: { zh: '品牌库', en: 'Brand Library' }, to: '/brandLibrary' }, ],
  }, '/database/picturelibrary': {
    titleKey: 'pages.databasePicturelibrary', icon: ImageIcon,
    badge: { zh: '图片资产中心', en: 'Image Asset Center' }, subtitle: {
      zh: '管理白底图、场景图、模特图、参考图和视频封面等视觉素材。', en: 'Manage white-background images, scenes, model shots, references, and video covers in one visual library.',
    }, stats: [
      { value: '1.8k', label: { zh: '素材数量', en: 'Assets' } }, { value: '11', label: { zh: '素材分组', en: 'Collections' } },
      { value: '84%', label: { zh: '复用率', en: 'Reuse Rate' } }, ],
    collections: [ {
        title: { zh: '场景图库', en: 'Scene Library' }, desc: { zh: '承接 AI 生成场景图、灵感参考和历史沉淀素材。', en: 'Capture AI-generated scenes, inspiration references, and archived visual assets.' },
        meta: { zh: '连接视觉生成链', en: 'Connects to visual generation' }, },
      { title: { zh: '商品素材池', en: 'Product Asset Pool' },
        desc: { zh: '关联 SKU、角度图、主图版本和设计稿源文件。', en: 'Link SKUs, angle shots, hero versions, and source design files.' }, meta: { zh: '为商品中心服务', en: 'Serves the product center' },
      }, ],
    actions: [ { label: { zh: '场景参考图库', en: 'Scene Reference Gallery' }, to: '/draw/scene-reference' },
      { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' }, ],
  }, '/brandLibrary': {
    titleKey: 'pages.brandLibrary', icon: Bookmark,
    badge: { zh: '品牌资产底座', en: 'Brand Asset Foundation' }, subtitle: {
      zh: '把品牌规则、语气、视觉标准和营销边界统一沉淀，为 AI 输出约束提供基础。', en: 'Consolidate brand rules, tone, visual standards, and marketing boundaries as constraints for AI outputs.',
    }, stats: [
      { value: '9', label: { zh: '品牌档案', en: 'Brand Profiles' } }, { value: '27', label: { zh: '品牌规则', en: 'Brand Rules' } },
      { value: '3', label: { zh: '共享团队', en: 'Shared Teams' } }, ],
    collections: [ {
        title: { zh: '品牌规则卡片', en: 'Brand Rule Cards' }, desc: { zh: '统一管理语气、禁用词、色板、字体和话术习惯。', en: 'Manage tone, forbidden terms, color palettes, fonts, and phrasing habits.' },
        meta: { zh: '服务所有 AI 能力', en: 'Supports all AI capabilities' }, },
      { title: { zh: '品牌输出约束', en: 'Output Constraints' },
        desc: { zh: '未来可作用于模板、Listing、设计器与视频生成。', en: 'Later constrain templates, listings, design, and video generation.' }, meta: { zh: '统一品牌一致性', en: 'Unified brand consistency' },
      }, ],
    actions: [ { label: { zh: '敏感词库', en: 'Sensitive Terms' }, to: '/database/sensitiveThesaurus' },
      { label: { zh: '标签管理', en: 'Tag Management' }, to: '/database/tagManage' }, ],
  }, '/database/sensitiveThesaurus': {
    titleKey: 'pages.databaseSensitiveThesaurus', icon: ShieldAlert,
    badge: { zh: '内容风控规则层', en: 'Content Risk-Control Layer' }, subtitle: {
      zh: '管理平台风险词、品牌禁用语和触发规则，为内容生成前后质检服务。', en: 'Manage risk terms, brand restrictions, and triggers for content QA before and after generation.',
    }, stats: [
      { value: '216', label: { zh: '风险词', en: 'Risk Terms' } }, { value: '4', label: { zh: '规则集', en: 'Rule Sets' } },
      { value: '18', label: { zh: '触发样例', en: 'Triggered Cases' } }, ],
    collections: [ {
        title: { zh: '规则优先级', en: 'Rule Priorities' }, desc: { zh: '区分平台级、品牌级、活动级不同的拦截和提醒规则。', en: 'Separate platform, brand, and campaign-level block and warning rules.' },
        meta: { zh: '为质检链路服务', en: 'Supports the QA chain' }, },
      { title: { zh: '自动修复建议', en: 'Auto-fix Suggestions' },
        desc: { zh: '提供替代表达、替换建议与失败重试提示。', en: 'Reserve alternative phrases, replacement suggestions, and retry prompts.' }, meta: { zh: '辅助修复建议', en: 'Ready for AI-assisted repair' },
      }, ],
    actions: [ { label: { zh: '品牌库', en: 'Brand Library' }, to: '/brandLibrary' },
      { label: { zh: '批量 Listing', en: 'Batch Listing' }, to: '/aiChat/batchListing' }, ],
  }, '/database/tagManage': {
    titleKey: 'pages.databaseTagManage', icon: Tag,
    badge: { zh: '跨模块标签体系', en: 'Cross-Module Tag System' }, subtitle: {
      zh: '标签把素材、知识、模板、项目和商品中心串成统一检索语言。', en: 'Tags connect assets, knowledge, templates, projects, and product centers into one retrieval language.',
    }, stats: [
      { value: '63', label: { zh: '业务标签', en: 'Business Tags' } }, { value: '18', label: { zh: '平台标签', en: 'Platform Tags' } },
      { value: '9', label: { zh: '视觉标签', en: 'Visual Tags' } }, ],
    collections: [ {
        title: { zh: '标签层级树', en: 'Tag Hierarchy Tree' }, desc: { zh: '按渠道、品类、场景、用途和风险等级组织标签结构。', en: 'Organize tags by channel, category, scenario, use case, and risk level.' },
        meta: { zh: '支持跨页筛选', en: 'Supports cross-page filtering' }, },
      { title: { zh: '自动打标', en: 'Auto-tag Hooks' },
        desc: { zh: '自动识别内容和图片特征，减少手工整理。', en: 'Reserve AI hooks for auto-tagging content and images.' }, meta: { zh: '可持续扩展', en: 'Engineering extension point' },
      }, ],
    actions: [ { label: { zh: '图片素材库', en: 'Image Library' }, to: '/database/picturelibrary' },
      { label: { zh: '知识库', en: 'Knowledge Base' }, to: '/database/knowledge' }, ],
  }, '/orderList': {
    titleKey: 'pages.orderList', icon: FileText,
    badge: { zh: '商业中心', en: 'Commerce Center' }, subtitle: {
      zh: '展示订阅、充值包、团队席位和服务采购的商业订单流。', en: 'Show subscriptions, credit packs, team seats, and service procurement order flows.',
    }, stats: [
      { value: '12', label: { zh: '订单数', en: 'Orders' } }, { value: '3', label: { zh: '活跃订阅', en: 'Active Plans' } },
      { value: '2', label: { zh: '待支付', en: 'Pending Payment' } }, ],
    collections: [ {
        title: { zh: '商业订单流', en: 'Commercial Order Flow' }, desc: { zh: '区分订阅、资源包、团队版和咨询服务等不同订单类型。', en: 'Separate subscriptions, credit packs, team plans, and service consulting orders.' },
        meta: { zh: '后续接真实支付与开票', en: 'Ready for billing and invoicing' }, },
      { title: { zh: '售后状态位', en: 'After-sales States' },
        desc: { zh: '预留退款、发票、客服工单和升级补差流程。', en: 'Reserve refund, invoice, support ticket, and upgrade delta flows.' }, meta: { zh: '平台商业化骨架', en: 'Platform monetization skeleton' },
      }, ],
    actions: [ { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
      { label: { zh: '定价页', en: 'Pricing Page' }, to: '/pricing' }, ],
  }, '/account/billing': {
    titleKey: 'pages.orderList', icon: FileText,
    badge: { zh: '商业中心', en: 'Commerce Center' }, subtitle: {
      zh: '展示订阅、充值包、团队席位和服务采购的商业订单流。', en: 'Show subscriptions, credit packs, team seats, and service procurement order flows.',
    }, stats: [
      { value: '12', label: { zh: '订单数', en: 'Orders' } }, { value: '3', label: { zh: '活跃订阅', en: 'Active Plans' } },
      { value: '2', label: { zh: '待支付', en: 'Pending Payment' } }, ],
    collections: [ {
        title: { zh: '商业订单流', en: 'Commercial Order Flow' }, desc: { zh: '区分订阅、资源包、团队版和咨询服务等不同订单类型。', en: 'Separate subscriptions, credit packs, team plans, and service consulting orders.' },
        meta: { zh: '后续接真实支付与开票', en: 'Ready for billing and invoicing' }, },
      { title: { zh: '售后状态位', en: 'After-sales States' },
        desc: { zh: '预留退款、发票、客服工单和升级补差流程。', en: 'Reserve refund, invoice, support ticket, and upgrade delta flows.' }, meta: { zh: '平台商业化骨架', en: 'Platform monetization skeleton' },
      }, ],
    actions: [ { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
      { label: { zh: '定价页', en: 'Pricing Page' }, to: '/pricing' }, ],
  }, '/downloadCenter': {
    titleKey: 'pages.downloadCenter', icon: Download,
    badge: { zh: '结果交付中心', en: 'Result Delivery Center' }, subtitle: {
      zh: '统一管理生成结果、导出包、批量任务压缩包与历史下载记录。', en: 'Manage generated outputs, export bundles, batch archives, and download history in one delivery center.',
    }, stats: [
      { value: '64', label: { zh: '可下载结果', en: 'Available Files' } }, { value: '9', label: { zh: '批量打包', en: 'Batch Bundles' } },
      { value: '1.2GB', label: { zh: '占用空间', en: 'Storage Used' } }, ],
    collections: [ {
        title: { zh: '交付包管理', en: 'Delivery Bundle Management' }, desc: { zh: '按商品、任务、设计稿和导出格式组织结果包。', en: 'Organize result packages by product, task, draft, and file format.' },
        meta: { zh: '连接生成与交付', en: 'Connects generation to delivery' }, },
      { title: { zh: '失效时间与重打包', en: 'Expiry and Re-bundling' },
        desc: { zh: '后续展示文件保留时长、重新打包和下载次数。', en: 'Show retention times, re-bundle actions, and download counts later.' }, meta: { zh: '适合异步任务联动', en: 'Works with async jobs' },
      }, ],
    actions: [ { label: { zh: '订单与额度', en: 'Orders & Credits' }, to: '/account/billing' },
      { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' }, ],
  }, '/account/downloads': {
    titleKey: 'pages.downloadCenter', icon: Download,
    badge: { zh: '结果交付中心', en: 'Result Delivery Center' }, subtitle: {
      zh: '统一管理生成结果、导出包、批量任务压缩包与历史下载记录。', en: 'Manage generated outputs, export bundles, batch archives, and download history in one delivery center.',
    }, stats: [
      { value: '64', label: { zh: '可下载结果', en: 'Available Files' } }, { value: '9', label: { zh: '批量打包', en: 'Batch Bundles' } },
      { value: '1.2GB', label: { zh: '占用空间', en: 'Storage Used' } }, ],
    collections: [ {
        title: { zh: '交付包管理', en: 'Delivery Bundle Management' }, desc: { zh: '按商品、任务、设计稿和导出格式组织结果包。', en: 'Organize result packages by product, task, draft, and file format.' },
        meta: { zh: '连接生成与交付', en: 'Connects generation to delivery' }, },
      { title: { zh: '失效时间与重打包', en: 'Expiry and Re-bundling' },
        desc: { zh: '后续展示文件保留时长、重新打包和下载次数。', en: 'Show retention times, re-bundle actions, and download counts later.' }, meta: { zh: '适合异步任务联动', en: 'Works with async jobs' },
      }, ],
    actions: [ { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' },
      { label: { zh: '订单与额度', en: 'Orders & Credits' }, to: '/account/billing' }, ],
  }, }
export default function AssetCommercePage({ forcedPath }: { forcedPath?: AssetCommercePageKey }) {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const pageKey = forcedPath ?? pathname
  const config = PAGE_CONFIG[pageKey] ?? PAGE_CONFIG['/database/knowledge']
  const Icon = config.icon
  const isOrderPage = pageKey === '/orderList' || pageKey === '/account/billing'
  const isDownloadPage = pageKey === '/downloadCenter' || pageKey === '/account/downloads'
  const isAssetPage = !isOrderPage && !isDownloadPage
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview')
  const [statusFilter, setStatusFilter] = useState<'all' | UploadStatus | OrderStatus | DeliveryStatus>('all')
  const [uploads, setUploads] = useState<UploadItem[]>(() => UPLOAD_GROUPS[pageKey] ?? [])
  const [orders, setOrders] = useState<OrderItem[]>(ORDER_ITEMS)
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(DELIVERY_ITEMS)
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTitle, setDrawerTitle] = useState('')
  const [drawerSubtitle, setDrawerSubtitle] = useState('')
  const [drawerNotes, setDrawerNotes] = useState<string[]>([])
  useEffect(() => { setSearchQuery('')
    setSelectedIndex(0)
    setViewMode('overview')
    setStatusFilter('all')
    setDrawerOpen(false)
    setDrawerTitle('')
    setDrawerSubtitle('')
    setDrawerNotes([])
    void productWorkspaceRepository.listWorkflowEvents().then(events => { setWorkflowEvents(events.slice(0, 4))
    })
    if (pageKey === '/database/picturelibrary') { void productWorkspaceRepository.listLinkedDesignAssets().then(assets => {
        setUploads([...assets.map(createLinkedUploadFromDesign), ...(UPLOAD_GROUPS[pageKey] ?? [])]) })
    } else { setUploads(UPLOAD_GROUPS[pageKey] ?? [])
    }
    if (isDownloadPage) { void productWorkspaceRepository.listLinkedDeliveries().then(items => {
        setDeliveries([...items, ...DELIVERY_ITEMS]) })
    } else { setDeliveries(DELIVERY_ITEMS)
    } }, [isDownloadPage, pageKey])
  const visibleCollections = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return config.collections
    return config.collections.filter(item => {
      const title = copyText(locale, item.title).toLowerCase()
      const desc = copyText(locale, item.desc).toLowerCase()
      const meta = copyText(locale, item.meta).toLowerCase()
      return title.includes(normalized) || desc.includes(normalized) || meta.includes(normalized) })
  }, [config.collections, locale, searchQuery])
  const visibleUploads = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    return uploads.filter(item => {
      const matchesFilter = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch = !normalized ||
        copyText(locale, item.name).toLowerCase().includes(normalized) || copyText(locale, item.meta).toLowerCase().includes(normalized)
      return matchesFilter && matchesSearch })
  }, [locale, searchQuery, statusFilter, uploads])
  const visibleOrders = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    return orders.filter(item => {
      const matchesFilter = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch = !normalized ||
        copyText(locale, item.title).toLowerCase().includes(normalized) || copyText(locale, item.meta).toLowerCase().includes(normalized) ||
        item.amount.toLowerCase().includes(normalized)
      return matchesFilter && matchesSearch })
  }, [locale, orders, searchQuery, statusFilter])
  const visibleDeliveries = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    return deliveries.filter(item => {
      const matchesFilter = statusFilter === 'all' || item.status === statusFilter
      const matchesSearch = !normalized ||
        copyText(locale, item.title).toLowerCase().includes(normalized) || copyText(locale, item.meta).toLowerCase().includes(normalized) ||
        item.size.toLowerCase().includes(normalized)
      return matchesFilter && matchesSearch })
  }, [deliveries, locale, searchQuery, statusFilter])
  const selectedCollection = visibleCollections[selectedIndex] ?? visibleCollections[0] ?? config.collections[0]
  const handleSelect = (index: number) => { setSelectedIndex(index)
    setViewMode('detail') }
  const getStatusText = (status: UploadStatus | OrderStatus | DeliveryStatus) => {
    switch (status) { case 'queued':
        return locale === 'zh' ? '待处理' : 'Queued'
      case 'processing': return locale === 'zh' ? '处理中' : 'Processing'
      case 'ready': return locale === 'zh' ? '已就绪' : 'Ready'
      case 'pending': return locale === 'zh' ? '待支付' : 'Pending'
      case 'active': return locale === 'zh' ? '生效中' : 'Active'
      case 'invoice': return locale === 'zh' ? '开票中' : 'Invoicing'
      case 'packing': return locale === 'zh' ? '打包中' : 'Packing'
      case 'expired': return locale === 'zh' ? '已过期' : 'Expired'
      default: return status
    } }
  const getStatusClass = (status: UploadStatus | OrderStatus | DeliveryStatus) => {
    switch (status) { case 'ready':
      case 'active': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      case 'processing': case 'packing':
      case 'invoice': return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
      case 'pending': case 'queued':
        return 'border-sky-500/20 bg-sky-500/10 text-sky-300'
      case 'expired': return 'border-white/[0.08] bg-white/[0.03] text-white/55'
      default: return 'border-white/[0.08] bg-white/[0.03] text-white/55'
    } }
  const queueSummary = useMemo(() => {
    const source = isOrderPage ? orders : isDownloadPage ? deliveries : uploads
    return source.reduce<Record<string, number>>((acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1
      return acc }, {})
  }, [deliveries, isDownloadPage, isOrderPage, orders, uploads])
  const filterOptions = useMemo(() => {
    if (isOrderPage) {
      return [ { key: 'all', label: locale === 'zh' ? '全部状态' : 'All States' },
        { key: 'pending', label: getStatusText('pending') }, { key: 'active', label: getStatusText('active') },
        { key: 'invoice', label: getStatusText('invoice') }, ]
    }
    if (isDownloadPage) {
      return [ { key: 'all', label: locale === 'zh' ? '全部状态' : 'All States' },
        { key: 'packing', label: getStatusText('packing') }, { key: 'ready', label: getStatusText('ready') },
        { key: 'expired', label: getStatusText('expired') }, ]
    }
    return [ { key: 'all', label: locale === 'zh' ? '全部状态' : 'All States' },
      { key: 'queued', label: getStatusText('queued') }, { key: 'processing', label: getStatusText('processing') },
      { key: 'ready', label: getStatusText('ready') }, ]
  }, [isDownloadPage, isOrderPage, locale])
  const openDrawer = (payload: { title: string; subtitle: string; notes: string[] }) => { setDrawerTitle(payload.title)
    setDrawerSubtitle(payload.subtitle)
    setDrawerNotes(payload.notes)
    setDrawerOpen(true) }
  const handleQueueOpen = (item: UploadItem) => { openDrawer({
      title: copyText(locale, item.name), subtitle: getStatusText(item.status),
      notes: [ copyText(locale, item.meta),
        locale === 'zh' ? '后续可接真实上传进度、解析日志和团队权限。' : 'Ready for real upload progress, parsing logs, and team permissions.', locale === 'zh' ? '当前 mock 已覆盖“加入队列 -> 处理 -> 入库”这条基础链路。' : 'This mock now covers the core flow from queueing to processing to indexing.',
      ], })
  }
  const handleOrderOpen = (item: OrderItem) => { openDrawer({
      title: copyText(locale, item.title), subtitle: `${item.amount} · ${getStatusText(item.status)}`,
      notes: [ copyText(locale, item.meta),
        locale === 'zh' ? '集中查看支付、发票、退款和权益开通状态。' : 'Ready for payment, invoicing, refunds, and entitlement activation states.', locale === 'zh' ? '统一管理套餐、加油包和席位扩容订单。' : 'Fits subscriptions, credit packs, and seat-expansion orders under one model.',
      ], })
  }
  const handleDeliveryOpen = (item: DeliveryItem) => { openDrawer({
      title: copyText(locale, item.title), subtitle: `${item.size} · ${getStatusText(item.status)}`,
      notes: [ copyText(locale, item.meta),
        locale === 'zh' ? '后续可接下载次数、失效时间和重新打包动作。' : 'Ready for download counts, expiry windows, and re-bundling actions.', locale === 'zh' ? '适合承接图片、视频、设计稿和批量任务结果。' : 'Suitable for images, videos, design drafts, and batch-task outputs.',
      ], })
  }
  const handlePrimaryAction = () => {
    if (isOrderPage) { setOrders(prev => [createMockOrder(prev.length), ...prev])
      return
    }
    if (isDownloadPage) { setDeliveries(prev => [createMockDelivery(prev.length), ...prev])
      return
    }
    setUploads(prev => [createMockUpload(pageKey, prev.length), ...prev]) }
  const activeItemsCount = isOrderPage ? visibleOrders.length : isDownloadPage ? visibleDeliveries.length : visibleUploads.length
  const primaryActionLabel = isOrderPage ? locale === 'zh'
      ? '模拟创建订单' : 'Create Mock Order'
    : isDownloadPage ? locale === 'zh'
        ? '加入打包队列' : 'Add Bundle Queue'
      : locale === 'zh' ? '模拟上传文件'
        : 'Mock Upload'
  const operationsTitle = isOrderPage ? locale === 'zh'
      ? '订单状态流' : 'Order State Flow'
    : isDownloadPage ? locale === 'zh'
        ? '交付与下载队列' : 'Delivery and Download Queue'
      : locale === 'zh' ? '上传与入库队列'
        : 'Upload and Index Queue'
  const operationsHint = isOrderPage ? locale === 'zh'
      ? '模拟商业订单、支付状态和开票状态的基础骨架。' : 'A mock baseline for commercial orders, payment states, and invoice states.'
    : isDownloadPage ? locale === 'zh'
        ? '模拟结果打包、下载交付和文件失效流程。' : 'A mock baseline for bundling, delivery, and file expiry flows.'
      : locale === 'zh' ? '模拟上传、解析、入库和后续权限接入流程。'
        : 'A mock baseline for upload, parsing, indexing, and future permissions.'
  const summaryTitle = isOrderPage ? locale === 'zh'
      ? '商业骨架说明' : 'Commerce Skeleton Notes'
    : isDownloadPage ? locale === 'zh'
        ? '交付骨架说明' : 'Delivery Skeleton Notes'
      : locale === 'zh' ? '资料骨架说明'
        : 'Asset Skeleton Notes'
  return ( <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{copyText(locale, config.badge)}</span> </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" /> </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text sm:text-3xl">{t(config.titleKey)}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{copyText(locale, config.subtitle)}</p> </div>
              </div> </div>
            <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
              {config.actions.map(action => ( <Link
                  key={action.to}
                  to={action.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white sm:w-auto"
                >
                  <span>{copyText(locale, action.label)}</span>
                  <ArrowRight className="h-4 w-4" /> </Link>
              ))} </div>
          </div> </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.stats.map(stat => ( <div key={stat.value + stat.label.zh} className="glass rounded-2xl p-5">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/45">{copyText(locale, stat.label)}</div> </div>
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
                      setSelectedIndex(0) }}
                    placeholder={locale === 'zh' ? '搜索资料、规则、资产组...' : 'Search documents, rules, or asset groups...'}
                    className="glass w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
                  /> </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/45">
                  <Filter className="h-3.5 w-3.5 text-brand-400" />
                <span>
                  {isAssetPage ? locale === 'zh'
                      ? '基础检索与资料骨架已接入' : 'Basic retrieval and asset skeleton enabled'
                    : locale === 'zh' ? '基础检索与状态流骨架已接入'
                      : 'Basic retrieval and state-flow skeleton enabled'} </span>
                </div> </div>
            </div>
            <div className="flex gap-2">
              {[ { key: 'overview', zh: '概览视图', en: 'Overview' },
                { key: 'detail', zh: '详情视图', en: 'Detail' }, ].map(item => (
                <Button
                  key={item.key}
                  onClick={() => setViewMode(item.key as 'overview' | 'detail')}
                  className={`rounded-xl px-4 py-2 text-sm transition-colors ${ viewMode === item.key
                      ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.03] text-white/50 hover:bg-[var(--ecom-surface-hover)] hover:text-white'
                  }`}
                >
                  {locale === 'zh' ? item.zh : item.en} </Button>
              ))} </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleCollections.map((item, index) => ( <article
                  key={item.title.zh}
                  className={`tool-card glass rounded-2xl p-5 transition-colors ${ selectedCollection?.title.zh === item.title.zh ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                  }`}
                >
                  <h3 className="mb-3 text-lg font-semibold text-white">{copyText(locale, item.title)}</h3>
                  <p className="mb-5 text-sm leading-6 text-white/55">{copyText(locale, item.desc)}</p>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40">
                    {copyText(locale, item.meta)} </div>
                  <Button
                    onClick={() => handleSelect(index)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                  >
                    {locale === 'zh' ? '查看详情' : 'View Details'}
                    <ArrowRight className="h-4 w-4" /> </Button>
                </article> ))}
            </div> </div>
          <aside className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium text-white/75">
              {locale === 'zh' ? '当前选中详情' : 'Selected Detail'} </div>
            {selectedCollection ? ( <>
                <h3 className="text-lg font-semibold text-white">{copyText(locale, selectedCollection.title)}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{copyText(locale, selectedCollection.desc)}</p>
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40">
                  {copyText(locale, selectedCollection.meta)} </div>
                <div className="mt-5 space-y-3">
                  {[ locale === 'zh' ? '支持后续接搜索、高级筛选和分页。' : 'Ready for future search, advanced filtering, and pagination.',
                    locale === 'zh' ? '支持接详情抽屉、编辑表单和版本状态。' : 'Ready for detail drawers, edit forms, and version states.', locale === 'zh' ? '支持与聊天、模板、商品中心联动。' : 'Ready to link with chat, templates, and the product center.',
                  ].map(item => ( <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                      {item} </div>
                  ))} </div>
              </> ) : (
              <div className="text-sm text-white/40">
                {locale === 'zh' ? '没有找到匹配项。' : 'No matching item found.'} </div>
            )} </aside>
        </section>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="glass rounded-2xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                  {isAssetPage ? <UploadCloud className="h-4 w-4 text-brand-400" /> : <Inbox className="h-4 w-4 text-brand-400" />}
                  <span>{operationsTitle}</span> </div>
                <p className="mt-2 text-sm text-white/45">{operationsHint}</p> </div>
              <div className="flex flex-wrap items-center gap-2">
                {filterOptions.map(option => ( <Button
                    key={option.key}
                    onClick={() => setStatusFilter(option.key as 'all' | UploadStatus | OrderStatus | DeliveryStatus)}
                    className={`rounded-xl px-3 py-2 text-xs transition-colors ${ statusFilter === option.key
                        ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.03] text-white/45 hover:bg-[var(--ecom-surface-hover)] hover:text-white'
                    }`}
                  >
                    {option.label} </Button>
                ))}
                <Button
                  onClick={handlePrimaryAction}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-300 transition-colors hover:bg-brand-500/15"
                >
                  {isAssetPage ? <UploadCloud className="h-4 w-4" /> : <Package2 className="h-4 w-4" />}
                  <span>{primaryActionLabel}</span> </Button>
              </div> </div>
            <div className="mt-5 space-y-3">
              {isAssetPage && visibleUploads.map(item => (
                  <Button
                    key={item.id}
                    onClick={() => handleQueueOpen(item)}
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:bg-[var(--ecom-surface-hover)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{copyText(locale, item.name)}</div>
                        <div className="mt-1 text-sm text-white/45">{copyText(locale, item.meta)}</div> </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${getStatusClass(item.status)}`}>
                        {getStatusText(item.status)} </span>
                    </div> </Button>
                ))}
              {isOrderPage && visibleOrders.map(item => (
                  <Button
                    key={item.id}
                    onClick={() => handleOrderOpen(item)}
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:bg-[var(--ecom-surface-hover)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{copyText(locale, item.title)}</div>
                        <div className="mt-1 text-sm text-white/45">{copyText(locale, item.meta)}</div>
                        <div className="mt-2 text-xs text-white/30">{item.id}</div> </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="text-base font-semibold text-white">{item.amount}</div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${getStatusClass(item.status)}`}>
                          {getStatusText(item.status)} </span>
                      </div> </div>
                  </Button> ))}
              {isDownloadPage && visibleDeliveries.map(item => (
                  <Button
                    key={item.id}
                    onClick={() => handleDeliveryOpen(item)}
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-left transition-colors hover:bg-[var(--ecom-surface-hover)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{copyText(locale, item.title)}</div>
                        <div className="mt-1 text-sm text-white/45">{copyText(locale, item.meta)}</div>
                        <div className="mt-2 text-xs text-white/30">{item.id}</div> </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="text-base font-semibold text-white">{item.size}</div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${getStatusClass(item.status)}`}>
                          {getStatusText(item.status)} </span>
                      </div> </div>
                  </Button> ))}
              {!activeItemsCount && ( <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-sm text-white/40">
                  {locale === 'zh' ? '当前筛选条件下没有匹配结果。' : 'No result matches the current filters.'} </div>
              )} </div>
          </div>
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">{summaryTitle}</div>
              <div className="space-y-3">
                {Object.entries(queueSummary).map(([key, count]) => ( <div key={key} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white/55">{getStatusText(key as UploadStatus | OrderStatus | DeliveryStatus)}</span>
                    <span className="text-sm font-semibold text-white">{count}</span> </div>
                ))} </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '已具备的基础能力' : 'Foundation Capabilities Added'}</span> </div>
              <div className="space-y-2 text-sm text-white/45">
                {(isAssetPage ? [
                      locale === 'zh' ? '上传队列与入库状态' : 'Upload queue and indexing states', locale === 'zh' ? '搜索与状态筛选' : 'Search and status filters',
                      locale === 'zh' ? '详情抽屉与后续接口说明' : 'Detail drawer and next-step integration hints', ]
                  : isOrderPage ? [
                        locale === 'zh' ? '订单状态与金额展示' : 'Order state and amount display', locale === 'zh' ? '模拟建单与商业流骨架' : 'Mock order creation and commerce-flow skeleton',
                        locale === 'zh' ? '支付 / 发票 / 权益开通扩展位' : 'Payment / invoice / entitlement extension points', ]
                    : [ locale === 'zh' ? '交付打包与可下载状态' : 'Bundle packaging and downloadable states',
                        locale === 'zh' ? '模拟加入交付队列' : 'Mock add-to-delivery queue', locale === 'zh' ? '失效时间与重打包扩展位' : 'Expiry and re-bundling extension points',
                      ] ).map(item => (
                  <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    {item} </div>
                ))} </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '跨页回流记录' : 'Cross-page Workflow Feed'} </div>
              <div className="space-y-3">
                {workflowEvents.length ? ( workflowEvents.map(item => (
                    <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                      <div className="text-sm text-white/75">{copyText(locale, item.title)}</div>
                      <div className="mt-1 text-xs text-white/45">{copyText(locale, item.detail)}</div> </div>
                  )) ) : (
                  <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm text-white/40">
                    {locale === 'zh' ? '当前还没有跨页回流记录。' : 'No cross-page workflow records yet.'} </div>
                )} </div>
            </div> </aside>
        </section>
        <section className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
            <Package2 className="h-4 w-4 text-brand-400" />
            <span>{locale === 'zh' ? '后续联动动作' : 'Future actions'}</span> </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[ locale === 'zh' ? '资产上传 / 分组 / 检索' : 'Asset upload / grouping / search',
              locale === 'zh' ? '资料权限 / 团队共享' : 'Document permission / team sharing', locale === 'zh' ? '订单支付 / 开票 / 退款' : 'Order payment / invoice / refund',
              locale === 'zh' ? '文件打包 / 下载 / 失效时间' : 'Bundle / download / file expiry', ].map(item => (
              <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                {item} </div>
            ))} </div>
        </section> </div>
      <DetailDrawer open={drawerOpen} title={drawerTitle} subtitle={drawerSubtitle} onClose={() => setDrawerOpen(false)}>
        {drawerNotes.map(item => ( <div key={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/55">
            {item} </div>
        ))} </DetailDrawer>
    </div> )
}
