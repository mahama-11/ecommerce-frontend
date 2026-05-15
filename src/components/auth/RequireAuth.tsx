import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { applyAuth } from '@/state/auth'

// Dev bypass: allows previewing authenticated pages without a real backend.
// Activate by adding ?dev=1 to any URL (e.g. /products/dev-product-1/production/prep?dev=1)
function maybeApplyDevAuth(): boolean {
  if (import.meta.env.DEV && window.location.search.includes('dev=1')) {
    const existing = localStorage.getItem('ecommerce_session')
    if (!existing) {
      localStorage.setItem('ecommerce_session', JSON.stringify({
        access_token: 'dev-bypass-token',
        user: { full_name: 'Dev User', email: 'dev@example.com', org_name: 'Dev Org' },
      }))
      applyAuth({
        access_token: 'dev-bypass-token',
        user: { full_name: 'Dev User', email: 'dev@example.com', org_name: 'Dev Org' },
      })
      return true
    }
    // Re-apply from localStorage in case session was cleared in-memory
    if (!document.cookie.includes('dev-auth-applied')) {
      try {
        const parsed = JSON.parse(existing)
        applyAuth(parsed)
      } catch { /* ignore */ }
    }
  }
  return !!localStorage.getItem('ecommerce_session')
}

export default function RequireAuth() {
  const location = useLocation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })

  // Dev mode bypass: ?dev=1 in URL injects a mock session
  const isDevBypass = import.meta.env.DEV && location.search.includes('dev=1')
  if (isDevBypass && !isAuthenticated) {
    maybeApplyDevAuth()
  }

  if (!isAuthenticated && !isDevBypass) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
