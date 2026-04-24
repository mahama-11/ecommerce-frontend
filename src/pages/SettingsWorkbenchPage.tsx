import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Bell, Building2, CreditCard, KeyRound, ShieldCheck, Sparkles, UserCog, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

interface SettingsConfig {
  titleKey: string
  icon: LucideIcon
  badge: LocalizedText
  subtitle: LocalizedText
  stats: Array<{ value: string; label: LocalizedText }>
  panels: Array<{ title: LocalizedText; desc: LocalizedText; action: LocalizedText }>
  related: Array<{ label: LocalizedText; to: string }>
}

const CONFIG_MAP: Record<string, SettingsConfig> = {
  '/settings/profile': {
    titleKey: 'pages.settingsProfile',
    icon: UserCog,
    badge: { zh: '账号偏好与安全', en: 'Account Preferences and Security' },
    subtitle: {
      zh: '管理个人资料、通知偏好、登录安全与 API Key，是个人使用层的基础入口。',
      en: 'Manage profile details, notification preferences, sign-in security, and API keys as the personal settings entry.',
    },
    stats: [
      { value: '2', label: { zh: '登录方式', en: 'Sign-in Methods' } },
      { value: '3', label: { zh: '通知渠道', en: 'Notification Channels' } },
      { value: '4', label: { zh: 'API Keys', en: 'API Keys' } },
    ],
    panels: [
      {
        title: { zh: '资料与头像', en: 'Profile and Avatar' },
        desc: { zh: '维护昵称、头像、语言偏好和默认工作区。', en: 'Maintain display name, avatar, language preference, and default workspace.' },
        action: { zh: '编辑资料', en: 'Edit Profile' },
      },
      {
        title: { zh: '安全与登录', en: 'Security and Sign-in' },
        desc: { zh: '管理密码、双重验证、登录设备和安全提醒。', en: 'Manage password, 2FA, login devices, and security alerts.' },
        action: { zh: '查看安全项', en: 'Review Security' },
      },
      {
        title: { zh: '通知与偏好', en: 'Notifications and Preferences' },
        desc: { zh: '设置任务完成、下载交付和团队协作的通知方式。', en: 'Configure alerts for task completion, delivery, and team collaboration.' },
        action: { zh: '调整通知', en: 'Adjust Notifications' },
      },
    ],
    related: [
      { label: { zh: '个人管理', en: 'Personal Center' }, to: '/settings/personal' },
      { label: { zh: '组织管理', en: 'Organization Management' }, to: '/settings/organization' },
    ],
  },
  '/settings/personal': {
    titleKey: 'pages.settingsPersonal',
    icon: ShieldCheck,
    badge: { zh: '个人资产与权限视图', en: 'Personal Assets and Access View' },
    subtitle: {
      zh: '集中查看个人模板、下载记录、订单权益和 API 调用配额，是个人管理层的总览页。',
      en: 'Review personal templates, downloads, order entitlements, and API quotas in one personal-management overview.',
    },
    stats: [
      { value: '19', label: { zh: '我的模板', en: 'My Templates' } },
      { value: '7', label: { zh: '可用权益', en: 'Active Entitlements' } },
      { value: '5.8k', label: { zh: '本月调用', en: 'Monthly Calls' } },
    ],
    panels: [
      {
        title: { zh: '个人资产总览', en: 'Personal Asset Overview' },
        desc: { zh: '统一查看模板、设计稿、交付包和下载记录。', en: 'Review templates, design drafts, delivery bundles, and download records in one place.' },
        action: { zh: '打开资产视图', en: 'Open Asset View' },
      },
      {
        title: { zh: '额度与权益', en: 'Quotas and Entitlements' },
        desc: { zh: '查看套餐、加油包、剩余额度和使用曲线。', en: 'Inspect plans, credit packs, remaining quotas, and usage trends.' },
        action: { zh: '查看权益', en: 'View Entitlements' },
      },
      {
        title: { zh: '调用与 API Key', en: 'Usage and API Keys' },
        desc: { zh: '查看 API 调用趋势、Key 状态和异常请求。', en: 'Inspect API usage trends, key status, and anomalous requests.' },
        action: { zh: '管理 Key', en: 'Manage Keys' },
      },
    ],
    related: [
      { label: { zh: '个人设置', en: 'Profile Settings' }, to: '/settings/profile' },
      { label: { zh: '订单列表', en: 'Order List' }, to: '/orderList' },
    ],
  },
  '/settings/organization': {
    titleKey: 'pages.settingsOrganization',
    icon: Building2,
    badge: { zh: '组织与团队治理', en: 'Organization and Team Governance' },
    subtitle: {
      zh: '管理组织信息、成员、角色权限、席位和账单，是团队版的治理入口。',
      en: 'Manage org profile, members, roles, seats, and billing as the team-governance hub.',
    },
    stats: [
      { value: '12', label: { zh: '成员', en: 'Members' } },
      { value: '4', label: { zh: '角色', en: 'Roles' } },
      { value: '3', label: { zh: '组织工作区', en: 'Workspaces' } },
    ],
    panels: [
      {
        title: { zh: '组织信息', en: 'Organization Profile' },
        desc: { zh: '维护组织名称、行业、默认品牌和工作区规则。', en: 'Maintain org name, industry, default brand, and workspace rules.' },
        action: { zh: '编辑组织信息', en: 'Edit Organization' },
      },
      {
        title: { zh: '成员与角色', en: 'Members and Roles' },
        desc: { zh: '查看成员、邀请新成员，并按角色分配权限。', en: 'Review members, invite teammates, and assign access by role.' },
        action: { zh: '管理成员', en: 'Manage Members' },
      },
      {
        title: { zh: '席位与账单', en: 'Seats and Billing' },
        desc: { zh: '管理团队席位、订阅、发票和组织级使用量。', en: 'Manage seats, subscriptions, invoices, and org-level usage.' },
        action: { zh: '查看账单', en: 'Review Billing' },
      },
    ],
    related: [
      { label: { zh: '团队空间', en: 'Team Space' }, to: '/draw/team-space' },
      { label: { zh: '个人设置', en: 'Profile Settings' }, to: '/settings/profile' },
    ],
  },
}

function pick(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

export default function SettingsWorkbenchPage() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const config = CONFIG_MAP[pathname] ?? CONFIG_MAP['/settings/profile']
  const Icon = config.icon
  const [activePanel, setActivePanel] = useState(0)

  const sideCards = useMemo(
    () => [
      {
        icon: Bell,
        title: pick(locale, { zh: '通知与提醒', en: 'Notifications and Alerts' }),
        desc: pick(locale, { zh: '任务、交付、协作等消息统一接收。', en: 'Receive task, delivery, and collaboration events in one place.' }),
      },
      {
        icon: KeyRound,
        title: pick(locale, { zh: '安全与密钥', en: 'Security and Keys' }),
        desc: pick(locale, { zh: '适合承接密码、API Key、双重验证。', en: 'Ready for passwords, API keys, and 2FA settings.' }),
      },
      {
        icon: CreditCard,
        title: pick(locale, { zh: '计费与权益', en: 'Billing and Entitlements' }),
        desc: pick(locale, { zh: '适合承接套餐、席位、发票与额度。', en: 'Ready for plans, seats, invoices, and quotas.' }),
      },
      {
        icon: Users,
        title: pick(locale, { zh: '成员与组织', en: 'Members and Organization' }),
        desc: pick(locale, { zh: '适合承接成员、角色与组织规则。', en: 'Ready for members, roles, and organization policies.' }),
      },
    ],
    [locale],
  )

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
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">{t(config.titleKey)}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick(locale, config.subtitle)}</p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
              {config.related.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white sm:w-auto"
                >
                  <span>{pick(locale, item.label)}</span>
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {config.panels.map((panel, index) => (
              <article
                key={panel.title.zh}
                className={`tool-card glass rounded-2xl p-5 transition-all ${
                  activePanel === index ? 'border-brand-500/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pick(locale, panel.title)}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{pick(locale, panel.desc)}</p>
                  </div>
                  <button
                    onClick={() => setActivePanel(index)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {pick(locale, panel.action)}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '当前选中模块' : 'Selected Module'}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="text-base font-semibold text-white">{pick(locale, config.panels[activePanel].title)}</div>
                <div className="mt-3 text-sm leading-6 text-white/50">{pick(locale, config.panels[activePanel].desc)}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '管理能力清单' : 'Management Capability Stack'}
              </div>
              <div className="space-y-3">
                {sideCards.map(item => (
                  <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-brand-500/10 p-2 text-brand-300">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-white/45">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
