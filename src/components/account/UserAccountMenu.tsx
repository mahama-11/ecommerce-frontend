import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Coins,
  CreditCard,
  Download,
  History,
  Layers,
  LogOut,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react'
import { getPlanLabelByT } from '@/i18n/helpers'
import { useAuth } from '@/hooks/useAuth'
import { logoutAuth } from '@/state/auth'
import { getWorkbenchEntryPath } from '@/utils/authNavigation'
import { Z_INDEX } from '@/styles/zIndex'
import { commercialService } from '@/services/commercial'
import { formatPackageName, getCurrentSubscription } from '@/utils/commercialDisplay'
import type { CommercialOrderView } from '@/types/commercial'
import { Button } from '@/components/ui/Button'

type MenuAction = {
  label: string
  meta?: string
  to?: string
  icon: typeof Sparkles
  danger?: boolean
  onClick?: () => void
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AE'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function getUserDisplayName(user: { full_name?: string; email?: string } | null, locale: 'zh' | 'en') {
  return user?.full_name?.trim() || user?.email?.trim() || (locale === 'zh' ? '已登录用户' : 'Signed-in user')
}

export function getPlanLabel(planId: string | undefined, locale: 'zh' | 'en') {
  const plan = (planId || '').toLowerCase()
  if (!plan) return locale === 'zh' ? '未分配方案' : 'No plan assigned'
  const map: Record<string, { zh: string; en: string }> = {
    free: { zh: '免费版', en: 'Free' },
    basic: { zh: '基础版', en: 'Basic' },
    pro: { zh: '高级版', en: 'Pro' },
    team: { zh: '团队版', en: 'Team' },
    scale: { zh: '团队版', en: 'Team' },
  }
  return (map[plan] ?? { zh: planId || '未知方案', en: planId || 'Unknown plan' })[locale]
}

export default function UserAccountMenu({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const { isAuthenticated, user, access } = useAuth({ refreshOnMount: false })
  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState<CommercialOrderView[]>([])
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([])
      return
    }
    if (import.meta.env.DEV && window.location.search.includes('dev=1')) {
      setOrders([])
      return
    }
    let cancelled = false
    commercialService.listOrders()
      .then((result) => {
        if (!cancelled) setOrders(result.items || [])
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const isTeamAdmin = ['owner', 'admin'].includes((user?.org_role || '').toLowerCase())
  const name = user?.full_name?.trim() || user?.email?.trim() || t('account.userMenu.signedInUser')
  const orgName = user?.org_name?.trim() || t('account.userMenu.personalWorkspace')
  const locale: 'zh' | 'en' = t('common.locale', { defaultValue: 'zh' }) === 'en' ? 'en' : 'zh'
  const currentSubscription = getCurrentSubscription(orders)
  const planLabel = currentSubscription?.order?.package_code
    ? formatPackageName(currentSubscription.order.package_code, locale)
    : getPlanLabelByT(t, user?.plan_id)
  const actions = useMemo<MenuAction[]>(() => {
    const base: MenuAction[] = [
      {
        label: t('account.userMenu.actions.continueWorking.label'),
        meta: t('account.userMenu.actions.continueWorking.meta'),
        to: getWorkbenchEntryPath(),
        icon: Sparkles,
      },
      {
        label: t('account.userMenu.actions.profile.label'),
        meta: t('account.userMenu.actions.profile.meta'),
        to: '/account/profile',
        icon: Settings,
      },
      {
        label: t('account.userMenu.actions.history.label'),
        meta: t('account.userMenu.actions.history.meta'),
        to: '/account/history',
        icon: History,
      },
      {
        label: t('account.userMenu.actions.templates.label'),
        meta: t('account.userMenu.actions.templates.meta'),
        to: '/account/templates',
        icon: Layers,
      },
      {
        label: t('account.userMenu.actions.downloads.label'),
        meta: t('account.userMenu.actions.downloads.meta'),
        to: '/account/downloads',
        icon: Download,
      },
      {
        label: t('account.userMenu.actions.billing.label'),
        meta: t('account.userMenu.actions.billing.meta'),
        to: '/account/billing',
        icon: CreditCard,
      },
      {
        label: t('account.userMenu.actions.promotion.label'),
        meta: t('account.userMenu.actions.promotion.meta'),
        to: '/account/promotion',
        icon: Sparkles,
      },
      {
        label: t('account.userMenu.actions.commission.label'),
        meta: t('account.userMenu.actions.commission.meta'),
        to: '/account/commission',
        icon: Coins,
      },
    ]
    if (isTeamAdmin) {
      base.push({
        label: t('account.userMenu.actions.team.label'),
        meta: t('account.userMenu.actions.team.meta'),
        to: '/org/overview',
        icon: Shield,
      })
    }
    base.push({
      label: t('account.userMenu.actions.logout'),
      icon: LogOut,
      danger: true,
      onClick: logoutAuth,
    })
    return base
  }, [isTeamAdmin, t])

  if (!isAuthenticated || !user) return null

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`glass-strong border border-white/10 text-left text-white hover:border-white/20 hover:bg-[var(--ecom-surface-hover)] flex items-center gap-3 rounded-2xl transition-colors ${
          compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-brand-500/20 bg-brand-500/15 text-xs font-semibold text-brand-200">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
        {!compact && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{name}</div>
            <div className="truncate text-xs text-[var(--ecom-text-muted)]">
              {orgName} · {planLabel}
            </div>
          </div>
        )}
      </Button>

      {open && (
        <div className={`absolute right-0 top-[calc(100%+0.75rem)] ${Z_INDEX.popover} w-[min(92vw,22rem)] rounded-3xl border border-white/10 bg-[var(--ecom-popover-bg)] p-3 shadow-[0_32px_100px_rgba(0,0,0,0.68)] ring-1 ring-cyan-300/10 backdrop-blur-2xl`}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.065] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-brand-500/20 bg-brand-500/15 text-sm font-semibold text-brand-200">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{name}</div>
                <div className="truncate text-xs text-[var(--ecom-text-muted)]">{user.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--ecom-text-muted)]">
                    {orgName}
                  </span>
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-200">
                    {planLabel}
                  </span>
                </div>
                {access?.product_roles?.length ? (
                  <div className="mt-2 truncate text-[11px] uppercase tracking-[0.18em] text-[var(--ecom-text-faint)]">
                    {access.product_roles.join(' · ')}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {actions.map(action => {
              const content = (
                <>
                  <div className={`rounded-xl p-2 ${action.danger ? 'bg-rose-500/10 text-rose-300' : 'bg-white/[0.075] text-[var(--ecom-text-secondary)]'}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${action.danger ? 'text-rose-200' : 'text-white/90'}`}>{action.label}</div>
                    {action.meta ? <div className="mt-0.5 text-xs text-[var(--ecom-text-muted)]">{action.meta}</div> : null}
                  </div>
                </>
              )

              if (action.to) {
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-[var(--ecom-surface-hover)]"
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <Button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    action.onClick?.()
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--ecom-surface-hover)]"
                >
                  {content}
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
