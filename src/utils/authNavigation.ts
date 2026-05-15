/**
 * Return the default entry path for an authenticated workbench user.
 */
export function getWorkbenchEntryPath(): string {
  return '/products'
}

/**
 * Return a login-aware path; redirects authenticated users away from login.
 */
export function getAuthAwareLoginPath(isAuthenticated: boolean): string {
  return isAuthenticated ? getWorkbenchEntryPath() : '/login'
}

/**
 * Return a start path that depends on auth state.
 */
export function getAuthAwareStartPath(isAuthenticated: boolean): string {
  return isAuthenticated ? getWorkbenchEntryPath() : '/pricing'
}
