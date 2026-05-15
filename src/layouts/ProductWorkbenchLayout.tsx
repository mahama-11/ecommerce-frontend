import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, Home, LogIn } from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'

type ProductNavItem = {
  labelKey: string
  to: string
  match: (pathname: string) => boolean
}

const navItems: ProductNavItem[] = [
  { labelKey: 'productCenter.shell.queue', to: '/products', match: (pathname: string) => pathname === '/products' || /^\/products\/[^/]+$/.test(pathname) },
  { labelKey: 'productCenter.shell.listing', to: '/products/workbench/batch-listing', match: (pathname: string) => pathname.startsWith('/products/workbench/batch-listing') },
  { labelKey: 'productCenter.shell.production', to: '/products', match: (pathname: string) => pathname.includes('/production') },
  { labelKey: 'productCenter.shell.delivery', to: '/products/workbench/downloads', match: (pathname: string) => pathname.startsWith('/products/workbench/downloads') },
]

const commandItems = [
  { labelKey: 'productCenter.shell.commands.queue', hintKey: 'productCenter.shell.commandHints.queue', to: '/products' },
  { labelKey: 'productCenter.shell.commands.listing', hintKey: 'productCenter.shell.commandHints.listing', to: '/products/workbench/batch-listing' },
  { labelKey: 'productCenter.shell.commands.production', hintKey: 'productCenter.shell.commandHints.production', to: '/products' },
  { labelKey: 'productCenter.shell.commands.delivery', hintKey: 'productCenter.shell.commandHints.delivery', to: '/products/workbench/downloads' },
]

export default function ProductWorkbenchLayout() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const [commandOpen, setCommandOpen] = useState(false)
  const loginPath = getAuthAwareLoginPath(isAuthenticated)
  const languageLabel = useMemo(() => (i18n.language === 'zh' ? '中' : 'EN'), [i18n.language])

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e8eaf0]">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080b11]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1400px] items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/48 transition hover:bg-white/[0.04] hover:text-white/82" title={t('productCenter.shell.backHome')}>
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('productCenter.shell.home')}</span>
            </Link>
            <Link to="/products" className="whitespace-nowrap font-semibold tracking-tight text-white">Product Center</Link>
            <nav className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
              {navItems.map(item => {
                const active = item.match(pathname)
                return (
                  <NavLink
                    key={item.labelKey}
                    to={item.to}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-white/[0.07] text-white' : 'text-white/58 hover:bg-white/[0.04] hover:text-white'}`}
                  >
                    {t(item.labelKey)}
                  </NavLink>
                )
              })}
            </nav>
          </div>
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
            <button onClick={() => setCommandOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#080b11] px-2.5 py-1 text-xs text-white/45 transition hover:border-white/15 hover:text-white/70">
              <kbd className="rounded bg-white/[0.07] px-1">⌘</kbd><span>K</span>
            </button>
            {isAuthenticated ? (
              <UserAccountMenu compact />
            ) : (
              <Link to={loginPath} className="inline-flex items-center gap-1 rounded-lg border border-brand-400/20 bg-brand-400/10 px-2.5 py-1 text-xs font-semibold text-brand-100 transition hover:border-brand-300/40 hover:bg-brand-400/15">
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('common.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="relative min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
      {commandOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md" onMouseDown={() => setCommandOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0d14]/95 shadow-[0_32px_120px_rgba(0,0,0,0.65)]" onMouseDown={event => event.stopPropagation()}>
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/55">Command Palette</div>
              <div className="mt-2 text-xl font-semibold text-white">{t('productCenter.shell.commandTitle')}</div>
            </div>
            <div className="p-3">
              {commandItems.map(command => (
                <Link
                  key={command.to}
                  to={command.to}
                  onClick={() => setCommandOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white/88">{t(command.labelKey)}</span>
                    <span className="mt-1 block text-xs text-white/38">{t(command.hintKey)}</span>
                  </span>
                  <span className="text-xs text-white/28 transition group-hover:translate-x-0.5 group-hover:text-cyan-100">↵</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
