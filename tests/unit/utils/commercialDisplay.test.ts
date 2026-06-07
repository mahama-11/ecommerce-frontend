import { describe, expect, it, vi } from 'vitest'
import {
  buildAssetBalanceMap,
  formatMoney,
  formatPackageName,
  formatWalletHistoryAmount,
  getCurrentSubscription,
  getWalletHistoryAssetSummary,
  getWalletHistoryTitle,
} from '@/utils/commercialDisplay'
import { getAuthAwareLoginPath, getAuthAwareStartPath, getWorkbenchEntryPath } from '@/utils/authNavigation'

const t = vi.fn((key: string) => ({
  'account.common.unit.quota': '额度',
  'account.common.unit.credits': '积分',
  'account.common.asset.cashBalance': '支付余额',
  'account.common.event.walletActivity': '资产变动',
}[key] ?? key)) as never

describe('authNavigation utils', () => {
  it('returns product center as authenticated workbench entry', () => {
    expect(getWorkbenchEntryPath()).toBe('/products')
  })

  it.each([
    [true, '/products'],
    [false, '/login'],
  ])('login path for authenticated=%s is %s', (authenticated, path) => {
    expect(getAuthAwareLoginPath(authenticated)).toBe(path)
  })

  it.each([
    [true, '/products'],
    [false, '/pricing'],
  ])('start path for authenticated=%s is %s', (authenticated, path) => {
    expect(getAuthAwareStartPath(authenticated)).toBe(path)
  })
})

describe('commercialDisplay utils', () => {
  it('builds empty asset balance map when wallet summary is missing', () => {
    expect(buildAssetBalanceMap(null).size).toBe(0)
    expect(buildAssetBalanceMap(undefined).size).toBe(0)
  })

  it('sums available balances by asset code', () => {
    const map = buildAssetBalanceMap({ assets: [
      { asset_code: 'ECOMMERCE_CASH', available_balance: 100 },
      { asset_code: 'ECOMMERCE_CASH', available_balance: 250 },
      { asset_code: 'ECOMMERCE_CREDIT', available_balance: 3 },
    ] } as never)
    expect(map.get('ECOMMERCE_CASH')).toBe(350)
    expect(map.get('ECOMMERCE_CREDIT')).toBe(3)
  })

  it('falls back to account_balance when available_balance is missing', () => {
    const map = buildAssetBalanceMap({ assets: [{ asset_code: 'A', account_balance: 42 }] } as never)
    expect(map.get('A')).toBe(42)
  })

  it.each([
    [0, '¥0'],
    [1, '¥0.01'],
    [100, '¥1'],
    [123456789, '¥1,234,567.89'],
    [undefined as unknown as number, '¥0'],
  ])('formats cents %s as %s', (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected)
  })

  it.each([
    [undefined, 'zh', '未开通套餐'],
    ['', 'en', 'No active package'],
    ['agent.basic.monthly', 'zh', 'Basic'],
    ['agent.pro.yearly', 'zh', 'Pro'],
    ['agent.growth.yearly', 'zh', 'Growth'],
    ['custom.enterprise', 'zh', '已购套餐'],
    ['custom.enterprise', 'en', 'Purchased package'],
  ])('formats package code %s locale %s', (code, locale, expected) => {
    expect(formatPackageName(code, locale)).toBe(expected)
  })

  it('selects latest fulfilled subscription by fulfillment time', () => {
    const current = getCurrentSubscription([
      { order: { id: 'old', status: 'fulfilled', package_type: 'subscription', fulfilled_at: '2026-01-01T00:00:00Z' } },
      { order: { id: 'new', status: 'fulfilled', package_type: 'subscription', fulfilled_at: '2026-02-01T00:00:00Z' } },
    ] as never)
    expect(current?.order?.id).toBe('new')
  })

  it('ignores pending and non-subscription orders when selecting subscription', () => {
    const current = getCurrentSubscription([
      { order: { id: 'pending', status: 'pending', package_type: 'subscription', fulfilled_at: '2026-03-01T00:00:00Z' } },
      { order: { id: 'credit', status: 'fulfilled', package_type: 'credit', fulfilled_at: '2026-04-01T00:00:00Z' } },
      { order: { id: 'sub', status: 'fulfilled', package_type: 'subscription', updated_at: '2026-01-01T00:00:00Z' } },
    ] as never)
    expect(current?.order?.id).toBe('sub')
  })

  it('returns undefined when there is no fulfilled subscription', () => {
    expect(getCurrentSubscription([{ order: { status: 'pending', package_type: 'subscription' } }] as never)).toBeUndefined()
  })

  it.each([
    [{ direction: 'credit', asset_code: 'ECOMMERCE_CASH', amount: 1200 }, '+¥12'],
    [{ direction: 'debit', asset_code: 'ECOMMERCE_CASH', amount: 1200 }, '-¥12'],
    [{ direction: 'adjust', asset_code: 'ECOMMERCE_CASH', amount: 1200 }, '¥12'],
    [{ direction: 'credit', asset_code: 'ecommerce.image.generate', amount: 5, quota_consumed: 3 }, '+3 额度'],
    [{ direction: 'debit', asset_code: 'ecommerce.image.generate', amount: 5 }, '-5 额度'],
    [{ direction: 'credit', asset_code: 'ECOMMERCE_CREDIT', amount: 9 }, '+9 积分'],
    [{ direction: 'debit', asset_code: 'ECOMMERCE_PROMO_CREDIT', amount: 2 }, '-2 积分'],
    [{ direction: 'credit', asset_code: 'OTHER', amount: 7 }, '+7'],
  ])('formats wallet history amount %#', (entry, expected) => {
    expect(formatWalletHistoryAmount(t, entry as never)).toBe(expected)
  })

  it('uses wallet history description as asset summary when available', () => {
    expect(getWalletHistoryAssetSummary(t, { description: 'Manual adjustment', asset_code: 'OTHER' } as never)).toBe('Manual adjustment')
  })

  it('falls back to localized asset label when summary has no description', () => {
    expect(getWalletHistoryAssetSummary(t, { asset_code: 'ECOMMERCE_CASH' } as never)).toBe('支付余额')
  })

  it('returns localized wallet title', () => {
    expect(getWalletHistoryTitle(t, { event_type: 'walletActivity', asset_code: 'ECOMMERCE_CASH' } as never)).toBe('资产变动')
  })
})
