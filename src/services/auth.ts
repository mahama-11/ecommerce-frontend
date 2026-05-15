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

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  full_name: string
  email: string
  password: string
  organization_name?: string
  language?: string
}

// ─── Auth Session Persistence ─────────────────────────────

export function persistAuthSession(payload: AuthPayload): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token)
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
}

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

export async function login(input: LoginInput): Promise<AuthPayload> {
  const payload = await request<AuthPayload>('/api/v1/ecommerce/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  persistAuthSession(payload)
  return payload
}

export async function register(input: RegisterInput): Promise<AuthPayload> {
  const payload = await request<AuthPayload>('/api/v1/ecommerce/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  persistAuthSession(payload)
  return payload
}

export async function loadSession(): Promise<SessionPayload> {
  return request<SessionPayload>('/api/v1/ecommerce/auth/session', { method: 'GET' })
}
