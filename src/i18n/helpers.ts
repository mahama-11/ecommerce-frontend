import type { TFunction } from 'i18next'

export type AppLocale = 'zh' | 'en'

export function resolveAppLocale(language?: string): AppLocale {
  return (language || '').startsWith('en') ? 'en' : 'zh'
}

export function getPlanLabelByT(t: TFunction, planId?: string) {
  const plan = (planId || '').toLowerCase()
  if (!plan) return t('account.common.noPlan')

  const keyMap: Record<string, string> = {
    free: 'account.common.plan.free',
    basic: 'account.common.plan.basic',
    pro: 'account.common.plan.pro',
    team: 'account.common.plan.team',
    scale: 'account.common.plan.team',
  }

  return keyMap[plan] ? t(keyMap[plan]) : planId || t('account.common.unknownPlan')
}

export function getHistoryModuleLabel(t: TFunction, value: string) {
  const keyMap: Record<string, string> = {
    all: 'account.history.filters.all',
    chat: 'account.history.filters.chat',
    template: 'account.history.filters.template',
    design: 'account.history.filters.design',
    asset: 'account.history.filters.asset',
    delivery: 'account.history.filters.delivery',
  }
  return keyMap[value] ? t(keyMap[value]) : value
}

export function getCommercialStatusLabel(t: TFunction, value?: string) {
  const keyMap: Record<string, string> = {
    active: 'account.common.status.active',
    fulfilled: 'account.common.status.fulfilled',
    inactive: 'account.common.status.inactive',
    pending: 'account.common.status.pending',
    processing: 'account.common.status.processing',
    tracked: 'account.common.status.tracked',
    reward_issued: 'account.common.status.rewardIssued',
    commission_earned: 'account.common.status.rewardIssued',
    earned: 'account.common.status.earned',
    redeemed: 'account.common.status.redeemed',
    reversed: 'account.common.status.reversed',
    settled: 'account.common.status.settled',
    settlement_in_progress: 'account.common.status.settlementInProgress',
    refunded: 'account.common.status.refunded',
    succeeded: 'account.common.status.succeeded',
    fulfillment_failed: 'account.common.status.fulfillmentFailed',
    payment_succeeded_fulfillment_failed: 'account.common.status.fulfillmentFailed',
    void: 'account.common.status.void',
    failed: 'account.common.status.failed',
  }

  if (!value) return t('account.common.status.unknown')
  return keyMap[value] ? t(keyMap[value]) : value
}

export function getCommercialAssetLabel(t: TFunction, value?: string) {
  const keyMap: Record<string, string> = {
    'ECOMMERCE_CASH': 'account.common.asset.cashBalance',
    'ecommerce.image.generate': 'account.common.asset.imageGenerationQuota',
    'ECOMMERCE_CREDIT': 'account.common.asset.permanentCredits',
    'ECOMMERCE_PROMO_CREDIT': 'account.common.asset.promoCredits',
  }
  if (!value) return t('account.common.asset.walletActivity')
  return keyMap[value] ? t(keyMap[value]) : value
}

export function getWalletHistoryCategoryLabel(t: TFunction, value?: string) {
  const keyMap: Record<string, string> = {
    charge: 'account.common.historyCategory.charge',
    refund: 'account.common.historyCategory.refund',
    recharge: 'account.common.historyCategory.recharge',
    wallet_adjustment: 'account.common.historyCategory.walletAdjustment',
  }
  if (!value) return t('account.common.historyCategory.activity')
  return keyMap[value] ? t(keyMap[value]) : value
}

export function getWalletHistoryTitleLabel(
  t: TFunction,
  entry?: { title?: string; category?: string; status?: string },
) {
  const normalizedTitle = (entry?.title || '').trim()
  const keyMap: Record<string, string> = {
    'Product charge settled': 'account.common.event.productChargeSettled',
    'Product charge refunded': 'account.common.event.productChargeRefunded',
    'Wallet adjustment': 'account.common.event.walletAdjustment',
    'Credits recharge': 'account.common.event.creditsRecharge',
  }
  if (keyMap[normalizedTitle]) {
    return t(keyMap[normalizedTitle])
  }
  if (entry?.category === 'refund') {
    return t('account.common.event.productChargeRefunded')
  }
  if (entry?.category === 'charge') {
    return t('account.common.event.productChargeSettled')
  }
  if (entry?.category === 'recharge') {
    return t('account.common.event.creditsRecharge')
  }
  if (entry?.category === 'wallet_adjustment') {
    return t('account.common.event.walletAdjustment')
  }
  return normalizedTitle || t('account.common.event.walletActivity')
}
