import { request, TOKEN_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/services/http'

// ─── Auth Types ───────────────────────────────────────────

export interface AuthPayload {
  access_token: string
  user: {
    full_name?: string
    email?: string
    org_name?: string
    org_role?: string
    avatar_url?: string
    plan_id?: string
  }
  credits?: unknown
  access?: {
    product_roles?: string[]
  }
}

export interface SessionPayload {
  user: AuthPayload['user']
  credits: unknown
  access: AuthPayload['access']
}

// ─── Auth Session Persistence ─────────────────────────────

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getCachedAuthSession(): AuthPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthPayload) : null
  } catch {
    return null
  }
}

export async function loadSession(): Promise<SessionPayload> {
  return request<SessionPayload>('/api/v1/ecommerce/auth/session', { method: 'GET' })
}
