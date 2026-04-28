import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function hasOrgAdminAccess(orgRole?: string, productRoles?: string[]) {
  const normalizedRole = (orgRole || '').toLowerCase()
  if (normalizedRole === 'owner' || normalizedRole === 'admin') return true
  return (productRoles || []).includes('ecommerce.workspace_admin')
}

export default function RequireOrgAdmin() {
  const location = useLocation()
  const { isAuthenticated, user, access } = useAuth({ refreshOnMount: false })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasOrgAdminAccess(user?.org_role, access?.product_roles)) {
    return <Navigate to="/account/assets" replace />
  }

  return <Outlet />
}
