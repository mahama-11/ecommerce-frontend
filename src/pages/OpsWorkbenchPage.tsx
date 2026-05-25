import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  History,
  LayoutGrid,
  ListOrdered,
  Search,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DetailDrawer from '@/components/DetailDrawer'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import { listTemplateInstances, type TemplateInstanceItem } from '@/services/templateCenter'
import type { LinkedTemplateBridge, WorkflowEvent } from '@/mock/workflowBridge'
import {
  OPS_STATUS_STYLES,
  advanceOpsStatus,
  getOpsRecords,
  pickOps,
  type OpsRecord,
} from '@/mock/opsWorkbench'
import { Button } from '@/components/ui/Button'

type Locale = 'zh' | 'en'

interface Localized {
  zh: string
  en: string
}

interface Config {
  titleKey: string
  icon: LucideIcon
  badge: Localized
  subtitle: Localized
  stats: Array<{ value: string; label: Localized }>
  columns: Array<{
    title: Localized
    items: Localized[]
  }>
  actions: Array<{ label: Localized; to: string }>
}

const CONFIG_MAP: Record<string, Config> = {
  '/aiChat/batchListing': {
    titleKey: 'pages.aiChatBatchListing',
    icon: ListOrdered,
    badge: { zh: '批量内容生产工作台', en: 'Batch Content Workbench' },
    subtitle: {
      zh: '围绕 SKU 表、模板、质检和导出结果组织批量 Listing 工作流。',
      en: 'Organize the bulk listing workflow around SKU sheets, templates, QA, and output delivery.',
    },
    stats: [
      { value: '126', label: { zh: '待处理 SKU', en: 'Queued SKUs' } },
      { value: '4', label: { zh: '模板版本', en: 'Template Versions' } },
      { value: '92%', label: { zh: '质检通过率', en: 'QA Pass Rate' } },
    ],
    columns: [
      {
        title: { zh: '输入批次', en: 'Input Batch' },
        items: [
          { zh: 'SKU 表 / 分类表导入', en: 'SKU sheet / category import' },
          { zh: '竞品链接与评论洞察挂载', en: 'Attach competitor links and review insights' },
          { zh: '品牌语气与敏感词规则引用', en: 'Apply brand tone and sensitive-term rules' },
        ],
      },
      {
        title: { zh: '输出与质检', en: 'Output and QA' },
        items: [
          { zh: '标题 / 五点 / 描述结果卡', en: 'Title / bullets / description result cards' },
          { zh: '长度、关键词覆盖率、语气一致性检查', en: 'Length, keyword coverage, and tone checks' },
          { zh: '一键导出 CSV / 回写商品中心', en: 'Export CSV or write back to product center' },
        ],
      },
    ],
    actions: [
      { label: { zh: '模板市场', en: 'Template Market' }, to: '/aiChat/template' },
      { label: { zh: '分析记录', en: 'Analysis Records' }, to: '/aiChat/analysisRecords' },
    ],
  },
  '/aiChat/history': {
    titleKey: 'pages.aiChatHistory',
    icon: History,
    badge: { zh: '历史会话资产层', en: 'Conversation Asset Layer' },
    subtitle: {
      zh: '沉淀 AI 历史会话、操作动作和结果复用链路，作为团队复盘资产。',
      en: 'Store AI sessions, operation steps, and reusable result chains as reviewable team assets.',
    },
    stats: [
      { value: '87', label: { zh: '本周会话', en: 'Weekly Sessions' } },
      { value: '13', label: { zh: '已收藏', en: 'Saved' } },
      { value: '5', label: { zh: '共享给团队', en: 'Shared to Team' } },
    ],
    columns: [
      {
        title: { zh: '时间线视图', en: 'Timeline View' },
        items: [
          { zh: '按项目 / 商品 / 任务维度归档', en: 'Archive by project / product / task' },
          { zh: '保留输入资料与最终输出版本', en: 'Preserve context assets and final outputs' },
          { zh: '支持复制为模板或继续追问', en: 'Clone into templates or continue asking' },
        ],
      },
      {
        title: { zh: '复用动作', en: 'Reuse Actions' },
        items: [
          { zh: '回写批量 Listing', en: 'Send to batch listing' },
          { zh: '保存到知识库 / 模板库', en: 'Save to KB / template library' },
          { zh: '共享到团队空间', en: 'Share to team space' },
        ],
      },
    ],
    actions: [
      { label: { zh: '返回 AI 对话', en: 'Back to AI Chat' }, to: '/chat' },
      { label: { zh: '我的模板库', en: 'My Template Library' }, to: '/aiChat/myTemplate' },
    ],
  },
  '/aiChat/myTemplate': {
    titleKey: 'pages.aiChatMyTemplate',
    icon: LayoutGrid,
    badge: { zh: '私有模板工作台', en: 'Private Template Workbench' },
    subtitle: {
      zh: '把个人 / 团队 Prompt、Agent 模板和工作流模板统一管理。',
      en: 'Manage personal/team prompts, Agent templates, and workflow templates in one place.',
    },
    stats: [
      { value: '19', label: { zh: '私有模板', en: 'Private Templates' } },
      { value: '8', label: { zh: '团队模板', en: 'Team Templates' } },
      { value: '3', label: { zh: '草稿版本', en: 'Draft Versions' } },
    ],
    columns: [
      {
        title: { zh: '模板状态', en: 'Template States' },
        items: [
          { zh: '草稿 / 已发布 / 团队共享', en: 'Draft / published / team-shared' },
          { zh: '版本号、标签、适用平台展示', en: 'Version, tags, and target platform display' },
          { zh: '复制、分叉、发布动作位', en: 'Clone, fork, and publish actions' },
        ],
      },
      {
        title: { zh: '模板联动', en: 'Template Integrations' },
        items: [
          { zh: '连接 AI 对话输入', en: 'Connected to AI chat inputs' },
          { zh: '连接批量 Listing 工作台', en: 'Connected to batch listing workflows' },
          { zh: '连接资料库上下文引用', en: 'Connected to library-based context injection' },
        ],
      },
    ],
    actions: [
      { label: { zh: '模板市场', en: 'Template Market' }, to: '/aiChat/template' },
      { label: { zh: '历史会话', en: 'Chat History' }, to: '/aiChat/history' },
    ],
  },
  '/aiChat/analysisRecords': {
    titleKey: 'pages.aiChatAnalysisRecords',
    icon: BarChart3,
    badge: { zh: '分析结果中心', en: 'Insight Result Center' },
    subtitle: {
      zh: '把评论分析、竞品调研、关键词洞察和市场判断沉淀为结构化结果。',
      en: 'Store review analysis, competitor research, keyword insight, and market judgment as structured results.',
    },
    stats: [
      { value: '31', label: { zh: '分析任务', en: 'Analysis Jobs' } },
      { value: '12', label: { zh: '关键结论', en: 'Key Insights' } },
      { value: '6', label: { zh: '待跟进动作', en: 'Pending Follow-ups' } },
    ],
    columns: [
      {
        title: { zh: '输出结构', en: 'Output Structure' },
        items: [
          { zh: '结论 / 证据 / 建议动作三段式', en: 'Findings / evidence / actions triplet' },
          { zh: '支持按平台和品类筛选', en: 'Filterable by platform and category' },
          { zh: '可回写模板和 Listing 任务', en: 'Sendable to templates and listing jobs' },
        ],
      },
      {
        title: { zh: '沉淀价值', en: 'Asset Value' },
        items: [
          { zh: '形成可复用洞察资产', en: 'Reusable insight assets' },
          { zh: '为选品训练与运营决策服务', en: 'Support training and operations decisions' },
          { zh: '适合做团队知识沉淀', en: 'Ideal for team knowledge capture' },
        ],
      },
    ],
    actions: [
      { label: { zh: '批量 Listing', en: 'Batch Listing' }, to: '/aiChat/batchListing' },
      { label: { zh: 'AI 训练', en: 'AI Training' }, to: '/aiChat/training' },
    ],
  },
  '/aiChat/training': {
    titleKey: 'pages.aiChatTraining',
    icon: Brain,
    badge: { zh: 'AI 训练与策略校准', en: 'AI Training and Strategy Tuning' },
    subtitle: {
      zh: '把选品、策略、偏好和效果反馈组织成可迭代的训练面板。',
      en: 'Turn selection logic, strategies, preferences, and feedback into an iterative training panel.',
    },
    stats: [
      { value: '5', label: { zh: '训练任务', en: 'Training Runs' } },
      { value: '3', label: { zh: '策略版本', en: 'Strategy Versions' } },
      { value: '92%', label: { zh: '采纳率', en: 'Adoption Rate' } },
    ],
    columns: [
      {
        title: { zh: '训练输入', en: 'Training Inputs' },
        items: [
          { zh: '品类偏好与预算约束', en: 'Category preferences and budget constraints' },
          { zh: '平台竞争度与供应链条件', en: 'Platform competition and supply chain context' },
          { zh: '历史效果反馈与人工校正', en: 'Performance feedback and manual corrections' },
        ],
      },
      {
        title: { zh: '训练输出', en: 'Training Outputs' },
        items: [
          { zh: '策略版本对比', en: 'Strategy version comparison' },
          { zh: '推荐理由与置信度', en: 'Recommendation reason and confidence' },
          { zh: '可回写分析记录和模板', en: 'Can feed analysis records and templates' },
        ],
      },
    ],
    actions: [
      { label: { zh: '分析记录', en: 'Analysis Records' }, to: '/aiChat/analysisRecords' },
      { label: { zh: '模板市场', en: 'Template Market' }, to: '/aiChat/template' },
    ],
  },
}

function pick(locale: Locale, value: Localized) {
  return locale === 'zh' ? value.zh : value.en
}

export default function OpsWorkbenchPage() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const config = CONFIG_MAP[pathname] ?? CONFIG_MAP['/aiChat/batchListing']
  const Icon = config.icon
  const [savedTemplates, setSavedTemplates] = useState<TemplateInstanceItem[]>([])
  const [templateBridges, setTemplateBridges] = useState<LinkedTemplateBridge[]>([])
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([])
  const [opsRecords, setOpsRecords] = useState<OpsRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedOpsId, setSelectedOpsId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setSearchQuery('')
    void productWorkspaceRepository.listWorkflowEvents().then(events => {
      setWorkflowEvents(events.slice(0, 4))
    })

    if (pathname === '/aiChat/myTemplate') {
      void listTemplateInstances(locale).then(parsed => {
        setSavedTemplates(parsed)
        setSelectedTemplateId(parsed[0]?.id ?? null)
      })
      void productWorkspaceRepository.listTemplateBridges().then(setTemplateBridges)
      return
    }

    const nextRecords = getOpsRecords(pathname)
    setOpsRecords(nextRecords)
    setSelectedOpsId(nextRecords[0]?.id ?? null)
  }, [pathname])

  const filteredSavedTemplates = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return savedTemplates

    return savedTemplates.filter(item => {
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.summary.toLowerCase().includes(normalized) ||
        item.platformTags.some(tag => tag.toLowerCase().includes(normalized)) ||
        item.industryTags.some(tag => tag.toLowerCase().includes(normalized))
      )
    })
  }, [savedTemplates, searchQuery])

  const selectedTemplate =
    filteredSavedTemplates.find(item => item.id === selectedTemplateId) ??
    filteredSavedTemplates[0] ??
    null

  const filteredOpsRecords = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return opsRecords

    return opsRecords.filter(item => {
      return (
        pickOps(locale, item.title).toLowerCase().includes(normalized) ||
        pickOps(locale, item.desc).toLowerCase().includes(normalized) ||
        item.owner.toLowerCase().includes(normalized) ||
        pickOps(locale, item.meta).toLowerCase().includes(normalized)
      )
    })
  }, [locale, opsRecords, searchQuery])

  const selectedOpsRecord =
    filteredOpsRecords.find(item => item.id === selectedOpsId) ??
    opsRecords.find(item => item.id === selectedOpsId) ??
    filteredOpsRecords[0] ??
    null

  const handleOpsAction = (record: OpsRecord) => {
    const nextStatus = advanceOpsStatus(record.status)
    setOpsRecords(prev =>
      prev.map(item => (item.id === record.id ? { ...item, status: nextStatus } : item)),
    )
    void productWorkspaceRepository.saveWorkflowEvent({
      id: `ops-${record.id}-${Date.now()}`,
      module: 'template',
      title: {
        zh: `${record.title.zh} 已推进`,
        en: `${record.title.en} advanced`,
      },
      detail: {
        zh: `当前状态已更新为 ${OPS_STATUS_STYLES[nextStatus].zh}`,
        en: `Current state updated to ${OPS_STATUS_STYLES[nextStatus].en}`,
      },
      createdAt: new Date().toISOString(),
    }).then(events => {
      setWorkflowEvents(events.slice(0, 4))
    })
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{pick(locale, config.badge)}</span>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text sm:text-3xl">{t(config.titleKey)}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick(locale, config.subtitle)}</p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
              {config.actions.map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white sm:w-auto"
                >
                  <span>{pick(locale, action.label)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.stats.map(stat => (
            <div key={stat.value + stat.label.zh} className="glass rounded-2xl p-5">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/45">{pick(locale, stat.label)}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {config.columns.map(column => (
            <div key={column.title.zh} className="glass rounded-2xl p-5">
              <div className="mb-4 text-lg font-semibold text-white">{pick(locale, column.title)}</div>
              <div className="space-y-3">
                {column.items.map(item => (
                  <div key={item.zh} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                    {pick(locale, item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {pathname !== '/aiChat/myTemplate' && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="glass rounded-2xl p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'zh' ? '搜索任务、记录或结论...' : 'Search tasks, sessions, or insights...'}
                    className="glass w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredOpsRecords.length ? (
                  filteredOpsRecords.map(item => {
                    const status = OPS_STATUS_STYLES[item.status]
                    return (
                      <article
                        key={item.id}
                        className={`tool-card glass rounded-2xl p-5 transition-colors ${
                          selectedOpsRecord?.id === item.id ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-white">{pickOps(locale, item.title)}</h3>
                            <div className="mt-1 text-xs text-white/35">
                              {item.id} · {item.owner} · {pickOps(locale, item.meta)}
                            </div>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs ${status.className}`}>
                            {locale === 'zh' ? status.zh : status.en}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/55">{pickOps(locale, item.desc)}</p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => setSelectedOpsId(item.id)}
                            className="inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                          >
                            {locale === 'zh' ? '查看详情' : 'View Details'}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpsAction(item)}
                            disabled={item.status === 'done'}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pickOps(locale, item.action)}
                          </Button>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="glass rounded-2xl p-10 text-center text-sm text-white/40">
                    {locale === 'zh' ? '当前筛选条件下没有匹配记录。' : 'No records match the current filters.'}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="mb-3 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '当前选中详情' : 'Selected Detail'}
                </div>
                {selectedOpsRecord ? (
                  <>
                    <div className="text-lg font-semibold text-white">{pickOps(locale, selectedOpsRecord.title)}</div>
                    <div className="mt-3 text-sm leading-6 text-white/55">{pickOps(locale, selectedOpsRecord.desc)}</div>
                    <div className="mt-3 text-xs text-white/35">
                      {selectedOpsRecord.owner} · {pickOps(locale, selectedOpsRecord.meta)}
                    </div>
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                      {locale === 'zh'
                        ? '这条记录已经纳入统一工作流，可继续推进状态并在相关页面查看回流。'
                        : 'This record is now part of the unified workflow and can be advanced with visible write-backs across related pages.'}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-white/40">
                    {locale === 'zh' ? '暂无可展示详情。' : 'No detail available.'}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="mb-3 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '统一状态回流' : 'Unified Workflow Feed'}
                </div>
                <div className="space-y-3">
                  {workflowEvents.length ? (
                    workflowEvents.map(item => (
                      <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                        <div className="text-sm text-white/75">{locale === 'zh' ? item.title.zh : item.title.en}</div>
                        <div className="mt-1 text-xs text-white/45">{locale === 'zh' ? item.detail.zh : item.detail.en}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm text-white/40">
                      {locale === 'zh' ? '当前还没有回流记录。' : 'No workflow records yet.'}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </section>
        )}

        {pathname === '/aiChat/myTemplate' && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="glass rounded-2xl p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'zh' ? '搜索我的模板库...' : 'Search my template library...'}
                    className="glass w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white/80 placeholder-white/25 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {savedTemplates.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                    <LayoutGrid className="h-5 w-5 text-white/35" />
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {locale === 'zh' ? '我的模板库还没有内容' : 'Your template library is empty'}
                  </div>
                  <div className="mt-2 text-sm text-white/45">
                    {locale === 'zh'
                      ? '先去模板市场复制几个模板回来，这里会自动展示。'
                      : 'Copy a few templates from the marketplace and they will appear here automatically.'}
                  </div>
                  <Link
                    to="/aiChat/template"
                    className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white"
                  >
                    {locale === 'zh' ? '前往模板市场' : 'Go to Template Market'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : filteredSavedTemplates.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="text-lg font-semibold text-white">
                    {locale === 'zh' ? '没有匹配的模板' : 'No matching templates'}
                  </div>
                  <div className="mt-2 text-sm text-white/45">
                    {locale === 'zh'
                      ? '换个关键词试试，或者去视觉工作台继续桥接新的模板。'
                      : 'Try a different keyword, or bridge new templates from the design workbench.'}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredSavedTemplates.map(item => {
                    const isSelected = selectedTemplate?.id === item.id

                    return (
                      <article
                        key={item.id}
                        className={`tool-card glass rounded-2xl p-5 transition-colors ${
                          isSelected ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-white/35">{(item.platformTags[0] ?? item.series).toUpperCase()}</div>
                            <h3 className="mt-1 text-base font-semibold text-white">{item.title}</h3>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p className="line-clamp-3 text-sm leading-6 text-white/55">{item.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {[...item.platformTags, ...item.industryTags].slice(0, 6).map(tag => (
                            <span key={tag} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-white/35">
                          <span>
                            {item.sourceType === 'design'
                              ? locale === 'zh'
                                ? '来自设计模板桥接'
                                : 'Bridged from design'
                              : item.sourceType === 'preset_catalog'
                                ? locale === 'zh'
                                  ? '来自官方模板复制'
                                  : 'Copied from official catalog'
                                : item.sourceType === 'chat'
                                ? locale === 'zh'
                                  ? '来自对话保存'
                                  : 'Saved from chat'
                                : locale === 'zh'
                                  ? '已保存到模板库'
                                  : 'Saved to library'}
                          </span>
                          <span>{new Date(item.savedAt).toLocaleDateString()}</span>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedTemplateId(item.id)
                            setDrawerOpen(true)
                          }}
                          className="mt-4 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                        >
                          {locale === 'zh' ? '打开详情抽屉' : 'Open Detail Drawer'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <aside className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '模板库说明' : 'Library Notes'}
              </div>
              <div className="space-y-3 text-sm text-white/45">
                <div>{locale === 'zh' ? '这里已接通模板市场复制链路。' : 'Marketplace copy flow is now connected here.'}</div>
                <div>{locale === 'zh' ? '主列表已切到后端 template_instance 真接口。' : 'The main list now reads from the backend template_instance API.'}</div>
                <div>{locale === 'zh' ? '右侧桥接与状态流仍保留为辅助工作台能力。' : 'The side bridge/status panels are still kept as supporting workbench capability.'}</div>
              </div>
            </aside>

            <aside className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="mb-3 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '设计模板桥接关系' : 'Design-to-Agent Bridges'}
                </div>
                <div className="space-y-3">
                  {templateBridges.length ? (
                    templateBridges.map(item => (
                      <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                        <div className="text-sm font-medium text-white">
                          {locale === 'zh' ? item.designTitle.zh : item.designTitle.en}
                        </div>
                        <div className="mt-1 text-xs text-white/35">
                          {locale === 'zh' ? '映射到' : 'Mapped to'} {locale === 'zh' ? item.aiTemplateTitle.zh : item.aiTemplateTitle.en}
                        </div>
                        <div className="mt-2 text-xs text-white/45">{locale === 'zh' ? item.scenario.zh : item.scenario.en}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm text-white/40">
                      {locale === 'zh' ? '先去视觉工作台桥接一个模板。' : 'Bridge a template from the design workbench first.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="mb-3 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '统一状态回流' : 'Unified Workflow Feed'}
                </div>
                <div className="space-y-3">
                  {workflowEvents.length ? (
                    workflowEvents.map(item => (
                      <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                        <div className="text-sm text-white/75">{locale === 'zh' ? item.title.zh : item.title.en}</div>
                        <div className="mt-1 text-xs text-white/45">{locale === 'zh' ? item.detail.zh : item.detail.en}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm text-white/40">
                      {locale === 'zh' ? '当前还没有回流记录。' : 'No workflow records yet.'}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </section>
        )}
      </div>

      {pathname === '/aiChat/myTemplate' && drawerOpen && selectedTemplate && (
        <DetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          subtitle={(selectedTemplate.platformTags[0] ?? selectedTemplate.series).toUpperCase()}
          title={selectedTemplate.title}
        >
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                {selectedTemplate.summary}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white/75">
                  {locale === 'zh' ? '适用场景' : 'Best-fit Scenario'}
                </div>
                <div className="text-sm leading-6 text-white/50">
                  {selectedTemplate.scenario || selectedTemplate.summary}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...selectedTemplate.platformTags, ...selectedTemplate.industryTags].map(tag => (
                  <span key={tag} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-300">
                    {tag}
                  </span>
                ))}
              </div>
              {selectedTemplate.sourceLabel ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/50">
                  {selectedTemplate.sourceLabel}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="text-white/35">{locale === 'zh' ? '执行器' : 'Executor'}</div>
                  <div className="mt-1 font-semibold text-white">{selectedTemplate.executorType}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="text-white/35">{locale === 'zh' ? '模态' : 'Modality'}</div>
                  <div className="mt-1 font-semibold text-white">{selectedTemplate.modality}</div>
                </div>
              </div>
              <Link
                to="/chat"
                className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-white"
              >
                {locale === 'zh' ? '在 AI 对话中执行' : 'Run in AI Chat'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
        </DetailDrawer>
      )}
    </div>
  )
}
