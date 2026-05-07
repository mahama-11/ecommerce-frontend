import { API_BASE_URL } from '@/services/apiBase'
import { useToastStore } from '@/store/toastStore'

type Envelope<T> = {
  code: number
  message: string
  data: T
  error?: string
  error_code?: string
  error_hint?: string
}

export const TOKEN_STORAGE_KEY = 'ecommerce_access_token'
export const SESSION_STORAGE_KEY = 'ecommerce_session'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

export function shouldHandleUnauthorized(responseStatus: number, payloadCode?: number, errorCode?: string) {
  const token = getAccessToken()
  return Boolean(token) && (responseStatus === 401 || payloadCode === 401 || errorCode === 'TOKEN_INVALID')
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

function redirectToLogin() {
  if (typeof window === 'undefined') return

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(window.location.pathname)
  const target = isAuthPage ? '/login' : `/login?redirect=${encodeURIComponent(currentPath)}`
  window.location.replace(target)
}

export function handleUnauthorized(responseStatus: number, payloadCode?: number, errorCode?: string) {
  if (!shouldHandleUnauthorized(responseStatus, payloadCode, errorCode)) {
    return false
  }
  clearStoredAuth()
  redirectToLogin()
  return true
}

export function buildHeaders(init?: HeadersInit) {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init ?? {}),
  }
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code?: number
  readonly errorCode?: string

  constructor(message: string, status: number, code?: number, errorCode?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.errorCode = errorCode
  }
}

type RequestOptions = RequestInit & {
  silent?: boolean
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { silent, ...requestInit } = init ?? {}
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: buildHeaders(requestInit.headers),
  })

  const payload = (await response.json()) as Envelope<T>
  if (!response.ok || payload.code !== 0) {
    const errorMsg = payload.error_hint || payload.error || payload.message || 'Request failed'
    if (!silent) {
      useToastStore.getState().showToast(errorMsg, 'error')
    }
    handleUnauthorized(response.status, payload.code, payload.error_code)
    throw new ApiRequestError(errorMsg, response.status, payload.code, payload.error_code)
  }

  return payload.data
}

export async function downloadBinary(path: string, fileName?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!response.ok) {
    let errorMsg = 'Download failed'
    try {
      const payload = (await response.json()) as Envelope<unknown>
      errorMsg = payload.error_hint || payload.error || payload.message || errorMsg
      handleUnauthorized(response.status, payload.code, payload.error_code)
    } catch {
      handleUnauthorized(response.status)
    }
    useToastStore.getState().showToast(errorMsg, 'error')
    throw new Error(errorMsg)
  }

  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName || 'download'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
