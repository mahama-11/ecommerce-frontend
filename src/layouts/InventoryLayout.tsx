import { Button } from '@/components/ui/Button'
// ============================================================
// 库存管理布局组件 (InventoryLayout)
// 暗色侧边栏 + 7 项导航，视觉与 ProductWorkbenchLayout 一致
// ============================================================

import { useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Package,
  Calculator,
  ShoppingCart,
  Truck,
  Bell,
  BarChart3,
  Settings,
  Home,
  LogIn,
  Globe,
} from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'

type NavItem = {
  key: string
  labelKey: string
  to: string
  icon: React.ReactNode
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    labelKey: 'inventory.nav.overview',
    to: '/inventory',
    icon: <Package className="h-4 w-4" />,
    match: (p) => p === '/inventory' || p === '/inventory/',
  },
  {
    key: 'replenishment',
    labelKey: 'inventory.nav.replenishment',
    to: '/inventory/replenishment',
    icon: <Calculator className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/replenishment'),
  },
  {
    key: 'products',
    labelKey: 'inventory.nav.products',
    to: '/inventory/products',
    icon: <ShoppingCart className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/products'),
  },
  {
    key: 'inbound',
    labelKey: 'inventory.nav.inbound',
    to: '/inventory/inbound',
    icon: <Truck className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/inbound'),
  },
  {
    key: 'alerts',
    labelKey: 'inventory.nav.alerts',
    to: '/inventory/alerts',
    icon: <Bell className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/alerts'),
  },
  {
    key: 'analysis',
    labelKey: 'inventory.nav.analysis',
    to: '/inventory/analysis',
    icon: <BarChart3 className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/analysis'),
  },
  {
    key: 'settings',
    labelKey: 'inventory.nav.settings',
    to: '/inventory/settings',
    icon: <Settings className="h-4 w-4" />,
    match: (p) => p.startsWith('/inventory/settings'),
  },
]

export default function InventoryLayout() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const loginPath = getAuthAwareLoginPath(isAuthenticated)
  const languageLabel = useMemo(() => (i18n.language === 'zh' ? '中' : 'EN'), [i18n.language])

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  const activeNav = NAV_ITEMS.find(item => item.match(pathname))

  return (
    <div className="flex min-h-screen bg-[var(--ecom-bg)]">
      {/* 背景光效 */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>

      {/* 侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[240px] flex-col border-r border-white/[0.06] bg-[var(--ecom-popover-bg)] backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl">
            {/* 渐变背景 + 辉光，与站点整体深色 + cyan/emerald 风格一致 */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/20 backdrop-blur-xl" />
            <div className="absolute inset-0 rounded-xl border border-white/[0.08]" />
            <Package className="relative z-10 h-5 w-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">库存管理</div>
            <div className="text-xs text-white/40">Inventory</div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = item.match(pathname)
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'text-white/55 hover:bg-[var(--ecom-surface-hover)] hover:text-white/80'
                    }`}
                  >
                    {item.icon}
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 侧边栏底部 */}
        <div className="mx-3 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.05] p-3">
          <div className="text-xs text-white/40">
            <span className="font-medium text-white/60">今日提醒</span>
            <br />
            当前有 2 个 SKU 急需补货，建议进入「补货计算」生成本批次入仓数量。
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="ml-[240px] flex min-h-screen flex-1 flex-col">
        {/* 顶部条 */}
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-white/[0.06] bg-[var(--ecom-header-bg)] px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/products' : '/'}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/48 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white/80"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Product Center</span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-sm font-medium text-white/80">
              {activeNav ? t(activeNav.labelKey) : '库存管理'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[var(--ecom-surface)] px-2.5 py-1 text-xs text-white/48 transition hover:border-white/15 hover:text-white/80"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{languageLabel}</span>
            </Button>
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
        </header>

        {/* 页面内容 */}
        <main className="relative flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
