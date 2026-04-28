import type { CommercialOrderView, WalletHistoryEntry, WalletSummary } from '@/types/commercial'

export function buildAssetBalanceMap(walletSummary?: WalletSummary | null) {
  const map = new Map<string, number>()
  for (const asset of walletSummary?.assets || []) {
    map.set(asset.asset_code, (map.get(asset.asset_code) || 0) + (asset.available_balance || asset.account_balance || 0))
  }
  return map
}

export function getCurrentSubscription(orders: CommercialOrderView[]) {
  return [...orders]
    .filter(item => item.order?.status === 'fulfilled' && item.order?.package_type === 'subscription')
    .sort((a, b) => {
      const aTime = new Date(a.order?.fulfilled_at || a.order?.updated_at || a.order?.created_at || 0).getTime()
      const bTime = new Date(b.order?.fulfilled_at || b.order?.updated_at || b.order?.created_at || 0).getTime()
      return bTime - aTime
    })[0]
}

export function formatPackageName(packageCode?: string, locale: string = 'zh') {
  if (!packageCode) return locale.startsWith('zh') ? '未开通套餐' : 'No active package'
  if (packageCode.includes('.basic.')) return 'Basic'
  if (packageCode.includes('.pro.')) return 'Pro'
  if (packageCode.includes('.growth.')) return 'Growth'
  return locale.startsWith('zh') ? '已购套餐' : 'Purchased package'
}

export function formatMoney(cents: number) {
  return `¥${((cents || 0) / 100).toLocaleString()}`
}

export function formatWalletHistoryAmount(entry: WalletHistoryEntry) {
  const prefix = entry.direction === 'credit' ? '+' : entry.direction === 'debit' ? '-' : ''
  if (entry.asset_code === 'ECOMMERCE_CASH') return `${prefix}${formatMoney(entry.amount)}`
  if (entry.asset_code === 'ECOMMERCE_MONTHLY_ALLOWANCE') return `${prefix}${entry.amount} quota`
  if (entry.asset_code === 'ECOMMERCE_CREDIT' || entry.asset_code === 'ECOMMERCE_PROMO_CREDIT') return `${prefix}${entry.amount} credits`
  return `${prefix}${entry.amount}`
}
