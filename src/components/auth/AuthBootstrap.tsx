import { useEffect } from 'react'
import { refreshAuthSession } from '@/state/auth'

export default function AuthBootstrap() {
  useEffect(() => {
    void refreshAuthSession()
  }, [])

  return null
}
