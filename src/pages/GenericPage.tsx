import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Brain,
  Clock,
  Construction,
  Database,
  Download,
  Eye,
  FileText,
  History,
  ImageIcon,
  Layers,
  LayoutGrid,
  ListOrdered,
  MessageSquare,
  Package,
  Palette,
  ShieldAlert,
  Tag,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

interface PageCard {
  title: LocalizedText
  desc: LocalizedText
  meta: LocalizedText
}

interface PageAction {
  label: LocalizedText
  to: string
}

interface PageMeta {
  i18nKey: string
  icon: LucideIcon
  section: 'ops' | 'data' | 'design' | 'business' | 'portal'
  decoration: () => React.ReactNode
  subtitle: LocalizedText
  stats: Array<{ value: string; label: LocalizedText }>
  cards: PageCard[]
  actions: PageAction[]
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

function DocDecoration() {
  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-3 flex flex-col items-center gap-2">
          <FileText size={20} className="text-brand-400/50" />
          <div className="w-full h-1.5 rounded-full bg-white/[0.06]" />
          <div className="w-3/4 h-1.5 rounded-full bg-white/[0.04]" />
        </div>
      ))}
    </div>
  )
}

function TemplateDecoration() {
  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 border border-white/[0.06] flex items-center justify-center"
        >
          <LayoutGrid size={18} className="text-white/15" />
        </div>
      ))}
    </div>
  )
}

function ImageDecoration() {
  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center"
        >
          <ImageIcon size={18} className="text-white/15" />
        </div>
      ))}
    </div>
  )
}

function ListDecoration() {
  return (
    <div className="space-y-3 w-full max-w-sm">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Package size={14} className="text-brand-400/50" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 rounded-full bg-white/[0.08] w-3/4" />
            <div className="h-1.5 rounded-full bg-white/[0.04] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatDecoration() {
  return (
    <div className="space-y-3 w-full max-w-sm">
      {[true, false, true].map((isUser, i) => (
        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-xl px-4 py-2.5 max-w-[70%] ${isUser ? 'bg-brand-500/15 border border-brand-500/20' : 'glass'}`}>
            <div className="h-2 rounded-full bg-white/10 w-24 mb-1.5" />
            <div className="h-2 rounded-full bg-white/[0.06] w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DesignDecoration() {
  return (
    <div className="w-full max-w-sm glass rounded-xl p-4">
      <div className="flex gap-2 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-6 rounded bg-white/[0.06]" />
        ))}
      </div>
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 border border-white/[0.06] flex items-center justify-center">
        <Palette size={32} className="text-white/15" />
      </div>
    </div>
  )
}

function DefaultDecoration() {
  return (
    <div className="glass rounded-xl p-6 w-full max-w-sm flex flex-col items-center gap-3">
      <Construction size={32} className="text-white/20" />
      <div className="space-y-2 w-full">
        <div className="h-2 rounded-full bg-white/[0.08] w-full" />
        <div className="h-2 rounded-full bg-white/[0.06] w-3/4" />
        <div className="h-2 rounded-full bg-white/[0.04] w-1/2" />
      </div>
    </div>
  )
}

const PAGE_MAP: Record<string, PageMeta> = {
  '/chat': {
    i18nKey: 'pages.chat',
    icon: MessageSquare,
    section: 'ops',
    decoration: ChatDecoration,
    subtitle: {
      zh: '对话区、提示词收藏、上下文注入和结果回写会在这里形成完整操作台。',
      en: 'The chat workspace will host prompt favorites, context injection, and action-ready result panels.',
    },
    stats: [
      { value: '24', label: { zh: '最近会话', en: 'Recent Sessions' } },
      { value: '7', label: { zh: '已收藏 Prompt', en: 'Saved Prompts' } },
      { value: '3', label: { zh: '待执行任务', en: 'Pending Actions' } },
    ],
    cards: [
      {
        title: { zh: '对话上下文面板', en: 'Conversation Context Panel' },
        desc: { zh: '挂载产品资料、品牌规则、历史问答和任务目标。', en: 'Attach product assets, brand rules, prior messages, and task goals.' },
        meta: { zh: '适合内容生成 / 运营协助', en: 'For content generation and operator assist' },
      },
      {
        title: { zh: '结果回写能力', en: 'Result Write-back' },
        desc: { zh: '后续可回写到 Listing、设计器、知识库或下载中心。', en: 'Later writes output back to listings, designer, knowledge base, or download center.' },
        meta: { zh: '工作流衔接', en: 'Workflow ready' },
      },
    ],
    actions: [
      { label: { zh: '打开模板市场', en: 'Open Template Market' }, to: '/aiChat/template' },
      { label: { zh: '查看历史会话', en: 'View Chat History' }, to: '/aiChat/history' },
    ],
  },
  '/chat/doc': {
    i18nKey: 'pages.chatDoc',
    icon: BookOpen,
    section: 'ops',
    decoration: ChatDecoration,
    subtitle: {
      zh: '围绕知识库文档、政策说明和品牌规则进行问答与摘要生成。',
      en: 'Ask and summarize against documentation, policy references, and brand rule assets.',
    },
    stats: [
      { value: '42', label: { zh: '已挂载文档', en: 'Mounted Docs' } },
      { value: '6', label: { zh: '知识标签', en: 'Knowledge Tags' } },
      { value: '91%', label: { zh: '命中率', en: 'Hit Rate' } },
    ],
    cards: [
      {
        title: { zh: '资料挂载区', en: 'Document Mount Zone' },
        desc: { zh: '支持品牌手册、FAQ、政策说明、素材命名规则。', en: 'Support brand handbooks, FAQ, policy docs, and asset naming conventions.' },
        meta: { zh: '后续可接向量检索', en: 'Vector search ready later' },
      },
      {
        title: { zh: '引用式回答', en: 'Citation-style Answers' },
        desc: { zh: '输出答案时带来源片段与命中位置，便于审核。', en: 'Answer panels can show evidence snippets and hit locations for auditing.' },
        meta: { zh: '可信输出', en: 'Trustworthy output' },
      },
    ],
    actions: [
      { label: { zh: '进入知识库', en: 'Open Knowledge Base' }, to: '/database/knowledge' },
      { label: { zh: '返回 AI 对话', en: 'Back to AI Chat' }, to: '/chat' },
    ],
  },
  '/aiChat/batchListing': {
    i18nKey: 'pages.aiChatBatchListing',
    icon: ListOrdered,
    section: 'ops',
    decoration: ListDecoration,
    subtitle: {
      zh: '把批量文本生成做成可执行工作台，而不是单一输入框。',
      en: 'Turn batch content generation into an actionable workbench instead of a single prompt box.',
    },
    stats: [
      { value: '126', label: { zh: '待处理 SKU', en: 'Queued SKUs' } },
      { value: '4', label: { zh: '模板版本', en: 'Template Versions' } },
      { value: '2.4m', label: { zh: '累计输出字数', en: 'Words Generated' } },
    ],
    cards: [
      {
        title: { zh: '批量任务导入', en: 'Batch Task Import' },
        desc: { zh: '支持 SKU 表、竞品链接、商品属性表单统一导入。', en: 'Import SKU sheets, competitor links, and product attributes in a single flow.' },
        meta: { zh: '偏运营流水线视角', en: 'Operator pipeline oriented' },
      },
      {
        title: { zh: '结果质检位', en: 'Quality Check Slot' },
        desc: { zh: '支持敏感词、长度、关键词覆盖率和品牌口吻检查。', en: 'Checks for sensitive terms, length, keyword coverage, and brand tone.' },
        meta: { zh: '内容审核', en: 'Content review' },
      },
    ],
    actions: [
      { label: { zh: '打开模板市场', en: 'Open Template Market' }, to: '/aiChat/template' },
      { label: { zh: '查看分析记录', en: 'View Analysis Records' }, to: '/aiChat/analysisRecords' },
    ],
  },
  '/aiChat/history': {
    i18nKey: 'pages.aiChatHistory',
    icon: History,
    section: 'ops',
    decoration: ListDecoration,
    subtitle: {
      zh: '沉淀所有 AI 对话和任务执行记录，作为团队复盘与二次复用资产。',
      en: 'Persist AI conversations and executions as reusable team knowledge and review assets.',
    },
    stats: [
      { value: '87', label: { zh: '本周记录', en: 'Records This Week' } },
      { value: '13', label: { zh: '已收藏会话', en: 'Saved Sessions' } },
      { value: '5', label: { zh: '团队共享', en: 'Shared to Team' } },
    ],
    cards: [
      {
        title: { zh: '会话时间线', en: 'Conversation Timeline' },
        desc: { zh: '按照项目、产品和任务类型聚合每次 AI 交互。', en: 'Group every AI interaction by project, product, and task type.' },
        meta: { zh: '适合复盘与知识沉淀', en: 'For review and reuse' },
      },
      {
        title: { zh: '结果二次利用', en: 'Reusable Results' },
        desc: { zh: '一键复制为模板、保存到知识库或继续编辑。', en: 'Copy into templates, save to KB, or continue editing in place.' },
        meta: { zh: '后续可接收藏体系', en: 'Favorites system ready later' },
      },
    ],
    actions: [
      { label: { zh: '返回 AI 对话', en: 'Back to Chat' }, to: '/chat' },
      { label: { zh: '我的模板', en: 'My Templates' }, to: '/aiChat/myTemplate' },
    ],
  },
  '/aiChat/myTemplate': {
    i18nKey: 'pages.aiChatMyTemplate',
    icon: LayoutGrid,
    section: 'ops',
    decoration: TemplateDecoration,
    subtitle: {
      zh: '把团队自定义 Prompt、工作流模板和私有资产统一收拢到个人/团队模板库。',
      en: 'Consolidate custom prompts, workflows, and private assets into a unified personal/team template library.',
    },
    stats: [
      { value: '19', label: { zh: '私有模板', en: 'Private Templates' } },
      { value: '8', label: { zh: '团队模板', en: 'Team Templates' } },
      { value: '3', label: { zh: '草稿版本', en: 'Draft Versions' } },
    ],
    cards: [
      {
        title: { zh: '模板卡片库', en: 'Template Card Grid' },
        desc: { zh: '支持标签、平台、适用任务、版本和权限状态。', en: 'Track tag, platform, scenario, version, and permission state.' },
        meta: { zh: '可衔接模板详情页', en: 'Ready for template detail view' },
      },
      {
        title: { zh: '复制 / 分叉 / 发布', en: 'Clone / Fork / Publish' },
        desc: { zh: '模板从个人私有到团队共用有完整状态流。', en: 'Move templates from private drafts to shared team assets with clear states.' },
        meta: { zh: '产品级模板资产能力', en: 'Product-grade template assets' },
      },
    ],
    actions: [
      { label: { zh: '前往模板市场', en: 'Go to Marketplace' }, to: '/aiChat/template' },
      { label: { zh: '查看分析记录', en: 'Open Analysis Records' }, to: '/aiChat/analysisRecords' },
    ],
  },
  '/aiChat/analysisRecords': {
    i18nKey: 'pages.aiChatAnalysisRecords',
    icon: Brain,
    section: 'ops',
    decoration: ListDecoration,
    subtitle: {
      zh: '汇总调研、评论洞察、竞品拆解、关键词分析等结果记录。',
      en: 'A result hub for research, review insight, competitor teardown, and keyword analysis outputs.',
    },
    stats: [
      { value: '31', label: { zh: '分析任务', en: 'Analysis Tasks' } },
      { value: '12', label: { zh: '高价值结论', en: 'Key Insights' } },
      { value: '6', label: { zh: '待追踪动作', en: 'Follow-up Items' } },
    ],
    cards: [
      {
        title: { zh: '结构化输出', en: 'Structured Outputs' },
        desc: { zh: '把分析结果整理成结论、证据、建议动作三段式。', en: 'Package insights as findings, evidence, and recommended actions.' },
        meta: { zh: '偏分析结果沉淀', en: 'Insight repository oriented' },
      },
      {
        title: { zh: '跨页面回写', en: 'Cross-page Sync' },
        desc: { zh: '结论可以继续送去模板、Listing 或资料库使用。', en: 'Insights can be pushed into templates, listings, or knowledge repositories.' },
        meta: { zh: '后续衔接工作流', en: 'Workflow integration ready' },
      },
    ],
    actions: [
      { label: { zh: '打开批量 Listing', en: 'Open Batch Listing' }, to: '/aiChat/batchListing' },
      { label: { zh: '回到模板市场', en: 'Back to Marketplace' }, to: '/aiChat/template' },
    ],
  },
  '/aiChat/training': {
    i18nKey: 'pages.aiChatTraining',
    icon: Brain,
    section: 'ops',
    decoration: TemplateDecoration,
    subtitle: {
      zh: '选品训练、策略校准和模型偏好管理会在这里形成闭环。',
      en: 'Product selection training, strategy calibration, and model preference management will converge here.',
    },
    stats: [
      { value: '5', label: { zh: '训练任务', en: 'Training Tasks' } },
      { value: '3', label: { zh: '策略版本', en: 'Strategy Versions' } },
      { value: '92%', label: { zh: '采纳率', en: 'Adoption Rate' } },
    ],
    cards: [
      {
        title: { zh: '品类策略训练', en: 'Category Strategy Training' },
        desc: { zh: '围绕平台、预算、供应链特点建立选品偏好。', en: 'Build selection preferences around channel, budget, and supply chain realities.' },
        meta: { zh: '偏好可调', en: 'Preference tuning' },
      },
      {
        title: { zh: '策略复盘面板', en: 'Strategy Review Panel' },
        desc: { zh: '对比不同训练版本下的推荐结果差异。', en: 'Compare output differences across strategy versions and iterations.' },
        meta: { zh: '后续接评估指标', en: 'Evaluation metrics ready later' },
      },
    ],
    actions: [
      { label: { zh: '分析记录', en: 'Analysis Records' }, to: '/aiChat/analysisRecords' },
      { label: { zh: '模板市场', en: 'Template Market' }, to: '/aiChat/template' },
    ],
  },
  '/database/knowledge': {
    i18nKey: 'pages.databaseKnowledge',
    icon: Database,
    section: 'data',
    decoration: DocDecoration,
    subtitle: {
      zh: '知识库不是简单文档堆放，而是面向 AI 可消费的资料资产层。',
      en: 'The knowledge base is not a document dump, but an AI-consumable asset layer for reusable knowledge.',
    },
    stats: [
      { value: '248', label: { zh: '资料条目', en: 'Knowledge Entries' } },
      { value: '16', label: { zh: '标签分类', en: 'Tag Buckets' } },
      { value: '12', label: { zh: '最近更新', en: 'Recent Updates' } },
    ],
    cards: [
      {
        title: { zh: '资料归档区', en: 'Archive Zones' },
        desc: { zh: '按品牌、平台、政策、品类和 SOP 组织资料。', en: 'Organize assets by brand, platform, policy, category, and SOP.' },
        meta: { zh: '支持后续 RAG 化', en: 'RAG-ready architecture' },
      },
      {
        title: { zh: '知识治理面板', en: 'Knowledge Governance' },
        desc: { zh: '展示失效标记、权限、引用来源和更新时间。', en: 'Show staleness flags, permission controls, source references, and timestamps.' },
        meta: { zh: '团队共享资产底座', en: 'Foundation for team-shared assets' },
      },
    ],
    actions: [
      { label: { zh: '进入知识库对话', en: 'Open Knowledge Chat' }, to: '/chat/doc' },
      { label: { zh: '查看素材库', en: 'Open Asset Library' }, to: '/database/picturelibrary' },
    ],
  },
  '/database/picturelibrary': {
    i18nKey: 'pages.databasePicturelibrary',
    icon: ImageIcon,
    section: 'data',
    decoration: ImageDecoration,
    subtitle: {
      zh: '图片素材库承接场景图、模特图、平铺图和灵感参考的统一管理。',
      en: 'The image asset library centralizes scene images, model shots, flat lays, and inspiration references.',
    },
    stats: [
      { value: '1.8k', label: { zh: '素材数量', en: 'Assets' } },
      { value: '11', label: { zh: '素材分组', en: 'Collections' } },
      { value: '84%', label: { zh: '可复用率', en: 'Reuse Rate' } },
    ],
    cards: [
      {
        title: { zh: '场景素材分层', en: 'Scene Asset Layers' },
        desc: { zh: '区分白底、场景、A+、社媒、视频封面等资产类型。', en: 'Separate white background, scene, A+, social, and video cover assets.' },
        meta: { zh: '适合视觉生产链', en: 'Built for visual production workflows' },
      },
      {
        title: { zh: '模板反查关系', en: 'Template Backlinks' },
        desc: { zh: '后续模板、设计器和下载中心都能回溯到素材来源。', en: 'Templates, designer, and download center can all trace back to the source asset.' },
        meta: { zh: '可衔接后续动作', en: 'Ready for next actions' },
      },
    ],
    actions: [
      { label: { zh: '查看场景图库', en: 'Open Scene Gallery' }, to: '/draw/scene-reference' },
      { label: { zh: '打开设计器', en: 'Open Designer' }, to: '/draw/designer-home' },
    ],
  },
  '/brandLibrary': {
    i18nKey: 'pages.brandLibrary',
    icon: Bookmark,
    section: 'data',
    decoration: ListDecoration,
    subtitle: {
      zh: '品牌语气、视觉规范和禁用词应该统一沉淀在品牌库，而不是散落在聊天记录里。',
      en: 'Brand tone, design systems, and forbidden terms should live in a reusable brand repository instead of scattered chats.',
    },
    stats: [
      { value: '9', label: { zh: '品牌档案', en: 'Brand Profiles' } },
      { value: '27', label: { zh: '品牌规则', en: 'Brand Rules' } },
      { value: '3', label: { zh: '共享团队', en: 'Shared Teams' } },
    ],
    cards: [
      {
        title: { zh: '品牌规则卡片', en: 'Brand Rule Cards' },
        desc: { zh: '统一管理语气、禁用词、色板、品牌标签与常用描述。', en: 'Manage tone, forbidden terms, palettes, brand tags, and reusable descriptors.' },
        meta: { zh: '可供 AI 消费', en: 'AI-consumable assets' },
      },
      {
        title: { zh: '输出一致性控制', en: 'Consistency Controls' },
        desc: { zh: '后续可约束 Listing、模板、图像生成和设计器输出。', en: 'Can later constrain listings, templates, image generation, and designer outputs.' },
        meta: { zh: '品牌资产底座', en: 'Brand foundation layer' },
      },
    ],
    actions: [
      { label: { zh: '敏感词库', en: 'Sensitive Terms' }, to: '/database/sensitiveThesaurus' },
      { label: { zh: '标签管理', en: 'Tag Management' }, to: '/database/tagManage' },
    ],
  },
  '/database/sensitiveThesaurus': {
    i18nKey: 'pages.databaseSensitiveThesaurus',
    icon: ShieldAlert,
    section: 'data',
    decoration: DocDecoration,
    subtitle: {
      zh: '将平台风险词、品牌禁用语和合规规则统一托管，支撑生成前后校验。',
      en: 'Centralize platform risk terms, brand restrictions, and compliance rules for pre/post generation checks.',
    },
    stats: [
      { value: '216', label: { zh: '风险词', en: 'Risk Terms' } },
      { value: '4', label: { zh: '规则集合', en: 'Rule Sets' } },
      { value: '18', label: { zh: '触发样例', en: 'Triggered Cases' } },
    ],
    cards: [
      {
        title: { zh: '规则优先级', en: 'Rule Priorities' },
        desc: { zh: '区分平台级、品牌级和活动级的不同敏感规则。', en: 'Separate platform-, brand-, and campaign-level rule sets.' },
        meta: { zh: '内容审核基础', en: 'Review foundation' },
      },
      {
        title: { zh: '结果修复建议', en: 'Fix Suggestions' },
        desc: { zh: '后续会给出替代表达和自动修复建议。', en: 'Later versions can suggest alternative wording and auto-fix proposals.' },
        meta: { zh: '适合内容质检', en: 'For content QA' },
      },
    ],
    actions: [
      { label: { zh: '回到品牌库', en: 'Back to Brand Library' }, to: '/brandLibrary' },
      { label: { zh: '查看批量 Listing', en: 'Open Batch Listing' }, to: '/aiChat/batchListing' },
    ],
  },
  '/database/tagManage': {
    i18nKey: 'pages.databaseTagManage',
    icon: Tag,
    section: 'data',
    decoration: ListDecoration,
    subtitle: {
      zh: '标签体系负责把素材、知识、模板和项目串成一套统一检索语言。',
      en: 'Tags connect assets, knowledge, templates, and projects into one searchable language system.',
    },
    stats: [
      { value: '63', label: { zh: '业务标签', en: 'Business Tags' } },
      { value: '18', label: { zh: '平台标签', en: 'Platform Tags' } },
      { value: '9', label: { zh: '视觉标签', en: 'Visual Tags' } },
    ],
    cards: [
      {
        title: { zh: '标签分层', en: 'Tag Hierarchies' },
        desc: { zh: '按渠道、品类、场景、用途和风险等级组织。', en: 'Layer tags by channel, category, scenario, purpose, and risk level.' },
        meta: { zh: '服务跨模块检索', en: 'Supports cross-module retrieval' },
      },
      {
        title: { zh: '自动打标', en: 'Auto Tagging' },
        desc: { zh: '自动识别素材和内容特征，减少手工整理。', en: 'AI-based asset and content tagging reduces manual organization.' },
        meta: { zh: '可持续扩展', en: 'Extensible workflow' },
      },
    ],
    actions: [
      { label: { zh: '品牌库', en: 'Brand Library' }, to: '/brandLibrary' },
      { label: { zh: '图片素材库', en: 'Image Library' }, to: '/database/picturelibrary' },
    ],
  },
  '/draw/scene-reference': {
    i18nKey: 'pages.drawSceneReference',
    icon: Eye,
    section: 'design',
    decoration: ImageDecoration,
    subtitle: {
      zh: '沉淀场景参考、灵感图库和风格趋势，作为设计与生成的起点。',
      en: 'Capture references, inspiration, and style trends as starting points for design and generation.',
    },
    stats: [
      { value: '520', label: { zh: '场景参考', en: 'Scene References' } },
      { value: '12', label: { zh: '风格分组', en: 'Style Buckets' } },
      { value: '5', label: { zh: '近期热门', en: 'Trending Sets' } },
    ],
    cards: [
      {
        title: { zh: '灵感瀑布流', en: 'Inspiration Feed' },
        desc: { zh: '汇聚竞品、优秀视觉与团队收藏。', en: 'Aggregate competitor references, high-performing creatives, and saved inspirations.' },
        meta: { zh: '视觉起点层', en: 'Visual starting layer' },
      },
      {
        title: { zh: '一键带入生成', en: 'One-click to Generate' },
        desc: { zh: '后续可以把参考图直接带入工具页作为控制条件。', en: 'Later bring references straight into generation tools as control signals.' },
        meta: { zh: '衔接工具工作流', en: 'Connects to tool workflows' },
      },
    ],
    actions: [
      { label: { zh: '去图片素材库', en: 'Open Asset Library' }, to: '/database/picturelibrary' },
      { label: { zh: '打开设计器', en: 'Open Designer' }, to: '/draw/designer-home' },
    ],
  },
  '/draw/product-home': {
    i18nKey: 'pages.drawProductHome',
    icon: Package,
    section: 'design',
    decoration: ListDecoration,
    subtitle: {
      zh: '把待处理产品、主图状态、生成记录和素材回收统一纳入商品中心。',
      en: 'Unify products, asset state, generation records, and recovery in a single product center.',
    },
    stats: [
      { value: '148', label: { zh: '管理商品', en: 'Managed SKUs' } },
      { value: '32', label: { zh: '待生成', en: 'Queued Assets' } },
      { value: '14', label: { zh: '待审核', en: 'Pending Review' } },
    ],
    cards: [
      {
        title: { zh: '商品总览', en: 'Product Overview' },
        desc: { zh: '按品类、平台、上新阶段查看当前视觉状态。', en: 'Inspect visual progress by category, platform, and launch stage.' },
        meta: { zh: '视觉生产主台', en: 'Visual production center' },
      },
      {
        title: { zh: '资产回收站', en: 'Asset Recovery' },
        desc: { zh: '查看哪些生成结果进入素材库、下载中心和设计器。', en: 'Track which outputs entered the asset library, downloads, and designer.' },
        meta: { zh: '跨模块资产视角', en: 'Cross-module asset view' },
      },
    ],
    actions: [
      { label: { zh: '生成记录', en: 'Generation Records' }, to: '/products/workbench/visual-tools' },
      { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
    ],
  },
  '/draw/product-records': {
    i18nKey: 'pages.drawProductRecords',
    icon: History,
    section: 'design',
    decoration: ListDecoration,
    subtitle: {
      zh: '对每次生成任务、输入素材、配置参数和输出结果做时间线沉淀。',
      en: 'Persist every generation task, input asset, parameter set, and output in a timeline.',
    },
    stats: [
      { value: '312', label: { zh: '生成任务', en: 'Generation Jobs' } },
      { value: '9', label: { zh: '失败重试', en: 'Retries' } },
      { value: '76%', label: { zh: '成功率', en: 'Success Rate' } },
    ],
    cards: [
      {
        title: { zh: '任务队列视图', en: 'Task Queue View' },
        desc: { zh: '展示排队、生成中、完成、失败等状态流。', en: 'Show queued, generating, completed, and failed states in one timeline.' },
        meta: { zh: '后续接异步任务系统', en: 'Ready for async task integration' },
      },
      {
        title: { zh: '参数复用', en: 'Parameter Reuse' },
        desc: { zh: '支持按历史任务一键复制配置重新生成。', en: 'Re-run previous jobs by copying the same parameter preset.' },
        meta: { zh: '高频运营动作', en: 'High-frequency operator action' },
      },
    ],
    actions: [
      { label: { zh: '商品中心', en: 'Product Center' }, to: '/products' },
      { label: { zh: '历史记录', en: 'History' }, to: '/draw/history' },
    ],
  },
  '/draw/designer-home': {
    i18nKey: 'pages.drawDesignerHome',
    icon: Palette,
    section: 'design',
    decoration: DesignDecoration,
    subtitle: {
      zh: '设计器承接海报、详情页、活动页和快速二改，是视觉工具的二次加工层。',
      en: 'The designer is the post-processing layer for posters, PDP sections, campaign pages, and quick iterations.',
    },
    stats: [
      { value: '36', label: { zh: '设计模板', en: 'Design Templates' } },
      { value: '12', label: { zh: '进行中稿件', en: 'Active Drafts' } },
      { value: '4', label: { zh: '团队共创', en: 'Shared Drafts' } },
    ],
    cards: [
      {
        title: { zh: '画布工作区', en: 'Canvas Workspace' },
        desc: { zh: '后续接入图层、元素库、品牌规范和导出设置。', en: 'Later add layers, element libraries, brand constraints, and export settings.' },
        meta: { zh: '设计加工层', en: 'Design post-processing layer' },
      },
      {
        title: { zh: '模板与稿件双入口', en: 'Template and Draft Dual Entry' },
        desc: { zh: '既能从模板出发，也能从已有生成结果继续编辑。', en: 'Start from templates or continue editing an existing generated asset.' },
        meta: { zh: '连接生成与设计', en: 'Bridges generation and design' },
      },
    ],
    actions: [
      { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: '我的模板', en: 'My Templates' }, to: '/draw/my-template' },
    ],
  },
  '/draw/my-design': {
    i18nKey: 'pages.drawMyDesign',
    icon: Layers,
    section: 'design',
    decoration: ImageDecoration,
    subtitle: {
      zh: '聚合个人设计稿、快速修改稿和导出记录。',
      en: 'Aggregate personal drafts, quick edits, and export history in one workspace.',
    },
    stats: [
      { value: '24', label: { zh: '设计稿', en: 'Drafts' } },
      { value: '11', label: { zh: '已导出', en: 'Exported' } },
      { value: '5', label: { zh: '待协作', en: 'Awaiting Review' } },
    ],
    cards: [
      {
        title: { zh: '草稿卡片', en: 'Draft Cards' },
        desc: { zh: '每张稿件带来源素材、最后修改时间和导出版本。', en: 'Each card tracks source assets, last modified time, and export versions.' },
        meta: { zh: '偏设计资产管理', en: 'Design asset management' },
      },
      {
        title: { zh: '回到工具页', en: 'Back to Tooling' },
        desc: { zh: '设计稿可以继续回到生成工具补图或改文案。', en: 'Drafts can flow back into generation tools for more variants or copy.' },
        meta: { zh: '形成生产闭环', en: 'Closes the production loop' },
      },
    ],
    actions: [
      { label: { zh: '设计器首页', en: 'Designer Home' }, to: '/draw/designer-home' },
      { label: { zh: '团队空间', en: 'Team Space' }, to: '/draw/team-space' },
    ],
  },
  '/draw/my-template': {
    i18nKey: 'pages.drawMyTemplate',
    icon: LayoutGrid,
    section: 'design',
    decoration: TemplateDecoration,
    subtitle: {
      zh: '沉淀海报、详情页、活动 Banner 等设计模板，用于快速复用。',
      en: 'Save poster, PDP, and campaign banner templates for repeatable design operations.',
    },
    stats: [
      { value: '18', label: { zh: '模板数', en: 'Templates' } },
      { value: '7', label: { zh: '团队共享', en: 'Team Shared' } },
      { value: '4', label: { zh: '最近复用', en: 'Recently Reused' } },
    ],
    cards: [
      {
        title: { zh: '视觉模板资产', en: 'Visual Template Assets' },
        desc: { zh: '支持分平台、分场景、分活动类型进行管理。', en: 'Manage templates by platform, scenario, and campaign type.' },
        meta: { zh: '设计生产加速器', en: 'Design production accelerator' },
      },
      {
        title: { zh: '模板套版逻辑', en: 'Template Re-application' },
        desc: { zh: '后续可以把商品和文案一键套用到设计模板。', en: 'Later apply product assets and copy into templates in one click.' },
        meta: { zh: '偏半自动设计', en: 'Semi-automated design' },
      },
    ],
    actions: [
      { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: 'AI Agent 模板', en: 'AI Agent Templates' }, to: '/aiChat/template' },
    ],
  },
  '/draw/team-space': {
    i18nKey: 'pages.drawTeamSpace',
    icon: Users,
    section: 'design',
    decoration: ListDecoration,
    subtitle: {
      zh: '团队空间承接协作、共享模板、资产分发和版本审核。',
      en: 'Team space enables collaboration, shared templates, asset distribution, and version review.',
    },
    stats: [
      { value: '5', label: { zh: '成员', en: 'Members' } },
      { value: '12', label: { zh: '共享模板', en: 'Shared Templates' } },
      { value: '9', label: { zh: '待审核', en: 'Awaiting Review' } },
    ],
    cards: [
      {
        title: { zh: '项目级协作', en: 'Project Collaboration' },
        desc: { zh: '按项目和产品线组织共享资产与进度。', en: 'Organize shared assets and progress by project and product line.' },
        meta: { zh: '团队协作空间', en: 'Team workspace' },
      },
      {
        title: { zh: '权限与版本', en: 'Permissions and Versions' },
        desc: { zh: '支持成员角色、审批和版本回滚管理。', en: 'Manage roles, approvals, and version rollback flows.' },
        meta: { zh: '团队权限管理', en: 'Team permissions' },
      },
    ],
    actions: [
      { label: { zh: '我的设计', en: 'My Designs' }, to: '/draw/my-design' },
      { label: { zh: '订单列表', en: 'Order List' }, to: '/orderList' },
    ],
  },
  '/draw/history': {
    i18nKey: 'pages.drawHistory',
    icon: Clock,
    section: 'design',
    decoration: ListDecoration,
    subtitle: {
      zh: '汇总所有视觉工具历史，包括生成、修改、下载和分享。',
      en: 'A consolidated history across generation, edits, downloads, and sharing activities.',
    },
    stats: [
      { value: '429', label: { zh: '历史记录', en: 'History Items' } },
      { value: '28', label: { zh: '今日任务', en: 'Today Tasks' } },
      { value: '3', label: { zh: '失败项', en: 'Failures' } },
    ],
    cards: [
      {
        title: { zh: '跨工具时间线', en: 'Cross-tool Timeline' },
        desc: { zh: '将模特图、商品图、视频和设计动作放入同一时间轴。', en: 'Place model, product, video, and design actions into one timeline.' },
        meta: { zh: '统一历史视角', en: 'Unified history view' },
      },
      {
        title: { zh: '检索与筛选', en: 'Search and Filters' },
        desc: { zh: '未来可按商品、任务状态、成员和日期范围筛选。', en: 'Filter later by product, task status, member, and date range.' },
        meta: { zh: '高频运营检索需求', en: 'High-frequency operations need' },
      },
    ],
    actions: [
      { label: { zh: '生成记录', en: 'Generation Records' }, to: '/products/workbench/visual-tools' },
      { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
    ],
  },
  '/orderList': {
    i18nKey: 'pages.orderList',
    icon: FileText,
    section: 'business',
    decoration: ListDecoration,
    subtitle: {
      zh: '订单中心负责展示订阅、充值包、团队席位和服务采购记录。',
      en: 'The order center tracks subscriptions, credit packs, team seats, and service purchases.',
    },
    stats: [
      { value: '12', label: { zh: '订单数', en: 'Orders' } },
      { value: '3', label: { zh: '活跃订阅', en: 'Active Plans' } },
      { value: '2', label: { zh: '待支付', en: 'Pending Payment' } },
    ],
    cards: [
      {
        title: { zh: '商业订单流', en: 'Commercial Order Flow' },
        desc: { zh: '按订阅、资源包、团队版、咨询服务区分订单类型。', en: 'Separate subscriptions, credit packs, team plans, and service orders.' },
        meta: { zh: '为商业化落地预埋', en: 'Commercialization-ready skeleton' },
      },
      {
        title: { zh: '发票与售后状态', en: 'Invoices and Support Status' },
        desc: { zh: '集中查看支付、开票、退款和售后状态。', en: 'Track payment, invoicing, refund, and support states.' },
        meta: { zh: '订单状态管理', en: 'Order status management' },
      },
    ],
    actions: [
      { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
      { label: { zh: '定价页', en: 'Pricing Page' }, to: '/pricing' },
    ],
  },
  '/downloadCenter': {
    i18nKey: 'pages.downloadCenter',
    icon: Download,
    section: 'business',
    decoration: ListDecoration,
    subtitle: {
      zh: '集中管理生成结果、导出包、批量任务压缩包和历史下载。',
      en: 'Centralize generated outputs, export bundles, batch archives, and download history.',
    },
    stats: [
      { value: '64', label: { zh: '可下载结果', en: 'Available Files' } },
      { value: '9', label: { zh: '批量打包', en: 'Batch Bundles' } },
      { value: '1.2GB', label: { zh: '占用空间', en: 'Storage Used' } },
    ],
    cards: [
      {
        title: { zh: '下载工作台', en: 'Download Workspace' },
        desc: { zh: '支持按任务、商品、设计稿、格式类型管理导出结果。', en: 'Manage outputs by task, product, draft, and file format.' },
        meta: { zh: '连接生成结果与交付', en: 'Connects output to delivery' },
      },
      {
        title: { zh: '状态与失效时间', en: 'Status and Expiry' },
        desc: { zh: '后续展示文件有效期、重新打包和下载次数。', en: 'Show retention time, re-bundle actions, and download counts later.' },
        meta: { zh: '适合异步任务联动', en: 'Works with async processing' },
      },
    ],
    actions: [
      { label: { zh: '订单列表', en: 'Order List' }, to: '/orderList' },
      { label: { zh: '历史记录', en: 'History' }, to: '/draw/history' },
    ],
  },
  '/aboutus': {
    i18nKey: 'pages.aboutUs',
    icon: Layers,
    section: 'portal',
    decoration: DefaultDecoration,
    subtitle: {
      zh: '门户页面用于承载品牌故事、能力地图和团队介绍，让访客快速理解产品价值。',
      en: 'Portal pages present the brand story, capability map, and team information so visitors understand product value quickly.',
    },
    stats: [
      { value: '3', label: { zh: '内容分栏', en: 'Content Columns' } },
      { value: '1', label: { zh: '品牌主线', en: 'Brand Narrative' } },
      { value: 'N', label: { zh: '后续扩展位', en: 'Future Expansions' } },
    ],
    cards: [
      {
        title: { zh: '品牌叙事区', en: 'Brand Narrative' },
        desc: { zh: '后续承接 Agent Ecommerce 的愿景、能力边界和客户价值。', en: 'Future area for vision, product boundary, and customer value positioning.' },
        meta: { zh: '门户叙事层', en: 'Portal narrative layer' },
      },
      {
        title: { zh: '能力地图区', en: 'Capability Map' },
        desc: { zh: '把视觉生成、运营智能、资料库、商业系统串起来。', en: 'Connect visual generation, ops intelligence, asset library, and commerce systems.' },
        meta: { zh: '适合对外表达', en: 'Good for external storytelling' },
      },
    ],
    actions: [
      { label: { zh: '返回首页', en: 'Back Home' }, to: '/' },
      { label: { zh: '查看定价', en: 'View Pricing' }, to: '/pricing' },
    ],
  },
  '/help': {
    i18nKey: 'pages.helpCenter',
    icon: BookOpen,
    section: 'portal',
    decoration: DocDecoration,
    subtitle: {
      zh: '帮助中心会承接新手引导、常见问题和功能使用说明。',
      en: 'Help Center will host onboarding, FAQs, and feature usage instructions.',
    },
    stats: [
      { value: '18', label: { zh: '帮助主题', en: 'Help Topics' } },
      { value: '6', label: { zh: '新手指引', en: 'Onboarding Guides' } },
      { value: '4', label: { zh: '热门问题', en: 'Popular FAQs' } },
    ],
    cards: [
      {
        title: { zh: '帮助主题树', en: 'Help Topic Tree' },
        desc: { zh: '按门户、工具、模板、订单和团队模块分层。', en: 'Split by portal, tools, templates, orders, and team modules.' },
        meta: { zh: '文档中心', en: 'Documentation center' },
      },
      {
        title: { zh: '引导式教程', en: 'Guided Tutorials' },
        desc: { zh: '适合接新手任务、视频教程和操作分步说明。', en: 'Ready for onboarding tasks, tutorial videos, and step-by-step guidance.' },
        meta: { zh: '提高留存体验', en: 'Improves retention experience' },
      },
    ],
    actions: [
      { label: { zh: 'API 文档', en: 'API Docs' }, to: '/api-docs' },
      { label: { zh: '联系我们', en: 'Contact Us' }, to: '/contact' },
    ],
  },
  '/api-docs': {
    i18nKey: 'pages.apiDocs',
    icon: FileText,
    section: 'portal',
    decoration: DocDecoration,
    subtitle: {
      zh: 'API 文档页会在后续承接开放能力、鉴权说明和 SDK 示例。',
      en: 'API docs will later host public capabilities, auth specs, and SDK examples.',
    },
    stats: [
      { value: '9', label: { zh: '核心接口', en: 'Core APIs' } },
      { value: '3', label: { zh: '鉴权方式', en: 'Auth Modes' } },
      { value: '2', label: { zh: 'SDK 语言', en: 'SDK Languages' } },
    ],
    cards: [
      {
        title: { zh: '能力目录', en: 'Capability Catalog' },
        desc: { zh: '面向图像生成、任务查询、订单、下载等开放接口。', en: 'Expose image generation, task query, order, and download APIs.' },
        meta: { zh: '为后续平台化铺路', en: 'Paves the way for platform APIs' },
      },
      {
        title: { zh: '接入向导', en: 'Integration Guide' },
        desc: { zh: '包括鉴权、限流、错误码和回调说明。', en: 'Includes auth, rate limits, error codes, and callback guides.' },
        meta: { zh: '开发者入口', en: 'Developer entry point' },
      },
    ],
    actions: [
      { label: { zh: '帮助中心', en: 'Help Center' }, to: '/help' },
      { label: { zh: '定价页', en: 'Pricing' }, to: '/pricing' },
    ],
  },
  '/blog': {
    i18nKey: 'pages.blog',
    icon: FileText,
    section: 'portal',
    decoration: DocDecoration,
    subtitle: {
      zh: '内容中心用于沉淀案例、教程、产品更新和行业洞察。',
      en: 'The blog acts as a content hub for cases, tutorials, releases, and industry insights.',
    },
    stats: [
      { value: '28', label: { zh: '精选文章', en: 'Featured Posts' } },
      { value: '4', label: { zh: '专题栏目', en: 'Editorial Tracks' } },
      { value: '2', label: { zh: '案例专题', en: 'Case Series' } },
    ],
    cards: [
      {
        title: { zh: '内容分栏', en: 'Editorial Tracks' },
        desc: { zh: '后续分成案例、教程、更新日志和行业趋势。', en: 'Can split into case studies, tutorials, changelogs, and trends.' },
        meta: { zh: '门户内容运营位', en: 'Portal content operations' },
      },
      {
        title: { zh: 'SEO 内容承接', en: 'SEO Content Layer' },
        desc: { zh: '承担搜索入口和对外专业形象输出。', en: 'Supports organic search entry and expert brand perception.' },
        meta: { zh: '增长导流层', en: 'Growth acquisition layer' },
      },
    ],
    actions: [
      { label: { zh: '更新日志', en: 'Changelog' }, to: '/changelog' },
      { label: { zh: '返回首页', en: 'Back Home' }, to: '/' },
    ],
  },
  '/changelog': {
    i18nKey: 'pages.changelog',
    icon: Clock,
    section: 'portal',
    decoration: ListDecoration,
    subtitle: {
      zh: '展示产品迭代节奏、版本演进和关键能力上线记录。',
      en: 'Surface the release cadence, product evolution, and key capability milestones.',
    },
    stats: [
      { value: '12', label: { zh: '版本更新', en: 'Releases' } },
      { value: '5', label: { zh: '核心里程碑', en: 'Milestones' } },
      { value: '3', label: { zh: '近期上线', en: 'Recent Launches' } },
    ],
    cards: [
      {
        title: { zh: '版本时间线', en: 'Release Timeline' },
        desc: { zh: '适合承接新增工具、模板市场升级和工作台能力上线。', en: 'Great for showing tool launches, marketplace upgrades, and workbench evolution.' },
        meta: { zh: '对外产品透明度', en: 'External product transparency' },
      },
      {
        title: { zh: '能力归档', en: 'Capability Archive' },
        desc: { zh: '把已上线功能按模块整理，便于团队和客户理解。', en: 'Archive launched capabilities by module for teams and customers.' },
        meta: { zh: '减少认知成本', en: 'Lowers product comprehension cost' },
      },
    ],
    actions: [
      { label: { zh: '博客', en: 'Blog' }, to: '/blog' },
      { label: { zh: '帮助中心', en: 'Help Center' }, to: '/help' },
    ],
  },
  '/contact': {
    i18nKey: 'pages.contactUs',
    icon: MessageSquare,
    section: 'portal',
    decoration: ChatDecoration,
    subtitle: {
      zh: '联系入口将承接销售咨询、功能反馈、合作申请和售后支持。',
      en: 'Contact entry points will handle sales inquiries, feedback, partnerships, and support requests.',
    },
    stats: [
      { value: '4', label: { zh: '联系渠道', en: 'Contact Channels' } },
      { value: '2h', label: { zh: '响应 SLA', en: 'Response SLA' } },
      { value: 'B2B', label: { zh: '服务模式', en: 'Service Mode' } },
    ],
    cards: [
      {
        title: { zh: '线索收集区', en: 'Lead Intake' },
        desc: { zh: '支持企业采购、团队试用、合作咨询等入口。', en: 'Support enterprise procurement, team trials, and partnership requests.' },
        meta: { zh: '商业线索入口', en: 'Commercial lead intake' },
      },
      {
        title: { zh: '工单路由', en: 'Ticket Routing' },
        desc: { zh: '面向销售、客服和专家支持三类协作流。', en: 'Routes work across sales, support, and expert assistance flows.' },
        meta: { zh: '服务协作', en: 'Service collaboration' },
      },
    ],
    actions: [
      { label: { zh: '查看定价', en: 'View Pricing' }, to: '/pricing' },
      { label: { zh: '帮助中心', en: 'Help Center' }, to: '/help' },
    ],
  },
  '/careers': {
    i18nKey: 'pages.joinUs',
    icon: Users,
    section: 'portal',
    decoration: ListDecoration,
    subtitle: {
      zh: '招聘页目前作为品牌与团队延伸页面，后续可补岗位和文化展示。',
      en: 'Careers acts as a brand-extension page now, with room for jobs and culture storytelling later.',
    },
    stats: [
      { value: '6', label: { zh: '潜在岗位', en: 'Potential Roles' } },
      { value: '3', label: { zh: '团队方向', en: 'Team Tracks' } },
      { value: '1', label: { zh: '文化主线', en: 'Culture Narrative' } },
    ],
    cards: [
      {
        title: { zh: '岗位分区', en: 'Role Categories' },
        desc: { zh: '覆盖产品、设计、工程、AI 应用和商业化等岗位方向。', en: 'Covers product, design, engineering, AI application, and commerce roles.' },
        meta: { zh: '门户延伸页', en: 'Portal extension page' },
      },
      {
        title: { zh: '团队文化', en: 'Team Culture' },
        desc: { zh: '承接品牌价值观和对外雇主形象输出。', en: 'Supports value storytelling and employer branding.' },
        meta: { zh: '品牌资产位', en: 'Brand asset slot' },
      },
    ],
    actions: [
      { label: { zh: '关于我们', en: 'About Us' }, to: '/aboutus' },
      { label: { zh: '联系我们', en: 'Contact Us' }, to: '/contact' },
    ],
  },
  '/privacy': {
    i18nKey: 'pages.privacyPolicy',
    icon: ShieldAlert,
    section: 'portal',
    decoration: DocDecoration,
    subtitle: {
      zh: '隐私政策按清晰结构呈现，方便查看数据使用和权益说明。',
      en: 'The privacy policy is structured for clear data-use and rights explanations.',
    },
    stats: [
      { value: '1', label: { zh: '协议主体', en: 'Policy Body' } },
      { value: '4', label: { zh: '章节层级', en: 'Sections' } },
      { value: 'Legal', label: { zh: '合规属性', en: 'Compliance' } },
    ],
    cards: [
      {
        title: { zh: '合规文档结构', en: 'Compliance Document Structure' },
        desc: { zh: '按数据收集、使用、存储和删除组织内容。', en: 'Organize around data collection, use, storage, and deletion.' },
        meta: { zh: '门户法务页', en: 'Portal legal page' },
      },
      {
        title: { zh: '版本声明', en: 'Version Notice' },
        desc: { zh: '展示更新时间和重要变更提示。', en: 'Show update timestamps and important notices.' },
        meta: { zh: '适合法务维护', en: 'Legal maintenance ready' },
      },
    ],
    actions: [
      { label: { zh: '服务条款', en: 'Terms of Service' }, to: '/terms' },
      { label: { zh: '联系我们', en: 'Contact Us' }, to: '/contact' },
    ],
  },
  '/terms': {
    i18nKey: 'pages.termsOfService',
    icon: FileText,
    section: 'portal',
    decoration: DocDecoration,
    subtitle: {
      zh: '服务条款以清晰分区呈现，方便理解权利、义务和使用边界。',
      en: 'The terms page explains rights, responsibilities, and usage boundaries in clear sections.',
    },
    stats: [
      { value: '1', label: { zh: '协议版本', en: 'Agreement Version' } },
      { value: '5', label: { zh: '条款模块', en: 'Clause Modules' } },
      { value: 'Policy', label: { zh: '法律属性', en: 'Policy Type' } },
    ],
    cards: [
      {
        title: { zh: '使用条款模块', en: 'Usage Terms Modules' },
        desc: { zh: '后续包含账户、订阅、生成内容、商用限制与免责说明。', en: 'Can later include account, subscription, generated content, commercial usage, and limitation clauses.' },
        meta: { zh: '文档模块化结构', en: 'Modular agreement structure' },
      },
      {
        title: { zh: '版本同步机制', en: 'Version Sync' },
        desc: { zh: '协议变更可与 changelog、通知中心联动。', en: 'Agreement changes can later sync with changelog and notifications.' },
        meta: { zh: '对外治理基础', en: 'External governance foundation' },
      },
    ],
    actions: [
      { label: { zh: '隐私政策', en: 'Privacy Policy' }, to: '/privacy' },
      { label: { zh: '返回首页', en: 'Back Home' }, to: '/' },
    ],
  },
}

const sectionBadgeMap: Record<PageMeta['section'], LocalizedText> = {
  ops: { zh: 'AI 智能运营', en: 'AI Operations' },
  data: { zh: '数据资料库', en: 'Data Library' },
  design: { zh: '视觉工作台', en: 'Visual Workbench' },
  business: { zh: '商业系统', en: 'Commerce' },
  portal: { zh: '门户信息页', en: 'Portal Information' },
}

const PORTAL_DETAIL_MAP: Record<
  string,
  {
    modules: LocalizedText[]
    deliverables: LocalizedText[]
  }
> = {
  '/aboutus': {
    modules: [
      { zh: '品牌起源与产品愿景', en: 'Brand origin and product vision' },
      { zh: '能力地图与三大产品线关系', en: 'Capability map and three core product lines' },
      { zh: '客户价值与服务承诺', en: 'Customer value and service commitments' },
    ],
    deliverables: [
      { zh: '对外品牌故事首屏', en: 'External brand-story hero section' },
      { zh: '能力边界与产品矩阵说明', en: 'Capability boundary and product-matrix explainer' },
      { zh: '团队与合作伙伴展示模块', en: 'Team and partner showcase modules' },
    ],
  },
  '/help': {
    modules: [
      { zh: '新手上手路径', en: 'Onboarding paths' },
      { zh: '按模块划分的帮助目录', en: 'Module-based help catalog' },
      { zh: '视频教程与常见问题', en: 'Tutorial videos and FAQs' },
    ],
    deliverables: [
      { zh: '工具使用说明页', en: 'Tool usage explainers' },
      { zh: '模板市场帮助专题', en: 'Template marketplace help guides' },
      { zh: '订单与下载排障文档', en: 'Order and download troubleshooting docs' },
    ],
  },
  '/api-docs': {
    modules: [
      { zh: '鉴权与 API Key', en: 'Authentication and API keys' },
      { zh: '图像/任务/订单接口分组', en: 'Image, task, and order API groups' },
      { zh: '错误码与回调说明', en: 'Error codes and callbacks' },
    ],
    deliverables: [
      { zh: '接入总览页', en: 'Integration overview page' },
      { zh: '接口示例与 SDK 代码块', en: 'API examples and SDK code blocks' },
      { zh: '限流与计费规则说明', en: 'Rate limit and billing policy notes' },
    ],
  },
  '/blog': {
    modules: [
      { zh: '案例拆解栏目', en: 'Case-study columns' },
      { zh: '教程与工作流栏目', en: 'Tutorial and workflow columns' },
      { zh: '行业趋势与更新日志联动', en: 'Industry insights linked with changelog' },
    ],
    deliverables: [
      { zh: '精选文章流', en: 'Featured article feed' },
      { zh: '内容标签与搜索', en: 'Content tags and search' },
      { zh: 'SEO 落地页结构', en: 'SEO-ready landing page structure' },
    ],
  },
  '/changelog': {
    modules: [
      { zh: '版本时间线', en: 'Release timeline' },
      { zh: '按模块聚合更新', en: 'Module-grouped updates' },
      { zh: '重要上线能力置顶', en: 'Pinned major launches' },
    ],
    deliverables: [
      { zh: '版本卡片列表', en: 'Release card list' },
      { zh: '能力更新摘要', en: 'Capability update summaries' },
      { zh: '关联帮助/博客跳转', en: 'Links to help and blog' },
    ],
  },
  '/contact': {
    modules: [
      { zh: '销售咨询入口', en: 'Sales inquiry entry' },
      { zh: '合作与渠道申请', en: 'Partnership and channel applications' },
      { zh: '售后与产品反馈路由', en: 'Support and product feedback routing' },
    ],
    deliverables: [
      { zh: '线索表单与跟进状态', en: 'Lead forms and follow-up states' },
      { zh: '不同咨询类型路由', en: 'Inquiry-type routing' },
      { zh: '企业客户预约演示', en: 'Enterprise demo booking' },
    ],
  },
  '/careers': {
    modules: [
      { zh: '岗位分组展示', en: 'Role-group presentation' },
      { zh: '团队文化与协作方式', en: 'Culture and collaboration style' },
      { zh: '招聘流程说明', en: 'Hiring process explanation' },
    ],
    deliverables: [
      { zh: '岗位卡片与筛选', en: 'Job cards and filters' },
      { zh: '团队介绍内容块', en: 'Team-introduction sections' },
      { zh: '投递与联系入口', en: 'Application and contact entry points' },
    ],
  },
  '/privacy': {
    modules: [
      { zh: '数据收集与用途', en: 'Data collection and usage' },
      { zh: '存储、保留与删除规则', en: 'Storage, retention, and deletion policies' },
      { zh: '第三方服务与跨境合规', en: 'Third-party services and compliance' },
    ],
    deliverables: [
      { zh: '法务文档目录结构', en: 'Legal document structure' },
      { zh: '版本号与更新时间', en: 'Versioning and update timestamps' },
      { zh: '重要变更提示模块', en: 'Important change notice module' },
    ],
  },
  '/terms': {
    modules: [
      { zh: '账户与订阅规则', en: 'Account and subscription rules' },
      { zh: '生成内容与商用边界', en: 'Generated content and commercial boundaries' },
      { zh: '免责条款与争议处理', en: 'Disclaimers and dispute handling' },
    ],
    deliverables: [
      { zh: '条款章节目录', en: 'Terms chapter catalog' },
      { zh: '政策版本同步机制', en: 'Policy version sync mechanism' },
      { zh: '与隐私政策联动入口', en: 'Entry points linked to privacy policy' },
    ],
  },
}

export default function GenericPage() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const meta = PAGE_MAP[pathname]

  const title = meta ? t(meta.i18nKey) : pathname
  const Icon = meta?.icon ?? Construction
  const Decoration = meta?.decoration ?? DefaultDecoration
  const portalDetail = PORTAL_DETAIL_MAP[pathname]

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-strong rounded-3xl p-10 text-center max-w-xl">
          <Construction className="mx-auto mb-4 h-10 w-10 text-brand-400" />
          <h1 className="mb-3 text-2xl font-bold gradient-text">{title}</h1>
          <p className="text-white/40">{t('generic.developing')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb w-[560px] h-[560px] bg-brand-500/10 top-1/4 -left-40" />
        <div className="glow-orb w-[420px] h-[420px] bg-accent-500/10 bottom-1/4 -right-20" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
                <Construction className="h-3.5 w-3.5 text-brand-400" />
                <span>{text(locale, sectionBadgeMap[meta.section])}</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold gradient-text">{title}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-white/55">{text(locale, meta.subtitle)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {meta.actions.map(action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <span>{text(locale, action.label)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {meta.stats.map(stat => (
            <div key={stat.value + stat.label.zh} className="glass rounded-2xl p-5">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/45">{text(locale, stat.label)}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 lg:grid-cols-2">
            {meta.cards.map(card => (
              <article key={card.title.zh} className="tool-card glass rounded-2xl p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">{text(locale, card.title)}</h3>
                <p className="mb-5 text-sm leading-6 text-white/55">{text(locale, card.desc)}</p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40">
                  {text(locale, card.meta)}
                </div>
              </article>
            ))}
          </div>

          <aside className="glass rounded-2xl p-5">
            <div className="mb-4 text-sm font-medium text-white/75">
              {locale === 'zh' ? '页面预览' : 'Page Preview'}
            </div>
            <div className="mb-5 flex justify-center opacity-70">
              <Decoration />
            </div>
            <div className="space-y-3 text-sm text-white/50">
              {[
                locale === 'zh' ? '当前页面展示核心信息架构与主要操作路径。' : 'This page shows the core information architecture and main workflows.',
                locale === 'zh' ? '页面会随真实业务数据和团队协作持续完善。' : 'The page will evolve with real business data and team collaboration.',
                locale === 'zh' ? '各模块按业务职责分区，方便后续持续扩展。' : 'Modules are organized by business responsibility for continuous expansion.',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-brand-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {meta.section === 'portal' && portalDetail ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <div className="mb-4 text-sm font-medium text-white/75">
                {locale === 'zh' ? '首批内容模块' : 'Initial Content Modules'}
              </div>
              <div className="space-y-3">
                {portalDetail.modules.map(item => (
                  <div key={item.zh} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                    {text(locale, item)}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-4 text-sm font-medium text-white/75">
                {locale === 'zh' ? '首轮落地内容' : 'First-pass Deliverables'}
              </div>
              <div className="space-y-3">
                {portalDetail.deliverables.map(item => (
                  <div key={item.zh} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                    {text(locale, item)}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
