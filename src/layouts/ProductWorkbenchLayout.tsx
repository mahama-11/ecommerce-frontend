import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, Home, LogIn } from 'lucide-react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EcomCommandDialog, EcomHeader, EcomNavPill, EcomShell } from '@/components/ui/EcomShell'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'

type ProductNavItem = {
  labelKey: string
  to: string
  match: (pathname: string) => boolean
}

const navItems: ProductNavItem[] = [
  { labelKey: 'productCenter.shell.queue', to: '/products', match: (pathname: string) => pathname === '/products' || /^\/products\/[^/]+$/.test(pathname) },
  { labelKey: 'productCenter.shell.listing', to: '/aiChat/template', match: (pathname: string) => pathname.startsWith('/aiChat/template') || pathname.startsWith('/products/workbench/batch-listing') },
  { labelKey: 'productCenter.shell.delivery', to: '/products/workbench/downloads', match: (pathname: string) => pathname.startsWith('/products/workbench/downloads') },
]

const commandItems = [
  { labelKey: 'productCenter.shell.commands.queue', hintKey: 'productCenter.shell.commandHints.queue', to: '/products' },
  { labelKey: 'productCenter.shell.commands.listing', hintKey: 'productCenter.shell.commandHints.listing', to: '/aiChat/template' },
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
    <EcomShell>
      <EcomHeader>
          <div className="flex min-w-0 items-center gap-2">
            <ButtonLink to="/" variant="ghost" size="sm" title={t('productCenter.shell.backHome')}>
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('productCenter.shell.home')}</span>
            </ButtonLink>
            <nav className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
              {navItems.map(item => {
                const active = item.match(pathname)
                return (
                  <NavLink key={item.labelKey} to={item.to}>
                    <EcomNavPill active={active}>{t(item.labelKey)}</EcomNavPill>
                  </NavLink>
                )
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={toggleLang}
              variant="quiet"
              size="sm"
              title={t('productCenter.shell.switchLanguage')}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{languageLabel}</span>
            </Button>
            <Button onClick={() => setCommandOpen(true)} variant="quiet" size="sm">
              <kbd className="rounded bg-white/[0.07] px-1">⌘</kbd><span>K</span>
            </Button>
            {isAuthenticated ? (
              <UserAccountMenu compact />
            ) : (
              <ButtonLink to={loginPath} variant="secondary" size="sm">
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('common.login')}</span>
              </ButtonLink>
            )}
          </div>
      </EcomHeader>
      <main className="relative min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
      {commandOpen ? (
        <div onMouseDown={() => setCommandOpen(false)}>
          <EcomCommandDialog>
            <div onMouseDown={event => event.stopPropagation()}>
            <div className="border-b border-[var(--ecom-border)] px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/55">Command Palette</div>
              <div className="mt-2 text-xl font-semibold text-white">{t('productCenter.shell.commandTitle')}</div>
            </div>
            <div className="p-3">
              {commandItems.map(command => (
                <Link
                  key={command.to}
                  to={command.to}
                  onClick={() => setCommandOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-[var(--ecom-surface-hover)]"
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
          </EcomCommandDialog>
        </div>
      ) : null}
    </EcomShell>
  )
}
