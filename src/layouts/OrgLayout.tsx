import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Building2, CreditCard, ShieldCheck, Users } from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import UserSummaryCard from '@/components/account/UserSummaryCard'
import { getWorkbenchEntryPath } from '@/utils/authNavigation'
import { Z_INDEX } from '@/styles/zIndex'

export default function OrgLayout() {
  const { t } = useTranslation()

  const navItems = [
    {
      to: '/org/overview',
      label: t('org.layout.nav.overview.label'),
      meta: t('org.layout.nav.overview.meta'),
      icon: Building2,
    },
  ]

  const capabilityCards = [
    {
      icon: Users,
      title: t('org.layout.cards.members.title'),
      desc: t('org.layout.cards.members.desc'),
    },
    {
      icon: CreditCard,
      title: t('org.layout.cards.billing.title'),
      desc: t('org.layout.cards.billing.desc'),
    },
    {
      icon: ShieldCheck,
      title: t('org.layout.cards.policies.title'),
      desc: t('org.layout.cards.policies.desc'),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--ecom-bg)] text-white">
      <div className={`fixed inset-x-0 top-0 ${Z_INDEX.portalNav} border-b border-white/[0.08] bg-[var(--ecom-header-bg)] backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              to={getWorkbenchEntryPath()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/65 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('account.common.actions.backToWorkspace')}
            </Link>
            <div>
              <div className="text-sm font-semibold gradient-text">{t('org.layout.title')}</div>
              <div className="text-xs text-white/40">
                {t('org.layout.subtitle')}
              </div>
            </div>
          </div>
          <UserAccountMenu />
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-10 pt-28 sm:px-6">
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-28 space-y-4">
            <UserSummaryCard />
            <div className="glass rounded-3xl p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/30">
                {t('org.layout.navigation')}
              </div>
              <div className="space-y-2">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-2xl border px-4 py-3 transition-colors ${
                        isActive
                          ? 'border-brand-500/35 bg-brand-500/10'
                          : 'border-white/[0.06] bg-white/[0.03] hover:bg-[var(--ecom-surface-hover)]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/[0.04] p-2 text-white/65">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.label}</div>
                        <div className="mt-1 text-xs text-white/40">{item.meta}</div>
                      </div>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/30">
                {t('org.layout.capabilities')}
              </div>
              <div className="space-y-3">
                {capabilityCards.map(item => (
                  <div key={item.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-brand-500/10 p-2 text-brand-300">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs leading-5 text-white/40">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
