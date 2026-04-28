import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPlanLabelByT, resolveAppLocale } from '@/i18n/helpers'
import { useAuth } from '@/hooks/useAuth'
import { patchAuthUser } from '@/state/auth'
import { useToastStore } from '@/store/toastStore'

import { motion } from 'framer-motion'

type Locale = 'zh' | 'en'
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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

export default function AccountProfilePage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language)
  const { user, credits } = useAuth({ refreshOnMount: false })
  const { showToast } = useToastStore()
  const [state, setState] = useState<PreferenceState>({
    fullName: user?.full_name || '',
    avatarUrl: user?.avatar_url || '',
    language: locale,
    defaultWorkspace: '/draw/changing-model',
    emailNotifications: true,
    deliveryNotifications: true,
    weeklyDigest: false,
  })

  useEffect(() => {
    const stored = loadStoredPreferences()
    setState({
      fullName: user?.full_name || '',
      avatarUrl: user?.avatar_url || '',
      language: (stored.language as Locale | undefined) || locale,
      defaultWorkspace: stored.defaultWorkspace || '/draw/changing-model',
      emailNotifications: stored.emailNotifications ?? true,
      deliveryNotifications: stored.deliveryNotifications ?? true,
      weeklyDigest: stored.weeklyDigest ?? false,
    })
  }, [locale, user?.avatar_url, user?.full_name])

  const setField = <K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    patchAuthUser({
      full_name: state.fullName.trim() || user?.full_name || '',
      avatar_url: state.avatarUrl.trim(),
      language_preference: state.language,
    })
    saveStoredPreferences(state)
    if (state.language !== locale) {
      await i18n.changeLanguage(state.language)
    }
    showToast(t('account.profile.toast.saved'), 'success')
  }

  const switches = [
    { key: 'emailNotifications', label: t('account.profile.notifications.systemMail') },
    { key: 'deliveryNotifications', label: t('account.profile.notifications.delivery') },
    { key: 'weeklyDigest', label: t('account.profile.notifications.weeklyDigest') },
  ] as const

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.profile.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('account.profile.subtitle')}</p>
      </motion.div>

      <div className="space-y-6">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-all hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{t('account.profile.plan.current')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {getPlanLabelByT(t, user?.plan_id)} &middot; {t('account.profile.plan.remainingCredits')}: {credits?.balance ?? 0}
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">{t('account.profile.details.displayName')}</span>
                <input
                  value={state.fullName}
                  onChange={event => setField('fullName', event.target.value)}
                  className="w-full rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-zinc-500 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                />
              </label>
              
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">{t('common.email')}</span>
                <input
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </label>
              
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">{t('account.profile.details.avatarUrl')}</span>
                <input
                  value={state.avatarUrl}
                  onChange={event => setField('avatarUrl', event.target.value)}
                  placeholder="https://"
                  className="w-full rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-zinc-500 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">{t('account.profile.details.defaultWorkspace')}</span>
                <select
                  value={state.defaultWorkspace}
                  onChange={event => setField('defaultWorkspace', event.target.value)}
                  className="w-full rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                >
                  <option value="/draw/changing-model">{t('account.profile.details.modelSwap')}</option>
                  <option value="/aiChat/template">{t('account.profile.details.templateMarket')}</option>
                  <option value="/chat">{t('account.profile.details.aiChat')}</option>
                  <option value="/draw/product-home">{t('account.profile.details.productCenter')}</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">{t('account.profile.details.interfaceLanguage')}</span>
                <select
                  value={state.language}
                  onChange={event => setField('language', event.target.value as Locale)}
                  className="w-full rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                >
                  <option value="zh">简体中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-end border-t border-white/5 bg-white/[0.01] px-6 py-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              className="inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              {t('account.profile.details.save')}
            </button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-all hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{t('account.profile.notifications.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">Manage your email and delivery notifications.</p>
          </div>
          <div className="divide-y divide-white/5">
            {switches.map(item => {
              const value = state[item.key]
              return (
                <motion.div variants={itemVariants} key={item.key} className="flex items-center justify-between px-6 py-5">
                  <div>
                    <div className="font-medium text-slate-200">{item.label}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {value ? t('account.profile.notifications.enabled') : t('account.profile.notifications.disabled')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setField(item.key, !value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                      value ? 'btn-primary' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
