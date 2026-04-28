import { clearAuthSession, getCachedAuthSession, loadSession, type AuthPayload, type SessionPayload } from '@/services/auth'
import { SESSION_STORAGE_KEY } from '@/services/http'

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

export function patchAuthUser(patch: Partial<AuthPayload['user']>) {
  if (!currentAuth) return

  currentAuth = {
    ...currentAuth,
    user: {
      ...currentAuth.user,
      ...patch,
    },
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentAuth))
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
