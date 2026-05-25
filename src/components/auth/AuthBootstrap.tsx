import { useEffect } from 'react'
import { refreshAuthSession } from '@/state/auth'

export default function AuthBootstrap() {
  useEffect(() => {
    if (import.meta.env.DEV && window.location.search.includes('dev=1')) return
    void refreshAuthSession()
  }, [])

  return null
}
