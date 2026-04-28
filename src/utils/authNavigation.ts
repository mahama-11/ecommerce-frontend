const PREFERENCE_STORAGE_KEY = 'ecommerce_user_preferences'
const DEFAULT_WORKBENCH_PATH = '/draw/changing-model'

function readPreferredWorkspace() {
  if (typeof window === 'undefined') return DEFAULT_WORKBENCH_PATH

  try {
    const raw = window.localStorage.getItem(PREFERENCE_STORAGE_KEY)
    if (!raw) return DEFAULT_WORKBENCH_PATH

    const parsed = JSON.parse(raw) as { defaultWorkspace?: string } | null
    const preferred = parsed?.defaultWorkspace?.trim()
    return preferred || DEFAULT_WORKBENCH_PATH
  } catch {
    return DEFAULT_WORKBENCH_PATH
  }
}

export function getWorkbenchEntryPath() {
  return readPreferredWorkspace()
}

export function getAuthAwareStartPath(isAuthenticated: boolean) {
  return isAuthenticated ? getWorkbenchEntryPath() : '/register'
}

export function getAuthAwareLoginPath(isAuthenticated: boolean) {
  return isAuthenticated ? getWorkbenchEntryPath() : '/login'
}
