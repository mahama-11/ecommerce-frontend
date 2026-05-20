import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { TOKEN_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/services/http'

function ensureDevAuthSession(search: string) {
  if (!import.meta.env.DEV || !search.includes('dev=1')) return false
  if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
    const payload = {
      access_token: 'dev',
      user: { full_name: 'Dev User', email: 'dev@agent-ecommerce.com', org_name: 'Local QA' },
      access: { product_roles: ['admin'] },
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  }
  return true
}

export default function RequireAuth() {
  const location = useLocation()
  const devBypass = ensureDevAuthSession(location.search)
  const { isAuthenticated } = useAuth({ refreshOnMount: false })

  if (!isAuthenticated && !devBypass) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
