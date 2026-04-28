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
    pending: 'account.common.status.pending',
    processing: 'account.common.status.processing',
    tracked: 'account.common.status.tracked',
    reward_issued: 'account.common.status.rewardIssued',
    commission_earned: 'account.common.status.rewardIssued',
    earned: 'account.common.status.earned',
    redeemed: 'account.common.status.redeemed',
    reversed: 'account.common.status.reversed',
    settled: 'account.common.status.settled',
    refunded: 'account.common.status.refunded',
    succeeded: 'account.common.status.succeeded',
    failed: 'account.common.status.failed',
  }

  if (!value) return t('account.common.status.unknown')
  return keyMap[value] ? t(keyMap[value]) : value
}
