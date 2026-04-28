import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Coins, CreditCard, Download, History, LayoutDashboard, Layers, Settings2, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { getWorkbenchEntryPath } from '@/utils/authNavigation'
import { Z_INDEX } from '@/styles/zIndex'

export default function AccountLayout() {
  const { t } = useTranslation()

  const navItems = [
    { to: '/account/profile', label: t('account.layout.nav.profile.label'), icon: Settings2 },
    { to: '/account/assets', label: t('account.layout.nav.overview.label'), icon: LayoutDashboard },
    { to: '/account/history', label: t('account.layout.nav.history.label'), icon: History },
    { to: '/account/templates', label: t('account.layout.nav.templates.label'), icon: Layers },
    { to: '/account/billing', label: t('account.layout.nav.billing.label'), icon: CreditCard },
    { to: '/account/promotion', label: t('account.layout.nav.promotion.label'), icon: Share2 },
    { to: '/account/commission', label: t('account.layout.nav.commission.label'), icon: Coins },
    { to: '/account/downloads', label: t('account.layout.nav.downloads.label'), icon: Download },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-50 font-sans selection:bg-brand-500/30 selection:text-brand-50">
      <header className={`sticky top-0 ${Z_INDEX.stickyHeader} border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-xl shadow-[0_4px_24px_-12px_rgba(0,0,0,0.5)]`}>
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={getWorkbenchEntryPath()}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              {t('account.common.actions.backToWorkspace')}
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="text-sm font-semibold text-slate-100">{t('account.layout.title')}</div>
          </div>
          <UserAccountMenu />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8 lg:py-12">
        <aside className="w-full shrink-0 lg:w-56">
          <nav className="sticky top-24 space-y-1">
            <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('account.layout.navigation')}
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
              {navItems.map(item => (
                <motion.div key={item.to} variants={itemVariants}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ring-1 ring-brand-500/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:shadow-sm'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
            </motion.div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
