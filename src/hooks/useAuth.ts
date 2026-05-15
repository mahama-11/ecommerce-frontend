import { useEffect, useState } from 'react'
import { getAuthState, refreshAuthSession, subscribeAuth } from '@/state/auth'

export function useAuth(options?: { refreshOnMount?: boolean }) {
  const [auth, setAuth] = useState(getAuthState())

  useEffect(() => subscribeAuth(setAuth), [])

  useEffect(() => {
    if (options?.refreshOnMount === false) return
    // Skip real session refresh in dev bypass mode
    if (import.meta.env.DEV && window.location.search.includes('dev=1')) return
    void refreshAuthSession()
  }, [options?.refreshOnMount])

  return {
    auth,
    isAuthenticated: Boolean(auth?.access_token),
    user: auth?.user ?? null,
    access: auth?.access ?? null,
    credits: auth?.credits ?? null,
  }
}
