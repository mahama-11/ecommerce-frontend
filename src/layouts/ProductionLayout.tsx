import { Link, NavLink, Outlet, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Beaker,
  BrainCircuit,
  Layers,
  Globe,
  LogIn,
} from 'lucide-react'
import { useMemo } from 'react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'

type ProductionNavItem = {
  labelKey: string
  to: string
  icon: typeof BrainCircuit
  match: (pathname: string) => boolean
}

const buildNavItems = (productId: string): ProductionNavItem[] => [
  {
    labelKey: 'production.nav.prep',
    to: `/products/${productId}/production/prep`,
    icon: BrainCircuit,
    match: (p) => p === `/products/${productId}/production/prep`,
  },
  {
    labelKey: 'production.nav.sandbox',
    to: `/products/${productId}/production/sandbox`,
    icon: Beaker,
    match: (p) => p === `/products/${productId}/production/sandbox`,
  },
  {
    labelKey: 'production.nav.workshop',
    to: `/products/${productId}/production/workshop`,
    icon: Layers,
    match: (p) => p === `/products/${productId}/production/workshop`,
  },
]

export default function ProductionLayout() {
  const { id } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const loginPath = getAuthAwareLoginPath(isAuthenticated)

  const navItems = useMemo(() => buildNavItems(id ?? ''), [id])
  const languageLabel = useMemo(
    () => (i18n.language === 'zh' ? '中' : 'EN'),
    [i18n.language],
  )

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e8eaf0]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080b11]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1440px] items-center justify-between gap-4 px-5">
          {/* Left: Back + Product label + Step nav */}
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/48 transition hover:bg-white/[0.04] hover:text-white/82"
              title={t('production.backToProducts')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t('productCenter.shell.home')}
              </span>
            </Link>

            <div className="h-4 w-px bg-white/10" />

            <Link
              to="/products"
              className="whitespace-nowrap font-semibold tracking-tight text-white"
            >
              Product Center
            </Link>

            <span className="text-white/30">/</span>
            <span className="max-w-[120px] truncate text-xs text-white/50">
              #{id}
            </span>

            {/* Step navigation */}
            <nav className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
              {navItems.map((item, idx) => {
                const active = item.match(pathname)
                const Icon = item.icon
                return (
                  <div key={item.labelKey} className="flex items-center">
                    {idx > 0 && (
                      <span className="mx-1 text-[10px] text-white/20">
                        →
                      </span>
                    )}
                    <NavLink
                      to={item.to}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'bg-white/[0.07] text-white'
                          : 'text-white/58 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t(item.labelKey)}
                    </NavLink>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Right: Controls */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#080b11] px-2.5 py-1 text-xs text-white/48 transition hover:border-white/15 hover:text-white/80"
              title={t('productCenter.shell.switchLanguage')}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{languageLabel}</span>
            </button>
            {isAuthenticated ? (
              <UserAccountMenu compact />
            ) : (
              <Link
                to={loginPath}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-400/20 bg-brand-400/10 px-2.5 py-1 text-xs font-semibold text-brand-100 transition hover:border-brand-300/40 hover:bg-brand-400/15"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('common.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="relative min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
    </div>
  )
}
