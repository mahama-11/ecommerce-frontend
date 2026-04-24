import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FileText, ShieldAlert, Sparkles, WalletCards } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const MODULES = [
  {
    icon: FileText,
    title: { zh: '账户与使用规则', en: 'Account and Usage Rules' },
    desc: { zh: '约束账号、团队成员和平台使用边界。', en: 'Define account, team-member, and platform-usage boundaries.' },
  },
  {
    icon: WalletCards,
    title: { zh: '订阅与付费条款', en: 'Subscription and Billing Terms' },
    desc: { zh: '说明套餐、加油包、到期、退款和权益生效逻辑。', en: 'Cover plans, credit packs, expiry, refunds, and entitlement activation logic.' },
  },
  {
    icon: ShieldAlert,
    title: { zh: '生成内容与免责', en: 'Generated Content and Disclaimers' },
    desc: { zh: '界定生成内容、商用限制、平台风险和责任边界。', en: 'Clarify generated content, commercial usage limits, platform risks, and liability boundaries.' },
  },
] as const

export default function TermsPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '服务规则文档容器' : 'Terms and Rules Container'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.termsOfService')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '服务条款页当前先完成章节模块化和规则边界设计，后续可继续填入账户、订阅、生成内容和免责条款的真实正文。',
              en: 'The terms page currently focuses on modular structure and rule boundaries, ready for real clauses covering accounts, subscriptions, generated content, and disclaimers later.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/privacy" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '查看隐私政策' : 'Open Privacy Policy'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              <span>{locale === 'zh' ? '查看定价' : 'View Pricing'}</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {MODULES.map(item => (
            <article key={item.title.zh} className="glass rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <item.icon className="h-5 w-5 text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{text(locale, item.title)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{text(locale, item.desc)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 text-sm font-medium text-white/75">
              {locale === 'zh' ? '首批条款模块' : 'Initial Terms Modules'}
            </div>
            <div className="space-y-3">
              {[
                locale === 'zh' ? '账户注册、登录与团队权限' : 'Account registration, login, and team access',
                locale === 'zh' ? '订阅、计费、退款与权益' : 'Subscriptions, billing, refunds, and entitlements',
                locale === 'zh' ? '生成内容使用边界与平台风险' : 'Generated-content usage boundaries and platform risks',
                locale === 'zh' ? '免责、限制责任与争议处理' : 'Disclaimers, liability limits, and dispute handling',
              ].map(item => (
                <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium text-white/75">
              {locale === 'zh' ? '联动页面' : 'Related Pages'}
            </div>
            <div className="space-y-3">
              {[
                { label: { zh: '隐私政策', en: 'Privacy Policy' }, to: '/privacy' },
                { label: { zh: '联系我们', en: 'Contact Us' }, to: '/contact' },
                { label: { zh: '更新日志', en: 'Changelog' }, to: '/changelog' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                  {text(locale, item.label)}
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
