import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Bell,
  Building2,
  CreditCard,
  Globe2,
  Layers,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react'
import UserSummaryCard from '@/components/account/UserSummaryCard'
import { useAuth } from '@/hooks/useAuth'
import { patchAuthUser } from '@/state/auth'
import { useToastStore } from '@/store/toastStore'
import { getPlanLabel } from '@/components/account/UserAccountMenu'

type Locale = 'zh' | 'en'
export type SettingsSectionKey = 'profile' | 'assets' | 'organization'

type LocalizedText = {
  zh: string
  en: string
}

type PreferenceState = {
  fullName: string
  avatarUrl: string
  language: Locale
  defaultWorkspace: string
  emailNotifications: boolean
  deliveryNotifications: boolean
  weeklyDigest: boolean
}

const PREFERENCE_STORAGE_KEY = 'ecommerce_user_preferences'

function pick(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

function normalizeSection(pathname: string): SettingsSectionKey {
  if (pathname === '/settings/organization' || pathname === '/org/overview') return 'organization'
  if (pathname === '/settings/personal' || pathname === '/account/assets') return 'assets'
  return 'profile'
}

function loadStoredPreferences(): Partial<PreferenceState> {
  try {
    const raw = localStorage.getItem(PREFERENCE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<PreferenceState>) : {}
  } catch {
    return {}
  }
}

function saveStoredPreferences(next: PreferenceState) {
  localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(next))
}

export default function SettingsWorkbenchPage({ forcedSection }: { forcedSection?: SettingsSectionKey }) {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const { user, credits, access } = useAuth({ refreshOnMount: false })
  const { showToast } = useToastStore()
  const section = forcedSection ?? normalizeSection(pathname)
  const [preferences, setPreferences] = useState<PreferenceState>({
    fullName: user?.full_name || '',
    avatarUrl: user?.avatar_url || '',
    language: locale,
    defaultWorkspace: '/products/workbench/visual-tools/changing-model',
    emailNotifications: true,
    deliveryNotifications: true,
    weeklyDigest: false,
  })

  useEffect(() => {
    const stored = loadStoredPreferences()
    setPreferences(prev => ({
      ...prev,
      fullName: user?.full_name || '',
      avatarUrl: user?.avatar_url || '',
      language: (stored.language as Locale | undefined) || locale,
      defaultWorkspace: stored.defaultWorkspace || '/products/workbench/visual-tools/changing-model',
      emailNotifications: stored.emailNotifications ?? true,
      deliveryNotifications: stored.deliveryNotifications ?? true,
      weeklyDigest: stored.weeklyDigest ?? false,
    }))
  }, [locale, user?.avatar_url, user?.full_name])

  const tabs = useMemo(
    () => [
      {
        key: 'profile' as const,
        to: '/account/profile',
        title: pick(locale, { zh: '账户资料', en: 'Account Profile' }),
        subtitle: pick(locale, { zh: '资料、偏好与安全', en: 'Profile, preferences, and security' }),
        icon: UserCog,
      },
      {
        key: 'assets' as const,
        to: '/account/assets',
        title: pick(locale, { zh: '我的空间', en: 'My Space' }),
        subtitle: pick(locale, { zh: '历史会话、模板、下载与账单', en: 'History, templates, downloads, and billing' }),
        icon: Layers,
      },
      {
        key: 'organization' as const,
        to: '/org/overview',
        title: pick(locale, { zh: '团队管理', en: 'Team Management' }),
        subtitle: pick(locale, { zh: '组织、成员、席位与权限', en: 'Organization, members, seats, and permissions' }),
        icon: Building2,
      },
    ],
    [locale],
  )

  const profileHighlights = [
    {
      icon: Mail,
      title: pick(locale, { zh: '邮箱与身份', en: 'Email and Identity' }),
      desc: pick(locale, { zh: '邮箱作为主要登录身份展示，避免误改造成风险。', en: 'The email address remains the primary sign-in identity to avoid risky changes.' }),
    },
    {
      icon: Bell,
      title: pick(locale, { zh: '通知与交付', en: 'Notifications and Delivery' }),
      desc: pick(locale, { zh: '生成完成、下载交付和团队协作消息可独立控制。', en: 'Completion, delivery, and collaboration messages can be controlled independently.' }),
    },
    {
      icon: ShieldCheck,
      title: pick(locale, { zh: '安全与凭证', en: 'Security and Credentials' }),
      desc: pick(locale, { zh: '密码、二次验证与 API Key 将统一归到此处。', en: 'Passwords, 2FA, and API keys will continue to live in this area.' }),
    },
  ]

  const assetLinks = [
    {
      title: pick(locale, { zh: '历史会话', en: 'Session History' }),
      desc: pick(locale, { zh: '回看最近 AI 对话与任务上下文。', en: 'Review recent AI conversations and task context.' }),
      to: '/aiChat/history',
    },
    {
      title: pick(locale, { zh: '我的模板库', en: 'My Templates' }),
      desc: pick(locale, { zh: '管理私有模板、收藏模板与复用入口。', en: 'Manage private templates, saved templates, and reusable presets.' }),
      to: '/aiChat/myTemplate',
    },
    {
      title: pick(locale, { zh: '下载中心', en: 'Download Center' }),
      desc: pick(locale, { zh: '查看最近交付包、生成结果和导出文件。', en: 'Access recent deliveries, generated assets, and exported files.' }),
      to: '/downloadCenter',
    },
    {
      title: pick(locale, { zh: '订单与额度', en: 'Orders & Credits' }),
      desc: pick(locale, { zh: '查看套餐、账单、权益与剩余额度。', en: 'Review your plan, billing, entitlements, and remaining credits.' }),
      to: '/account/billing',
    },
  ]

  const orgLinks = [
    {
      title: pick(locale, { zh: '组织信息', en: 'Organization Profile' }),
      desc: pick(locale, { zh: '组织名称、角色、当前方案和工作区规则。', en: 'Review organization name, role, plan, and workspace rules.' }),
      value: user?.org_name || (locale === 'zh' ? '个人工作区' : 'Personal workspace'),
    },
    {
      title: pick(locale, { zh: '成员与席位', en: 'Members and Seats' }),
      desc: pick(locale, { zh: '当前先提供团队概览入口，后续承接真实成员管理。', en: 'Currently acts as an overview, with full member management to follow.' }),
      value: locale === 'zh' ? '团队版治理入口' : 'Team governance entry',
    },
    {
      title: pick(locale, { zh: '团队空间', en: 'Team Space' }),
      desc: pick(locale, { zh: '共享模板、共创稿件和跨成员协作入口。', en: 'Shared templates, collaborative drafts, and cross-member workflows.' }),
      value: locale === 'zh' ? '已接团队空间' : 'Connected to team space',
      to: '/draw/team-space',
    },
  ]

  const handleChange = <K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    patchAuthUser({
      full_name: preferences.fullName.trim() || user?.full_name || '',
      avatar_url: preferences.avatarUrl.trim(),
      language_preference: preferences.language,
    })
    saveStoredPreferences(preferences)
    if (preferences.language !== locale) {
      await i18n.changeLanguage(preferences.language)
    }
    showToast(
      pick(locale, { zh: '个人资料与偏好已保存到当前工作区', en: 'Profile and preferences have been saved for the current workspace' }),
      'success',
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>
                  {section === 'profile'
                    ? pick(locale, { zh: '真正可编辑的账户资料中心', en: 'A truly editable account profile center' })
                    : section === 'assets'
                      ? pick(locale, { zh: '我的资产、会话与交付统一收口', en: 'Your assets, sessions, and deliveries in one place' })
                      : pick(locale, { zh: '组织与团队治理入口', en: 'Organization and team governance hub' })}
                </span>
              </div>
              <h1 className="text-3xl font-bold gradient-text">
                {section === 'profile'
                  ? pick(locale, { zh: '账户资料', en: 'Account Profile' })
                  : section === 'assets'
                    ? pick(locale, { zh: '我的空间', en: 'My Space' })
                    : pick(locale, { zh: '团队管理', en: 'Team Management' })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                {section === 'profile'
                  ? pick(locale, { zh: '这里不再只是介绍卡片，而是直接可编辑个人资料、语言偏好、默认工作区与通知设置。', en: 'This page is no longer an overview-only placeholder. You can now edit your personal profile, language preference, default workspace, and notifications directly.' })
                  : section === 'assets'
                    ? pick(locale, { zh: '把历史会话、模板库、下载中心和订单额度统一收口，避免用户在多个工作台之间来回寻找。', en: 'Your history, template library, downloads, and billing now live under one user-center entry so you do not need to hop across unrelated workbenches.' })
                    : pick(locale, { zh: '把组织信息、团队协作与席位治理统一归到团队管理视角，和个人设置彻底拆开。', en: 'Organization profile, collaboration, and seat governance are now grouped under a dedicated team-management lens instead of mixing with personal settings.' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {tabs.map(tab => (
                <Link
                  key={tab.key}
                  to={tab.to}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    section === tab.key
                      ? 'border-brand-500/35 bg-brand-500/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/40">{tab.subtitle}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <UserSummaryCard />

        {section === 'profile' && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="glass rounded-3xl p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{pick(locale, { zh: '编辑个人资料', en: 'Edit Personal Profile' })}</h2>
                  <p className="mt-2 text-sm text-white/45">
                    {pick(locale, { zh: '保存后会立即同步到首页、控制台和工具页的用户入口。', en: 'Saved changes will immediately sync to the home page, console, and tool-entry surfaces.' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
                >
                  <Save className="h-4 w-4" />
                  {pick(locale, { zh: '保存变更', en: 'Save Changes' })}
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-white/60">{pick(locale, { zh: '显示名称', en: 'Display Name' })}</span>
                  <input
                    value={preferences.fullName}
                    onChange={event => handleChange('fullName', event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">{pick(locale, { zh: '邮箱', en: 'Email' })}</span>
                  <input
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/45 outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">{pick(locale, { zh: '头像地址', en: 'Avatar URL' })}</span>
                  <input
                    value={preferences.avatarUrl}
                    onChange={event => handleChange('avatarUrl', event.target.value)}
                    placeholder="https://"
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">{pick(locale, { zh: '默认工作区', en: 'Default Workspace' })}</span>
                  <select
                    value={preferences.defaultWorkspace}
                    onChange={event => handleChange('defaultWorkspace', event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-500/40"
                  >
                    <option value="/products/workbench/visual-tools/changing-model">{pick(locale, { zh: '模特换图', en: 'Model Swap' })}</option>
                    <option value="/aiChat/template">{pick(locale, { zh: '模板市场', en: 'Template Market' })}</option>
                    <option value="/chat">{pick(locale, { zh: 'AI 对话', en: 'AI Chat' })}</option>
                    <option value="/products">{pick(locale, { zh: '商品中心', en: 'Product Center' })}</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">{pick(locale, { zh: '界面语言', en: 'Interface Language' })}</span>
                  <select
                    value={preferences.language}
                    onChange={event => handleChange('language', event.target.value as Locale)}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-brand-500/40"
                  >
                    <option value="zh">简体中文</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="text-sm text-white/60">{pick(locale, { zh: '当前套餐', en: 'Current Plan' })}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{getPlanLabel(user?.plan_id, locale)}</div>
                  <div className="mt-1 text-sm text-white/45">
                    {pick(locale, { zh: '额度余额', en: 'Remaining credits' })}: {credits?.balance ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    key: 'emailNotifications',
                    label: pick(locale, { zh: '系统邮件提醒', en: 'System email alerts' }),
                    value: preferences.emailNotifications,
                  },
                  {
                    key: 'deliveryNotifications',
                    label: pick(locale, { zh: '交付完成提醒', en: 'Delivery completion alerts' }),
                    value: preferences.deliveryNotifications,
                  },
                  {
                    key: 'weeklyDigest',
                    label: pick(locale, { zh: '每周摘要', en: 'Weekly digest' }),
                    value: preferences.weeklyDigest,
                  },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleChange(item.key as keyof PreferenceState, !item.value as never)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      item.value
                        ? 'border-brand-500/30 bg-brand-500/10 text-white'
                        : 'border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="mt-2 text-xs text-white/45">
                      {item.value
                        ? pick(locale, { zh: '已开启', en: 'Enabled' })
                        : pick(locale, { zh: '已关闭', en: 'Disabled' })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              {profileHighlights.map(item => (
                <div key={item.title} className="glass rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-white/45">{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </aside>
          </section>
        )}

        {section === 'assets' && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-4 md:grid-cols-2">
              {assetLinks.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="glass rounded-2xl p-5 transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-white/45">{item.desc}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/30" />
                  </div>
                </Link>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-medium text-white/75">{pick(locale, { zh: '我的空间速览', en: 'My Space Snapshot' })}</div>
                <div className="mt-4 space-y-3">
                  {[
                    { label: pick(locale, { zh: '剩余额度', en: 'Remaining credits' }), value: `${credits?.balance ?? 0}` },
                    { label: pick(locale, { zh: '当前方案', en: 'Current plan' }), value: getPlanLabel(user?.plan_id, locale) },
                    { label: pick(locale, { zh: '权限角色', en: 'Primary role' }), value: access?.product_roles?.[0] || user?.org_role || '-' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/30">{item.label}</div>
                      <div className="mt-2 text-sm font-medium text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-medium text-white/75">{pick(locale, { zh: '推荐动作', en: 'Suggested next steps' })}</div>
                <div className="mt-3 space-y-3 text-sm text-white/50">
                  <p>{pick(locale, { zh: '从模板市场复制一套模板到我的模板库。', en: 'Copy a template from the marketplace into your own library.' })}</p>
                  <p>{pick(locale, { zh: '回到历史会话复用最近一次高质量输出。', en: 'Reuse a recent high-performing result from session history.' })}</p>
                  <p>{pick(locale, { zh: '去下载中心统一收取最近交付结果。', en: 'Collect your latest delivery packages from the download center.' })}</p>
                </div>
              </div>
            </aside>
          </section>
        )}

        {section === 'organization' && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {orgLinks.map(item => (
                <div key={item.title} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-white/45">{item.desc}</div>
                      <div className="mt-3 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                        {item.value}
                      </div>
                    </div>
                    {item.to ? (
                      <Link to={item.to} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white">
                        {pick(locale, { zh: '进入', en: 'Open' })}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-medium text-white/75">{pick(locale, { zh: '团队治理能力', en: 'Team Governance Stack' })}</div>
                <div className="mt-4 space-y-3">
                  {[
                    { icon: Users, title: pick(locale, { zh: '成员与角色', en: 'Members and Roles' }), desc: pick(locale, { zh: '未来承接成员邀请、角色授权与访问控制。', en: 'Will later handle invitations, roles, and access control.' }) },
                    { icon: CreditCard, title: pick(locale, { zh: '席位与账单', en: 'Seats and Billing' }), desc: pick(locale, { zh: '团队版方案、席位扩容和组织账单。', en: 'Team plans, seat expansion, and organization billing.' }) },
                    { icon: Globe2, title: pick(locale, { zh: '组织规则', en: 'Organization Rules' }), desc: pick(locale, { zh: '统一语言、品牌和默认工作区策略。', en: 'Shared language, brand, and default-workspace policies.' }) },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-brand-500/10 p-2 text-brand-300">
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
        )}
      </div>
    </div>
  )
}
