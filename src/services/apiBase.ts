const env = import.meta.env as Record<string, string | undefined>

export const API_BASE_URL = (env.VITE_ECOMMERCE_API_BASE_URL ?? '').replace(/\/$/, '')
