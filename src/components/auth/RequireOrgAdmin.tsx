import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { refreshAuthSession } from '@/state/auth'

function hasOrgAdminAccess(orgRole?: string, productRoles?: string[]) {
  const normalizedRole = (orgRole || '').toLowerCase()
  if (normalizedRole === 'owner' || normalizedRole === 'admin') return true
  return (productRoles || []).includes('ecommerce.workspace_admin')
}

export default function RequireOrgAdmin() {
  const location = useLocation()
  const devBypass = import.meta.env.DEV && location.search.includes('dev=1')
  const { auth } = useAuth({ refreshOnMount: false })
  const [sessionChecked, setSessionChecked] = useState(devBypass)

  useEffect(() => {
    if (devBypass) {
      setSessionChecked(true)
      return
    }
    if (!auth?.access_token) {
      setSessionChecked(true)
      return
    }
    let active = true
    setSessionChecked(false)
    void refreshAuthSession().finally(() => {
      if (active) setSessionChecked(true)
    })
    return () => { active = false }
  }, [auth?.access_token, devBypass])

  if (!auth?.access_token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!sessionChecked) {
    return <div className="min-h-screen bg-[var(--ecom-bg)] px-6 py-10 text-sm text-white/60">正在校验组织权限…</div>
  }

  if (!hasOrgAdminAccess(auth.user?.org_role, auth.access?.product_roles)) {
    return <Navigate to="/account/assets" replace />
  }

  return <Outlet />
}
