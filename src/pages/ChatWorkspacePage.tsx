import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToastStore } from '@/store/toastStore'
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Database,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  Wand2,
  CheckCircle2,
} from 'lucide-react'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import {
  clearUseTemplatePayload,
  loadUseTemplatePayload,
} from '@/services/templateCenter'
import type { WorkflowEvent } from '@/mock/workflowBridge'
import { Button } from '@/components/ui/Button'

type Locale = 'zh' | 'en'

interface MessageItem {
  role: 'user' | 'assistant'
  zh: string
  en: string
}

interface WorkspaceConfig {
  titleKey: string
  icon: typeof MessageSquare
  badge: { zh: string; en: string }
  subtitle: { zh: string; en: string }
  suggestions: Array<{ zh: string; en: string }>
  assets: Array<{ zh: string; en: string; meta: string }>
  messages: MessageItem[]
  quickActions: Array<{ zh: string; en: string; to: string }>
}

type TemplateExecutionCard = {
  name: string
  executorType: string
  modality: string
  defaultVariables: Array<[string, string]>
}

const CHAT_CONFIG: Record<string, WorkspaceConfig> = {
  '/chat': {
    titleKey: 'pages.chat',
    icon: MessageSquare,
    badge: { zh: 'AI 智能运营工作台', en: 'AI Operations Workbench' },
    subtitle: {
      zh: '这里承接 Prompt 输入、上下文挂载、结果产出与下一步动作，是运营智能线的主操作台。',
      en: 'This is the main operations workbench for prompt input, context mounting, result generation, and next-step actions.',
    },
    suggestions: [
      { zh: '基于产品卖点生成亚马逊标题与五点', en: 'Generate Amazon title and bullets from product selling points' },
      { zh: '把评论洞察整理成详情页卖点结构', en: 'Turn review insights into structured PDP selling points' },
      { zh: '输出 TikTok 达人邀约消息模板', en: 'Create a TikTok creator outreach template' },
    ],
    assets: [
      { zh: '品牌语气规则', en: 'Brand Tone Rules', meta: 'BrandLibrary' },
      { zh: '评论洞察报告', en: 'Review Insight Report', meta: 'Analysis' },
      { zh: '商品基础资料', en: 'Product Base Assets', meta: 'SKU-1283' },
    ],
    messages: [
      {
        role: 'user',
        zh: '帮我根据这款收纳盒的卖点，输出适合美国站的标题和五点。',
        en: 'Generate a US-market title and bullet points for this storage box based on its key selling points.',
      },
      {
        role: 'assistant',
        zh: '已结合品牌语气和历史高转化结构，给出 3 组标题方案与一版五点卖点草稿。',
        en: 'I combined brand tone and high-conversion patterns to draft 3 title options and one bullet-point version.',
      },
      {
        role: 'user',
        zh: '再强调小户型、可叠放和厨房收纳场景。',
        en: 'Emphasize small-space living, stackability, and kitchen organization use cases.',
      },
    ],
    quickActions: [
      { zh: '查看模板市场', en: 'Open Template Market', to: '/aiChat/template' },
      { zh: '历史会话', en: 'Chat History', to: '/aiChat/history' },
    ],
  },
  '/chat/doc': {
    titleKey: 'pages.chatDoc',
    icon: BookOpen,
    badge: { zh: '知识库问答工作台', en: 'Knowledge Chat Workbench' },
    subtitle: {
      zh: '把知识库、政策文档、品牌规则和 SOP 资料接成问答工作流，用于高可信输出。',
      en: 'Connect knowledge base, policies, brand rules, and SOPs into a grounded Q&A workflow for trustworthy outputs.',
    },
    suggestions: [
      { zh: '总结知识库里的“标题规范”章节', en: 'Summarize the “title guideline” section from the knowledge base' },
      { zh: '根据品牌手册回答“禁用词有哪些”', en: 'Answer “which terms are forbidden” from the brand handbook' },
      { zh: '生成平台合规 FAQ 摘要', en: 'Create a platform compliance FAQ summary' },
    ],
    assets: [
      { zh: '平台合规文档', en: 'Platform Compliance Docs', meta: 'Docs' },
      { zh: '品牌规则手册', en: 'Brand Rule Handbook', meta: 'Brand' },
      { zh: '客服 FAQ', en: 'Support FAQ', meta: 'FAQ' },
    ],
    messages: [
      {
        role: 'user',
        zh: '品牌手册里对“夸张表述”的限制是什么？',
        en: 'What does the brand handbook say about exaggerated claims?',
      },
      {
        role: 'assistant',
        zh: '根据品牌规则第 2.3 节，不建议使用“最强”“绝对”等绝对化表达，推荐改成场景化描述。',
        en: 'According to section 2.3 of the brand handbook, avoid absolute claims like “best” or “ultimate”, and prefer scenario-based wording.',
      },
      {
        role: 'user',
        zh: '帮我列出 3 条可替代表达。',
        en: 'List 3 safer alternative phrasings for me.',
      },
    ],
    quickActions: [
      { zh: '进入知识库', en: 'Open Knowledge Base', to: '/database/knowledge' },
      { zh: '回到 AI 对话', en: 'Back to AI Chat', to: '/chat' },
    ],
  },
}

function copy(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

export default function ChatWorkspacePage() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { showToast } = useToastStore()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const config = CHAT_CONFIG[pathname] ?? CHAT_CONFIG['/chat']
  const [inputValue, setInputValue] = useState(
    copy(
      locale,
      '帮我为这款产品生成高转化标题和五点卖点',
      'Generate a high-conversion title and bullet points for this product',
    ),
  )
  const [selectedAssets, setSelectedAssets] = useState<string[]>([config.assets[0]?.meta ?? ''])
  const [messages, setMessages] = useState<MessageItem[]>(config.messages)
  const [activeAction, setActiveAction] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([])
  const [activeTemplateCard, setActiveTemplateCard] = useState<TemplateExecutionCard | null>(null)

  const promptChips = useMemo(
    () => config.suggestions.map(item => copy(locale, item.zh, item.en)),
    [config.suggestions, locale],
  )

  const Icon = config.icon

  useEffect(() => {
    void productWorkspaceRepository.listWorkflowEvents().then(events => {
      setWorkflowEvents(events.slice(0, 4))
    })
  }, [])

  useEffect(() => {
    const payload = loadUseTemplatePayload()
    if (!payload || payload.targetRoute !== pathname) return

    const templateName =
      typeof payload.preloadedTemplatePayload?.templateName === 'string'
        ? payload.preloadedTemplatePayload.templateName
        : ''
    const defaultVariablesRaw = payload.preloadedTemplatePayload?.defaultVariables
    const defaultVariables =
      defaultVariablesRaw && typeof defaultVariablesRaw === 'object'
        ? Object.entries(defaultVariablesRaw as Record<string, unknown>).map(
            ([key, value]) => [key, String(value)] as [string, string],
          )
        : []
    const promptLayers = payload.preloadedTemplatePayload?.promptLayers
    const l3Default =
      promptLayers &&
      typeof promptLayers === 'object' &&
      typeof (promptLayers as Record<string, unknown>).l3 === 'object' &&
      typeof ((promptLayers as Record<string, unknown>).l3 as Record<string, unknown>).defaultContent === 'string'
        ? (((promptLayers as Record<string, unknown>).l3 as Record<string, unknown>).defaultContent as string)
        : ''
    if (templateName) {
      setInputValue(
        l3Default ||
          copy(
            locale,
            `已加载模板: ${templateName}`,
            `Loaded template: ${templateName}`,
          ),
      )
      setActiveTemplateCard({
        name: templateName,
        executorType:
          typeof payload.preloadedTemplatePayload?.executorType === 'string'
            ? payload.preloadedTemplatePayload.executorType
            : payload.executorType,
        modality:
          typeof payload.preloadedTemplatePayload?.modality === 'string'
            ? payload.preloadedTemplatePayload.modality
            : 'text',
        defaultVariables,
      })
    }
    clearUseTemplatePayload()
  }, [locale, pathname])

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt)
  }

  const toggleAsset = (meta: string) => {
    setSelectedAssets(prev =>
      prev.includes(meta) ? prev.filter(item => item !== meta) : [...prev, meta],
    )
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    setIsSending(true)

    const userMessage: MessageItem = {
      role: 'user',
      zh: inputValue,
      en: inputValue,
    }

    const assistantMessage: MessageItem = {
      role: 'assistant',
      zh:
        pathname === '/chat'
          ? '已根据当前挂载资料生成一版可执行草稿，你可以继续细化、保存为模板或发送到模板中心。'
          : '已结合知识库资料生成引用式回答骨架，下一步可以继续追问或沉淀到知识资产。',
      en:
        pathname === '/chat'
          ? 'I generated an actionable draft from the currently mounted context. You can refine it, save it as a template, or send it to template center.'
          : 'I generated a grounded answer draft from the mounted knowledge assets. You can continue asking or save it into the knowledge layer.',
    }

    window.setTimeout(() => {
      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInputValue(
        copy(
          locale,
          '请继续细化输出结构',
          'Please continue refining the output structure',
        ),
      )
      setIsSending(false)
    }, 600)
  }

  const actionDescriptions = [
    {
      zh: '将当前结果保存为可复用 Prompt/Agent 模板，并进入模板资产链路。',
      en: 'Save the current output as a reusable prompt/Agent template and move it into the template asset flow.',
    },
    {
      zh: '把当前结果带入模板中心，继续做结构化生产。',
      en: 'Send the current result into the template center workbench for structured production.',
    },
    {
      zh: '将结果同步到知识库或品牌库，形成后续 AI 可消费的上下文资产。',
      en: 'Sync the result into the knowledge base or brand library as AI-consumable context assets.',
    },
  ]

  const refreshWorkflow = () => {
    void productWorkspaceRepository.listWorkflowEvents().then(events => {
      setWorkflowEvents(events.slice(0, 4))
    })
  }

  const handleSaveAction = () => {
    if (activeAction === 0) {
      const now = new Date().toISOString()
      void productWorkspaceRepository.saveSavedTemplate({
        id: `chat-template-${Date.now()}`,
        platform: 'amazon',
        tags: ['chat', 'ops', pathname === '/chat/doc' ? 'knowledge' : 'listing'],
        usageCount: '1.2k',
        favorite: 4.8,
        savedAt: now,
        sourceType: 'chat',
        sourceLabel: copy(locale, '来自 AI 对话工作台保存', 'Saved from AI chat workbench'),
        zh: {
          title: '对话结果模板',
          summary: '由当前对话结果沉淀出的可复用模板，可继续在模板库或模板中心 中使用。',
          scenario: '适合把会话结果转成可复用运营模板',
        },
        en: {
          title: 'Conversation Result Template',
          summary: 'A reusable template derived from the current conversation result, ready for template-library and batch-listing reuse.',
          scenario: 'Suitable for turning conversation outputs into reusable operations templates',
        },
      })
      void productWorkspaceRepository.saveWorkflowEvent({
        id: `chat-save-${Date.now()}`,
        module: 'chat',
        title: {
          zh: '对话结果已保存为模板',
          en: 'Conversation result saved as template',
        },
        detail: {
          zh: '可在我的模板库继续查看和执行',
          en: 'Ready to be viewed and executed in My Templates',
        },
        createdAt: now,
      })
      showToast(copy(locale, '已保存到我的模板库', 'Saved to My Templates'), 'success')
    } else if (activeAction === 1) {
      void productWorkspaceRepository.saveWorkflowEvent({
        id: `chat-batch-${Date.now()}`,
        module: 'chat',
        title: {
          zh: '对话结果已发送到模板中心',
          en: 'Conversation result sent to template center',
        },
        detail: {
          zh: '后续可在批量内容工作台继续结构化生产',
          en: 'Continue structured production in the template center workbench',
        },
        createdAt: new Date().toISOString(),
      })
      showToast(copy(locale, '已写入模板中心 回流记录', 'Sent to batch-listing workflow'), 'success')
    } else {
      void productWorkspaceRepository.saveWorkflowEvent({
        id: `chat-asset-${Date.now()}`,
        module: 'asset',
        title: {
          zh: '对话结果已同步到资料层',
          en: 'Conversation result synced to asset layer',
        },
        detail: {
          zh: '可在知识库或品牌库页查看对应回流记录',
          en: 'The workflow feed is now visible from the knowledge or brand library pages',
        },
        createdAt: new Date().toISOString(),
      })
      showToast(copy(locale, '已同步到资料层回流记录', 'Synced to library workflow feed'), 'success')
    }

    setSaveStatus('saved')
    refreshWorkflow()
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{copy(locale, config.badge.zh, config.badge.en)}</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">{t(config.titleKey)}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                    {copy(locale, config.subtitle.zh, config.subtitle.en)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {config.quickActions.map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white"
                >
                  <span>{copy(locale, action.zh, action.en)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {copy(locale, '挂载资料', 'Mounted Context')}
              </div>
              {activeTemplateCard && (
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="text-sm font-medium text-emerald-300">
                    {copy(locale, '当前执行模板', 'Active Template')}
                  </div>
                  <div className="mt-2 text-sm text-white/80">{activeTemplateCard.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] text-white/60">
                      {activeTemplateCard.executorType}
                    </span>
                    <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] text-white/60">
                      {activeTemplateCard.modality}
                    </span>
                  </div>
                  {activeTemplateCard.defaultVariables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeTemplateCard.defaultVariables.slice(0, 4).map(([key, value]) => (
                        <span key={key} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {config.assets.map(item => (
                  <Button
                    key={item.meta}
                    onClick={() => toggleAsset(item.meta)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      selectedAssets.includes(item.meta)
                        ? 'border-brand-500/25 bg-brand-500/10'
                        : 'border-white/[0.06] bg-white/[0.03] hover:bg-[var(--ecom-surface-hover)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/80">{copy(locale, item.zh, item.en)}</div>
                        <div className="mt-1 text-xs text-white/35">{item.meta}</div>
                      </div>
                      {selectedAssets.includes(item.meta) && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-400" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              <Button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-500/30 bg-brand-500/8 px-4 py-3 text-sm text-brand-300">
                <Paperclip className="h-4 w-4" />
                {copy(locale, '继续挂载资料', 'Attach More Context')}
              </Button>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <Wand2 className="h-4 w-4 text-brand-400" />
                <span>{copy(locale, '推荐提问', 'Suggested Prompts')}</span>
              </div>
              <div className="space-y-2">
                {promptChips.map(item => (
                  <Button
                    key={item}
                    onClick={() => handlePromptSelect(item)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white/55 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white"
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <div className="glass-strong rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium text-white/75">
                {copy(locale, '对话面板', 'Conversation Panel')}
              </div>
              <div className="text-xs text-white/35">
                {copy(locale, '第一阶段为可演示 mock', 'Phase-one demonstrable mock')}
              </div>
            </div>

            <div className="space-y-4">
              {isSending && (
                <div className="flex justify-start">
                  <div className="glass max-w-[88%] rounded-2xl px-4 py-3 text-sm text-white/60">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-brand-400" />
                      {copy(locale, 'AI 正在生成结果...', 'AI is generating the result...')}
                    </span>
                  </div>
                </div>
              )}
              {messages.map((item, index) => {
                const isUser = item.role === 'user'
                return (
                  <div key={`${item.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? 'border border-brand-500/25 bg-brand-500/14 text-white/85'
                          : 'glass text-white/72'
                      }`}
                    >
                      {copy(locale, item.zh, item.en)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="mb-3 text-xs text-white/35">
                {copy(locale, '可继续细化、保存或同步到后续任务', 'Refine, save, or sync into downstream work')}
              </div>
              <div className="flex gap-3">
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  className="glass min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
                />
                <Button
                  onClick={handleSend}
                  disabled={isSending}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? copy(locale, '发送中...', 'Sending...') : copy(locale, '发送', 'Send')}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {copy(locale, '结果动作', 'Result Actions')}
              </div>
              <div className="space-y-3">
                {[
                  {
                    zh: '保存为 Agent 模板',
                    en: 'Save as Agent Template',
                  },
                  {
                    zh: '发送到模板中心',
                    en: 'Send to Template Center',
                  },
                  {
                    zh: '同步进知识库 / 品牌库',
                    en: 'Sync to Knowledge / Brand Library',
                  },
                ].map((item, index) => (
                  <Button
                    key={item.zh}
                    onClick={() => setActiveAction(index)}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                      activeAction === index
                        ? 'border-brand-500/25 bg-brand-500/10 text-brand-300'
                        : 'border-white/[0.06] bg-white/[0.03] text-white/55 hover:bg-[var(--ecom-surface-hover)]'
                    }`}
                  >
                    {copy(locale, item.zh, item.en)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {copy(locale, '当前动作说明', 'Current Action Detail')}
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-6 text-white/50">
                {copy(locale, actionDescriptions[activeAction].zh, actionDescriptions[activeAction].en)}
              </div>
              <Button
                onClick={handleSaveAction}
                className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white"
              >
                {saveStatus === 'saved'
                  ? copy(locale, '已保存当前动作', 'Current Action Saved')
                  : copy(locale, '保存当前动作配置', 'Save Current Action')}
              </Button>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <Database className="h-4 w-4 text-brand-400" />
                <span>{copy(locale, '统一状态回流', 'Unified Workflow Feed')}</span>
              </div>
              <div className="space-y-2 text-sm text-white/45">
                {workflowEvents.length ? (
                  workflowEvents.map(item => (
                    <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                      <div className="text-white/70">{copy(locale, item.title.zh, item.title.en)}</div>
                      <div className="mt-1 text-xs text-white/45">{copy(locale, item.detail.zh, item.detail.en)}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-4">
                    {copy(locale, '当前还没有回流记录。', 'No workflow records yet.')}
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <Database className="h-4 w-4 text-brand-400" />
                <span>{copy(locale, '可衔接的后续动作', 'Next actions')}</span>
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{copy(locale, '会话历史拉取', 'Conversation history fetch')}</div>
                <div>{copy(locale, 'Prompt 模板保存', 'Prompt template save')}</div>
                <div>{copy(locale, '知识库引用来源', 'Knowledge-base citations')}</div>
                <div>{copy(locale, '结果回写工作流', 'Result write-back workflow')}</div>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                {copy(
                  locale,
                  '当前动作已进入假保存状态，下一步适合补模板保存、任务排队和回写接口。',
                  'The current action is now in a mock saved state, ready for template saving, task queueing, and write-back integration later.',
                )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  )
}

