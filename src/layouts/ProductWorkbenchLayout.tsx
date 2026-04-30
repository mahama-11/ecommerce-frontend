import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Boxes, Bot, Download, LayoutDashboard, Rows3, Sparkles } from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'

const NAV_ITEMS = [
  {
    label: '商品列表',
    description: 'SKU 录入、状态追踪与商品维护。',
    to: '/products',
    icon: LayoutDashboard,
    match: (pathname: string) =>
      pathname === '/products' ||
      (/^\/products\/[^/]+$/.test(pathname) && !pathname.includes('/workbench/')),
  },
  {
    label: '批量 Listing',
    description: '批量生成、比对与采用 Listing 版本。',
    to: '/products/workbench/batch-listing',
    icon: Rows3,
    match: (pathname: string) => pathname.startsWith('/products/workbench/batch-listing'),
  },
  {
    label: '商品视觉',
    description: '在商品上下文里进行 AI 视觉生产。',
    to: '/products/workbench/visual-tools',
    icon: Bot,
    match: (pathname: string) =>
      pathname.startsWith('/products/workbench/visual-tools') || /\/products\/[^/]+\/ai\/[^/]+$/.test(pathname),
  },
  {
    label: '下载中心',
    description: '查看导出任务、交付包与下载记录。',
    to: '/products/workbench/downloads',
    icon: Download,
    match: (pathname: string) => pathname.startsWith('/products/workbench/downloads'),
  },
]

export default function ProductWorkbenchLayout() {
  const { pathname } = useLocation()
  const current = NAV_ITEMS.find(item => item.match(pathname)) ?? NAV_ITEMS[0]

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-white/[0.06] bg-[#0b0d14] xl:flex xl:flex-col">
          <div className="border-b border-white/[0.06] px-6 py-6">
            <Link to="/products" className="flex items-center gap-3">
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-3 text-brand-300">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/35">Product Module</div>
                <div className="mt-1 text-xl font-semibold text-white">商品中心</div>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-6 text-white/45">
              商品中心现在是独立业务模块，不再复用工具控制台菜单。
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/products'}
                  className={({ isActive }) =>
                    `block rounded-2xl border px-4 py-3 transition ${
                      isActive || item.match(pathname)
                        ? 'border-brand-500/35 bg-brand-500/10'
                        : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-brand-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="mt-1 text-xs leading-5 text-white/40">{item.description}</div>
                    </div>
                  </div>
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t border-white/[0.06] px-4 py-4">
            <Link
              to="/chat"
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Sparkles className="h-4 w-4 text-brand-300" />
              返回通用控制台
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex-none z-30 border-b border-white/[0.06] bg-[#0a0c12]/88 backdrop-blur-xl">
            <div className="space-y-4 px-4 py-4 sm:px-6 xl:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/30">Current Area</div>
                  <div className="mt-1 text-lg font-semibold text-white">{current.label}</div>
                  <div className="mt-1 text-sm text-white/45">{current.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/products"
                    className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex"
                  >
                    商品首页
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
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                  <Link
                    to="/chat"
                    className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <Sparkles className="h-4 w-4 text-brand-300" />
                    <span>返回控制台</span>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="mx-auto max-w-[1600px] w-full flex-1 flex flex-col relative">
              <div className="m-4 sm:m-6 xl:m-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/45 xl:hidden flex-none">
                商品中心已独立出工具控制台。桌面端有独立左侧菜单，移动端保留当前区域导航。
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
