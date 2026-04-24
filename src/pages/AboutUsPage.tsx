import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Layers, Radar, ShieldCheck, Sparkles, Users } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const VALUES = [
  {
    icon: Radar,
    title: { zh: '聚焦可落地能力', en: 'Focus on shippable capabilities' },
    desc: {
      zh: '优先做卖家每天都能真正使用的视觉生产、运营协作和资料沉淀能力。',
      en: 'Prioritize visual production, operator collaboration, and asset workflows sellers can use every day.',
    },
  },
  {
    icon: ShieldCheck,
    title: { zh: '强调可控与一致性', en: 'Control and consistency first' },
    desc: {
      zh: '品牌规则、敏感词、模板资产和任务状态都需要被统一管理，而不是散落在对话里。',
      en: 'Brand rules, sensitive terms, template assets, and task states should be managed centrally, not scattered across chats.',
    },
  },
  {
    icon: Users,
    title: { zh: '服务团队协作', en: 'Built for team collaboration' },
    desc: {
      zh: '产品不只服务个人体验，也为团队模板、共享资料、下载交付和商业化路径预埋结构。',
      en: 'The product serves not only individuals, but also team templates, shared assets, downloads, and commercialization flows.',
    },
  },
] as const

const MILESTONES = [
  {
    step: '01',
    title: { zh: '视觉骨架先行', en: 'Visual skeleton first' },
    desc: { zh: '先把门户、工作台和主链路页面做成完整可演示外壳。', en: 'First deliver complete demo-ready shells for the portal, workbenches, and key flows.' },
  },
  {
    step: '02',
    title: { zh: '基础能力补齐', en: 'Fill in foundational capabilities' },
    desc: { zh: '补上传、状态流、模板资产、交付队列和订单流等基础模块。', en: 'Add uploads, state flows, template assets, delivery queues, and order flows.' },
  },
  {
    step: '03',
    title: { zh: '业务链路打通', en: 'Connect end-to-end workflows' },
    desc: { zh: '把生成、运营、资料库和商业系统真正串起来。', en: 'Connect generation, operations, asset libraries, and commercial systems into one flow.' },
  },
] as const

export default function AboutUsPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="glow-orb h-[320px] w-[320px] bg-brand-500/12 -right-20 -top-20" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>{locale === 'zh' ? '品牌与能力地图' : 'Brand and Capability Map'}</span>
              </div>
              <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.aboutUs')}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
                {text(locale, {
                  zh: 'Agent Ecommerce 正在构建一个面向跨境电商的 AI 工作系统，把视觉生成、智能运营、资料治理和商业交付串成一条完整生产线。',
                  en: 'Agent Ecommerce is building an AI operating system for cross-border commerce, connecting visual generation, intelligent operations, asset governance, and commercial delivery into one production line.',
                })}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/pricing" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
                  <span>{locale === 'zh' ? '查看方案' : 'View Plans'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
                  <span>{locale === 'zh' ? '联系团队' : 'Contact Team'}</span>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { value: '3', label: { zh: '产品主线', en: 'Core Product Lines' } },
                { value: '18+', label: { zh: 'AI 工具入口', en: 'AI Tool Entries' } },
                { value: '1', label: { zh: '统一工作流', en: 'Unified Workflow' } },
              ].map(item => (
                <div key={item.value} className="glass rounded-2xl p-5">
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="mt-1 text-sm text-white/45">{text(locale, item.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {VALUES.map(item => (
            <article key={item.title.zh} className="glass rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <item.icon className="h-5 w-5 text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{text(locale, item.title)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{text(locale, item.desc)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/75">
              <Layers className="h-4 w-4 text-brand-400" />
              <span>{locale === 'zh' ? '能力结构' : 'Capability Structure'}</span>
            </div>
            <div className="space-y-3">
              {[
                { title: { zh: 'AI 视觉生成', en: 'AI Visual Generation' }, desc: { zh: '模特图、商品图、设计器、视频', en: 'Model images, product images, designer, and video' } },
                { title: { zh: 'AI 智能运营', en: 'AI Smart Operations' }, desc: { zh: '对话、模板、批量 Listing、分析', en: 'Chat, templates, batch listing, and analysis' } },
                { title: { zh: '数据资料库', en: 'Data Libraries' }, desc: { zh: '知识库、品牌库、素材库、规则库', en: 'Knowledge, brand, asset, and rule libraries' } },
              ].map(item => (
                <div key={item.title.zh} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <div className="text-sm font-medium text-white">{text(locale, item.title)}</div>
                  <div className="mt-1 text-xs text-white/40">{text(locale, item.desc)}</div>
                </div>
              ))}
            </div>
          </aside>

          <div className="glass rounded-2xl p-6">
            <div className="mb-5 text-sm font-medium text-white/75">
              {locale === 'zh' ? '当前落地路径' : 'Current Delivery Path'}
            </div>
            <div className="space-y-4">
              {MILESTONES.map(item => (
                <div key={item.step} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <div className="text-xs tracking-[0.24em] text-brand-300">{item.step}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{text(locale, item.title)}</div>
                  <div className="mt-2 text-sm leading-6 text-white/50">{text(locale, item.desc)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
