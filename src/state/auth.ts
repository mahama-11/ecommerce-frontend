import { clearAuthSession, getCachedAuthSession, loadSession, type AuthPayload, type SessionPayload } from '@/services/auth'

type AuthListener = (payload: AuthPayload | null) => void

let currentAuth = getCachedAuthSession()
const listeners = new Set<AuthListener>()

function notify() {
  listeners.forEach(listener => listener(currentAuth))
}

export function getAuthState() {
  return currentAuth
}

export function subscribeAuth(listener: AuthListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function applyAuth(payload: AuthPayload | null) {
  currentAuth = payload
  notify()
}

export function logoutAuth() {
  clearAuthSession()
  applyAuth(null)
}

export async function refreshAuthSession(): Promise<SessionPayload | null> {
  if (!currentAuth?.access_token) return null
  try {
    const result = await loadSession()
    currentAuth = {
      ...currentAuth,
      user: result.user,
      credits: result.credits,
      access: result.access,
    }
    notify()
    return result
  } catch {
    logoutAuth()
    return null
  }
}
