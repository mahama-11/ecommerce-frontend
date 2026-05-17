import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Coins, CreditCard, Globe2, ShieldCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPlanLabelByT } from '@/i18n/helpers'
import { useAuth } from '@/hooks/useAuth'
import { commercialService } from '@/services/commercial'
import type { ChannelOverview, CommissionOverview } from '@/types/commercial'

export default function OrgOverviewPage() {
  const { t } = useTranslation()
  const { user, credits, access } = useAuth({ refreshOnMount: false })
  const creditBalance = (credits as { balance?: number } | undefined)?.balance ?? 0
  const [commissionOverview, setCommissionOverview] = useState<CommissionOverview | null>(null)
  const [channelOverview, setChannelOverview] = useState<ChannelOverview | null>(null)

  useEffect(() => {
    void Promise.all([commercialService.getCommissionOverview(), commercialService.getChannelOverview()]).then(([commission, channel]) => {
      setCommissionOverview(commission)
      setChannelOverview(channel)
    })
  }, [])

  const governanceCards = [
    {
      icon: Building2,
      title: t('org.overview.cards.profile.title'),
      desc: t('org.overview.cards.profile.desc'),
      value: user?.org_name || t('account.userMenu.personalWorkspace'),
    },
    {
      icon: Users,
      title: t('org.overview.cards.members.title'),
      desc: t('org.overview.cards.members.desc'),
      value: access?.product_roles?.[0] || user?.org_role || t('account.userMenu.roleFallback'),
    },
    {
      icon: CreditCard,
      title: t('org.overview.cards.billing.title'),
      desc: t('org.overview.cards.billing.desc'),
      value: `${getPlanLabelByT(t, user?.plan_id)} · ${creditBalance}`,
    },
    {
      icon: Coins,
      title: t('org.overview.cards.growth.title'),
      desc: t('org.overview.cards.growth.desc'),
      value: `${commissionOverview?.redeemable_commission ?? 0} · ${channelOverview?.settlement_count ?? 0}`,
    },
    {
      icon: Globe2,
      title: t('org.overview.cards.policy.title'),
      desc: t('org.overview.cards.policy.desc'),
      value: t('org.overview.values.policyEntry'),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-3xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('org.overview.badge')}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {t('org.overview.title')}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              {t('org.overview.subtitle')}
            </p>
          </div>
          <Link
            to="/account/commission"
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          >
            <Coins className="h-4 w-4" />
            {t('org.overview.openCommission')}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {governanceCards.map(item => (
          <article key={item.title} className="glass rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-white/45">{item.desc}</div>
                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/85">
                  {item.value}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
