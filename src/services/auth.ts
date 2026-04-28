import { SESSION_STORAGE_KEY, TOKEN_STORAGE_KEY, request } from '@/services/http'

export type AuthAccessSummary = {
  active_org_id: string
  has_access: boolean
  product_roles: string[]
  product_permissions: string[]
  platform_permissions?: string[]
}

export type AuthUserSummary = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  org_id: string
  org_name: string
  org_role: string
  plan_id: string
  status: string
  language_preference?: string
}

export type CreditsSummary = {
  asset_code: string
  balance: number
  permanent_balance: number
  reward_balance: number
  allowance_balance: number
}

export type AuthPayload = {
  access_token: string
  user: AuthUserSummary
  credits: CreditsSummary
  access: AuthAccessSummary
}

export type SessionPayload = {
  authenticated: boolean
  user: AuthUserSummary
  credits: CreditsSummary
  access: AuthAccessSummary
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  full_name: string
  email: string
  password: string
  organization_name?: string
  language?: string
  promotion_code?: string
}
export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

export function setAuthSession(payload: AuthPayload) {
  localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token)
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getCachedAuthSession(): AuthPayload | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthPayload
  } catch {
    clearAuthSession()
    return null
  }
}

export async function login(input: LoginRequest) {
  const result = await request<AuthPayload>('/api/v1/ecommerce/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setAuthSession(result)
  return result
}

export async function register(input: RegisterRequest) {
  const result = await request<AuthPayload>('/api/v1/ecommerce/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setAuthSession(result)
  return result
}

export async function loadSession() {
  const result = await request<SessionPayload>('/api/v1/ecommerce/auth/session')
  const cached = getCachedAuthSession()
  if (cached) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...cached,
        user: result.user,
        credits: result.credits,
        access: result.access,
      }),
    )
  }
  return result
}
