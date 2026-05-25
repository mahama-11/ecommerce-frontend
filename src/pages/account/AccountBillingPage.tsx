import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CreditCard, FileText, Receipt, Sparkles, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getCommercialAssetLabel,
  getCommercialStatusLabel,
  getWalletHistoryCategoryLabel,
  getWalletHistoryTitleLabel,
} from '@/i18n/helpers'
import { commercialService } from '@/services/commercial'
import type { BillingChargeRecord, BillingSummary, CommercialOrderView, WalletHistoryEntry, WalletSummary } from '@/types/commercial'
import {
  buildAssetBalanceMap,
  formatMoney,
  formatPackageName,
  formatWalletHistoryAmount,
  getCurrentSubscription,
} from '@/utils/commercialDisplay'
import { Button } from '@/components/ui/Button'


const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AccountBillingPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [charges, setCharges] = useState<BillingChargeRecord[]>([])
  const [walletHistory, setWalletHistory] = useState<WalletHistoryEntry[]>([])
  const [orders, setOrders] = useState<CommercialOrderView[]>([])
  const [chargeFilter, setChargeFilter] = useState<'all' | 'settled' | 'refunded'>('all')

  useEffect(() => {
    void Promise.all([
      commercialService.getBillingSummary(),
      commercialService.getBillingCharges(),
      commercialService.getWalletSummary(),
      commercialService.getWalletHistory(),
      commercialService.listOrders(),
    ]).then(([billingSummary, chargeItems, wallet, history, orderResult]) => {
      setSummary(billingSummary)
      setCharges(chargeItems)
      setWalletSummary(wallet)
      setWalletHistory(history.items || [])
      setOrders(orderResult.items || [])
    })
  }, [])

  const visibleCharges = useMemo(() => {
    if (chargeFilter === 'all') return charges
    return charges.filter(item => item.status === chargeFilter)
  }, [chargeFilter, charges])

  const assetMap = useMemo(() => buildAssetBalanceMap(walletSummary), [walletSummary])
  const quota = walletSummary?.quota
  const currentSubscription = useMemo(() => getCurrentSubscription(orders), [orders])

  const stats = useMemo(
    () => [
      { label: t('account.billing.stats.currentPlan'), value: formatPackageName(currentSubscription?.order?.package_code, 'zh'), icon: CreditCard },
      { label: t('account.billing.stats.remainingCredits'), value: `${quota?.remaining || 0} ${t('account.common.unit.quota')}`, icon: Sparkles },
      { label: t('account.billing.stats.walletBalance'), value: formatMoney(assetMap.get('ECOMMERCE_CASH') || 0), icon: Wallet },
      { label: t('account.billing.stats.chargeRecords'), value: `${summary?.charge_count ?? charges.length}`, icon: Receipt },
    ],
    [assetMap, charges.length, currentSubscription?.order?.package_code, summary?.charge_count, t],
  )

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.billing.title')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('account.billing.subtitle')}</p>
        </motion.div>
        <Link
          to="/pricing"
          className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-colors active:scale-95 shrink-0"
        >
          <FileText className="h-4 w-4" />
          {t('nav.pricing')}
        </Link>
      </div>

      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div variants={itemVariants} key={`${item.label}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-slate-500" />
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t('account.billing.stats.settledRecords'), value: summary?.settled_count ?? 0, color: 'text-slate-100' },
          { label: t('account.billing.stats.refundedRecords'), value: summary?.refunded_count ?? 0, color: 'text-rose-400' },
          { label: t('account.billing.stats.channelRetries'), value: (summary?.channel_pending_count ?? 0) + (summary?.channel_failed_count ?? 0), color: 'text-amber-400' }
        ].map((item, index) => (
          <motion.div variants={itemVariants} key={`${item.label}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${item.color}`}>{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{t('account.billing.assets.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('account.billing.assets.subtitle')}</p>
        </div>
          <div className="divide-y divide-white/5">
            {[
              { label: getCommercialAssetLabel(t, 'ECOMMERCE_CASH'), value: formatMoney(assetMap.get('ECOMMERCE_CASH') || 0) },
              { label: getCommercialAssetLabel(t, 'ECOMMERCE_CREDIT'), value: `${assetMap.get('ECOMMERCE_CREDIT') || 0} ${t('account.common.unit.credits')}` },
              { label: getCommercialAssetLabel(t, 'ECOMMERCE_PROMO_CREDIT'), value: `${assetMap.get('ECOMMERCE_PROMO_CREDIT') || 0} ${t('account.common.unit.credits')}` },
              { label: getCommercialAssetLabel(t, 'ecommerce.image.generate'), value: `${quota?.remaining || 0} ${t('account.common.unit.quota')}` },
            ].map((item, index) => (
              <motion.div variants={itemVariants} key={`${item.label}-${index}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--ecom-surface-hover)]">
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{item.label}</div>
                <div className="text-lg font-semibold text-slate-100">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div>
              <h2 className="font-medium text-slate-100">{t('account.billing.walletHistory.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('account.billing.walletHistory.subtitle')}</p>
        </div>
            <Link to="/account/history" className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
              {t('account.common.actions.openFullHistory')}
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {walletHistory.length ? walletHistory.slice(0, 5).map((item, index) => (
              <motion.div variants={itemVariants} key={item.id || `${item.reference_id || item.asset_code}-${index}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--ecom-surface-hover)]">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">{getWalletHistoryTitleLabel(t, item)}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {[
                      getWalletHistoryCategoryLabel(t, item.category),
                      getCommercialAssetLabel(t, item.asset_code),
                      item.reference_type && item.reference_id ? `${item.reference_type}:${item.reference_id}` : item.reference_type,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-sm font-semibold ${item.direction === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {formatWalletHistoryAmount(t, item)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{getCommercialStatusLabel(t, item.status)}</div>
                </div>
              </motion.div>)) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                {t('account.billing.walletHistory.empty')}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="font-medium text-slate-100">{t('account.billing.records.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('account.billing.records.subtitle')}</p>
        </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-1 rounded-md bg-white/[0.03] p-1 border border-white/5">
              {[
                { key: 'all', label: t('account.common.filters.all') },
                { key: 'settled', label: t('account.common.filters.settled') },
                { key: 'refunded', label: t('account.common.filters.refunded') },
              ].map(item => (
                <Button
                  key={item.key}
                  type="button"
                  onClick={() => setChargeFilter(item.key as typeof chargeFilter)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    chargeFilter === item.key
                      ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'text-slate-400 hover:border-white/5 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Link to="/account/downloads" className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
              {t('account.common.actions.openDownloads')}
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {visibleCharges.length ? visibleCharges.map((item, index) => (
            <motion.div variants={itemVariants} key={item.id || `${item.event_id || item.business_type}-${index}`} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[var(--ecom-surface-hover)]">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-100 truncate">{item.business_type || t('account.billing.records.usageRecord')}</div>
                <div className="mt-1 text-xs text-slate-500 truncate">
                  {[
                    item.scene_code,
                    item.billable_item_code,
                    item.source_type && item.source_id ? `${item.source_type}:${item.source_id}` : item.source_type,
                  ].filter(Boolean).join(' · ') || t('account.billing.records.usageRecord')}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-600">
                  <span>{t('account.billing.records.event')}: {item.event_id}</span>
                  <span>{t('account.billing.records.credits')}: {item.credits_consumed}</span>
                  <span>{t('account.billing.records.walletDebited')}: {item.wallet_debited}</span>
                  <span>{t('account.billing.records.channelState')}: {getCommercialStatusLabel(t, item.channel_status)}</span>
                </div>
              </div>
              <div className="shrink-0 text-left lg:text-right">
                <div className="text-base font-semibold text-slate-100">
                  {item.currency ? `${item.net_amount} ${item.currency}` : item.net_amount}
                </div>
                <div className="mt-1 text-xs text-slate-500">{getCommercialStatusLabel(t, item.status)}</div>
              </div>
            </motion.div>)) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              {chargeFilter === 'all' ? t('account.billing.records.empty') : t('account.billing.records.emptyFiltered')}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}
