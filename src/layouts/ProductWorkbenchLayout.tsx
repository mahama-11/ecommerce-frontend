import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Boxes, Bot, Download, LayoutDashboard, Rows3, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'

const NAV_ITEMS = [
  {
    labelKey: 'productWorkbench.nav.productList',
    to: '/products',
    icon: LayoutDashboard,
    match: (pathname: string) =>
      pathname === '/products' ||
      (/^\/products\/[^/]+$/.test(pathname) && !pathname.includes('/workbench/')),
  },
  {
    labelKey: 'productWorkbench.nav.batchListing',
    to: '/products/workbench/batch-listing',
    icon: Rows3,
    match: (pathname: string) => pathname.startsWith('/products/workbench/batch-listing'),
  },
  {
    labelKey: 'productWorkbench.nav.visualTools',
    to: '/products/workbench/visual-tools',
    icon: Bot,
    match: (pathname: string) =>
      pathname.startsWith('/products/workbench/visual-tools') || /\/products\/[^/]+\/ai\/[^/]+$/.test(pathname),
  },
  {
    labelKey: 'productWorkbench.nav.downloads',
    to: '/products/workbench/downloads',
    icon: Download,
    match: (pathname: string) => pathname.startsWith('/products/workbench/downloads'),
  },
]

export default function ProductWorkbenchLayout() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const current = NAV_ITEMS.find(item => item.match(pathname)) ?? NAV_ITEMS[0]

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 border-r border-white/[0.06] bg-[#0b0d14] xl:flex xl:flex-col transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-[80px]' : 'w-[200px]'
          }`}
        >
          <div className={`border-b border-white/[0.06] py-5 flex items-center justify-between ${isCollapsed ? 'px-4 flex-col gap-4' : 'px-5'}`}>
            <Link to="/products" className="flex items-center gap-3 overflow-hidden">
              <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-2.5 text-brand-300 shrink-0">
                <Boxes className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/35 truncate">Product Module</div>
                  <div className="mt-0.5 text-base font-semibold text-white truncate">{t('productWorkbench.moduleName')}</div>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/products'}
                  title={isCollapsed ? t(item.labelKey) : undefined}
                  className={({ isActive }) =>
                    `block rounded-xl border transition ${
                      isCollapsed ? 'px-0 py-3 flex justify-center' : 'px-3 py-2.5'
                    } ${
                      isActive || item.match(pathname)
                        ? 'border-brand-500/35 bg-brand-500/10'
                        : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'items-center gap-3'}`}>
                    <div className={`rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-brand-300 shrink-0 ${isCollapsed ? 'border-transparent bg-transparent' : ''}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-white truncate">{t(item.labelKey)}</div>
                      </div>
                    )}
                  </div>
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t border-white/[0.06] p-3">
            <Link
              to="/chat"
              title={isCollapsed ? t('productWorkbench.backToConsole') : undefined}
              className={`flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition hover:bg-white/[0.05] hover:text-white ${
                isCollapsed ? 'justify-center p-3' : 'gap-2 px-3 py-2.5 text-sm text-white/65'
              }`}
            >
              <Sparkles className={`h-4 w-4 text-brand-300 ${isCollapsed ? '' : 'shrink-0'}`} />
              {!isCollapsed && <span className="truncate">{t('productWorkbench.backToConsole')}</span>}
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex-none z-30 border-b border-white/[0.06] bg-[#0a0c12]/88 backdrop-blur-xl">
            <div className="space-y-4 px-4 py-4 sm:px-6 xl:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/30">{t('productWorkbench.currentArea')}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{t(current.labelKey)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/products"
                    className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex"
                  >
                    {t('productWorkbench.home')}
                  </Link>
                  <UserAccountMenu compact />
                </div>
              </div>

              <div className="xl:hidden">
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {NAV_ITEMS.map(item => {
                    const Icon = item.icon
                    const active = item.match(pathname)
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/products'}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                          active
                            ? 'border-brand-500/35 bg-brand-500/10 text-white'
                            : 'border-white/[0.08] bg-white/[0.03] text-white/65 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-brand-300" />
                        <span>{t(item.labelKey)}</span>
                      </NavLink>
                    )
                  })}
                  <Link
                    to="/chat"
                    className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Sparkles className="h-4 w-4 text-brand-300" />
                    <span>{t('productWorkbench.backToConsole')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mx-auto max-w-[1600px] w-full flex-1 flex flex-col relative">
              <div className="m-4 sm:m-6 xl:m-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/45 xl:hidden flex-none">
                {t('productWorkbench.mobileTip')}
              </div>

              <div className="flex-1 overflow-auto relative">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
