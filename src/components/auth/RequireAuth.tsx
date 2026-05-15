import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RequireAuth() {
  const location = useLocation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
