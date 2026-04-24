import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Headphones, Mail, MessageSquare, Sparkles } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const CONTACT_TYPES = [
  {
    key: 'sales',
    icon: Building2,
    title: { zh: '销售咨询', en: 'Sales Inquiry' },
    desc: { zh: '企业采购、团队席位、私有化和 API 套餐咨询。', en: 'Enterprise procurement, team seats, private deployment, and API package inquiries.' },
  },
  {
    key: 'support',
    icon: Headphones,
    title: { zh: '使用支持', en: 'Product Support' },
    desc: { zh: '账号、订单、下载和任务异常相关支持。', en: 'Support for accounts, orders, downloads, and task issues.' },
  },
  {
    key: 'partnership',
    icon: MessageSquare,
    title: { zh: '合作申请', en: 'Partnership Request' },
    desc: { zh: '渠道合作、联合推广和生态集成沟通。', en: 'Channel partnerships, co-marketing, and ecosystem integration discussions.' },
  },
] as const

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const [activeType, setActiveType] = useState<(typeof CONTACT_TYPES)[number]['key']>('sales')
  const active = CONTACT_TYPES.find(item => item.key === activeType) ?? CONTACT_TYPES[0]

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '销售 / 支持 / 合作入口' : 'Sales / Support / Partnership Entry'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.contactUs')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '把销售咨询、问题反馈和合作沟通统一放进一个工程化入口，后续可以继续接线索分发、工单系统和企业 Demo 预约。',
              en: 'Unify sales inquiries, issue reporting, and partnership communication in one engineering-ready entry that can later connect to lead routing, ticketing, and enterprise demo booking.',
            })}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {CONTACT_TYPES.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveType(item.key)}
              className={`rounded-2xl border p-6 text-left transition-colors ${
                activeType === item.key
                  ? 'border-brand-500/25 bg-brand-500/10'
                  : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]'
              }`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <item.icon className="h-5 w-5 text-brand-400" />
              </div>
              <div className="text-lg font-semibold text-white">{text(locale, item.title)}</div>
              <div className="mt-3 text-sm leading-6 text-white/55">{text(locale, item.desc)}</div>
            </button>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 text-sm font-medium text-white/75">
              {locale === 'zh' ? '沟通表单骨架' : 'Conversation Form Skeleton'}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                readOnly
                value={locale === 'zh' ? '你的姓名' : 'Your Name'}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45 outline-none"
              />
              <input
                readOnly
                value={locale === 'zh' ? '公司 / 团队名' : 'Company / Team'}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45 outline-none"
              />
              <input
                readOnly
                value={locale === 'zh' ? '联系邮箱' : 'Contact Email'}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45 outline-none"
              />
              <input
                readOnly
                value={text(locale, active.title)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45 outline-none"
              />
              <textarea
                readOnly
                value={locale === 'zh' ? '请描述你的需求、遇到的问题或合作方向...' : 'Describe your request, issue, or partnership direction...'}
                className="min-h-36 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/45 outline-none sm:col-span-2"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
                <span>{locale === 'zh' ? '模拟提交线索' : 'Submit Mock Inquiry'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/pricing" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
                <span>{locale === 'zh' ? '先看定价' : 'View Pricing First'}</span>
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <Mail className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '当前选中咨询类型' : 'Current Inquiry Type'}</span>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="text-base font-semibold text-white">{text(locale, active.title)}</div>
                <div className="mt-2 text-sm leading-6 text-white/50">{text(locale, active.desc)}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '下一步可接能力' : 'Next-step Integrations'}
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? 'CRM / 线索分发' : 'CRM / lead routing'}</div>
                <div>{locale === 'zh' ? '工单状态跟踪' : 'Ticket state tracking'}</div>
                <div>{locale === 'zh' ? '企业 Demo 预约' : 'Enterprise demo booking'}</div>
                <div>{locale === 'zh' ? '邮件通知与 SLA' : 'Email notifications and SLA'}</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
