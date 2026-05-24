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
import { useEffect, useMemo, useState } from 'react'
import UserAccountMenu from '@/components/account/UserAccountMenu'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EcomHeader, EcomNavPill, EcomShell } from '@/components/ui/EcomShell'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'
import { getProduct } from '@/services/product'

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
  const [productTitle, setProductTitle] = useState('')

  useEffect(() => {
    if (!id) {
      setProductTitle('')
      return
    }
    let cancelled = false
    getProduct(id)
      .then(detail => {
        if (!cancelled) setProductTitle(detail.product.title || detail.product.skuCode || '')
      })
      .catch(() => {
        if (!cancelled) setProductTitle('')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const navItems = useMemo(() => buildNavItems(id ?? ''), [id])
  const languageLabel = useMemo(
    () => (i18n.language === 'zh' ? '中' : 'EN'),
    [i18n.language],
  )

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')
  }

  return (
    <EcomShell>
      <EcomHeader>
          <div className="flex min-w-0 items-center gap-2">
            <ButtonLink
              to="/products"
              variant="ghost"
              size="sm"
              title={t('production.backToProducts')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t('productCenter.shell.home')}
              </span>
            </ButtonLink>

            <div className="h-4 w-px bg-[var(--ecom-border-strong)]" />

            <Link
              to="/products"
              className="whitespace-nowrap font-semibold tracking-tight text-white"
            >
              Product Center
            </Link>

            <span className="text-[var(--ecom-text-faint)]">/</span>
            <span className="max-w-[180px] truncate text-xs text-[var(--ecom-text-muted)]" title={productTitle || id}>
              {productTitle || (id ? `#${id}` : '')}
            </span>

            <nav className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto">
              {navItems.map((item, idx) => {
                const active = item.match(pathname)
                const Icon = item.icon
                return (
                  <div key={item.labelKey} className="flex items-center">
                    {idx > 0 && (
                      <span className="mx-1 text-[10px] text-[var(--ecom-text-faint)]">
                        →
                      </span>
                    )}
                    <NavLink to={item.to}>
                      <EcomNavPill active={active}>
                        <Icon className="h-3.5 w-3.5" />
                        {t(item.labelKey)}
                      </EcomNavPill>
                    </NavLink>
                  </div>
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
    </EcomShell>
  )
}
