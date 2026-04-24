import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RequireAuth() {
  const location = useLocation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
