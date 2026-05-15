import type { CommercialOrderView } from '@/types/commercial'

// ─── Commercial Display Utilities ─────────────────────────

const PACKAGE_NAMES_ZH: Record<string, string> = {
  free: '试用版',
  basic: '基础版',
  pro: '高级版',
  team: '团队版',
}

const PACKAGE_NAMES_EN: Record<string, string> = {
  free: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
  team: 'Team',
}

export function formatPackageName(packageCode: string, locale: 'zh' | 'en'): string {
  if (locale === 'en') return PACKAGE_NAMES_EN[packageCode] ?? packageCode
  return PACKAGE_NAMES_ZH[packageCode] ?? packageCode
}

export function getCurrentSubscription(
  orders: CommercialOrderView[],
): { order?: { package_code: string } } | null {
  if (!orders || orders.length === 0) return null
  const active = orders.find(o => o.order?.status === 'active' || o.order?.status === 'fulfilled')
  return active ?? orders[0] ?? null
}
