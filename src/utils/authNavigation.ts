export function getWorkbenchEntryPath() {
  return '/draw/changing-model'
}

export function getAuthAwareStartPath(isAuthenticated: boolean) {
  return isAuthenticated ? getWorkbenchEntryPath() : '/register'
}

export function getAuthAwareLoginPath(isAuthenticated: boolean) {
  return isAuthenticated ? getWorkbenchEntryPath() : '/login'
}
