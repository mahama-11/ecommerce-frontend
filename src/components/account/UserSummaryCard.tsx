import { Building2, CreditCard, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPlanLabelByT, resolveAppLocale } from '@/i18n/helpers'
import { useAuth } from '@/hooks/useAuth'
import { getUserDisplayName } from '@/components/account/UserAccountMenu'

export default function UserSummaryCard({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language)
  const { user, credits, access } = useAuth({ refreshOnMount: false })

  if (!user) return null

  const items = [
    {
      icon: Building2,
      label: t('account.summaryCard.organization'),
      value: user.org_name || t('account.userMenu.personalWorkspace'),
    },
    {
      icon: CreditCard,
      label: t('account.billing.stats.remainingCredits'),
      value: `${credits?.balance ?? 0}`,
    },
    {
      icon: Shield,
      label: t('account.summaryCard.role'),
      value: access?.product_roles?.[0] || user.org_role || t('account.userMenu.roleFallback'),
    },
  ]

  return (
    <div className={`glass rounded-2xl border border-white/[0.08] p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-500/20 bg-brand-500/15 text-sm font-semibold text-brand-200">
          {getUserDisplayName(user, locale).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{getUserDisplayName(user, locale)}</div>
          <div className="truncate text-xs text-white/45">{getPlanLabelByT(t, user.plan_id)}</div>
        </div>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {items.map(item => (
          <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/30">
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </div>
            <div className="mt-2 truncate text-sm font-medium text-white/80">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
