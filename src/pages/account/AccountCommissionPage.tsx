import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Coins, Gift, Loader2, ShieldCheck, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCommercialStatusLabel } from '@/i18n/helpers'
import { commercialService } from '@/services/commercial'
import type { ChannelBindingView, ChannelCommissionView, ChannelOverview, ChannelSettlementView, CommissionLedger, CommissionOverview } from '@/types/commercial'
import { useToastStore } from '@/store/toastStore'

function emptyCommissionOverview(): CommissionOverview {
  return {
    commissions: [],
    total_commission: 0,
    earned_commission: 0,
    pending_commission: 0,
    reversed_commission: 0,
    redeemed_commission: 0,
    redeemable_commission: 0,
    redeem_target_asset_code: 'ECOMMERCE_PROMO_CREDIT',
  }
}

function emptyChannelOverview(): ChannelOverview {
  return {
    partners: [],
    current_bindings: [],
    total_commission: 0,
    pending_commission: 0,
    earned_commission: 0,
    settled_commission: 0,
    reversed_commission: 0,
    settlement_count: 0,
    recent_settlements: [],
  }
}


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

export default function AccountCommissionPage() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const [overview, setOverview] = useState<CommissionOverview>(emptyCommissionOverview)
  const [commissions, setCommissions] = useState<CommissionLedger[]>([])
  const [channelOverview, setChannelOverview] = useState<ChannelOverview>(emptyChannelOverview)
  const [bindings, setBindings] = useState<ChannelBindingView[]>([])
  const [channelCommissions, setChannelCommissions] = useState<ChannelCommissionView[]>([])
  const [settlements, setSettlements] = useState<ChannelSettlementView[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'earned' | 'redeemed' | 'pending' | 'reversed'>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | 'pending' | 'earned' | 'settled' | 'reversed'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, commissionsRes, channelOverviewRes, bindingsRes, channelCommissionsRes, settlementsRes] = await Promise.all([
        commercialService.getCommissionOverview(),
        commercialService.getReferralCommissions(),
        commercialService.getChannelOverview(),
        commercialService.getChannelBindings(),
        commercialService.getChannelCommissions(),
        commercialService.getChannelSettlements(),
      ])
      setOverview(overviewRes)
      setCommissions(commissionsRes)
      setChannelOverview(channelOverviewRes)
      setBindings(bindingsRes)
      setChannelCommissions(channelCommissionsRes)
      setSettlements(settlementsRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const stats = useMemo(
    () => [
      { label: t('account.commission.stats.totalCommission'), value: overview.total_commission },
      { label: t('account.commission.stats.redeemable'), value: overview.redeemable_commission },
      { label: t('account.commission.stats.pending'), value: overview.pending_commission },
      { label: t('account.commission.stats.redeemed'), value: overview.redeemed_commission },
    ],
    [overview, t],
  )

  const visibleCommissions = useMemo(() => {
    if (ledgerFilter === 'all') return commissions
    return commissions.filter(item => item.status === ledgerFilter)
  }, [commissions, ledgerFilter])

  const visibleChannelCommissions = useMemo(() => {
    if (channelFilter === 'all') return channelCommissions
    if (channelFilter === 'earned') {
      return channelCommissions.filter(item => ['earned', 'settlement_in_progress'].includes(item.ledger.status))
    }
    if (channelFilter === 'reversed') {
      return channelCommissions.filter(item => ['reversed', 'void'].includes(item.ledger.status))
    }
    return channelCommissions.filter(item => item.ledger.status === channelFilter)
  }, [channelCommissions, channelFilter])

  const handleRedeem = async () => {
    if (overview.redeemable_commission <= 0) return
    setRedeeming(true)
    try {
      const result = await commercialService.redeemCommissions()
      showToast(t('account.commission.toast.redeemedTo', { amount: result.total_amount, asset: result.asset_code }), 'success')
      await fetchData()
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.commission.title')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('account.commission.subtitle')}</p>
        </motion.div>
        <button
          type="button"
          onClick={handleRedeem}
          disabled={redeeming || overview.redeemable_commission <= 0}
          className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          {t('account.common.actions.redeemCommission')}
        </button>
      </div>

      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((item) => (
          <motion.div variants={itemVariants} key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : item.value}
            </div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 px-6 py-5">
          <h2 className="font-medium text-slate-100">{t('account.commission.sections.referral')}</h2>
          <div className="flex flex-wrap items-center gap-1 rounded-md bg-white/[0.03] p-1 border border-white/5">
            {[
              { key: 'all', label: t('account.common.filters.all') },
              { key: 'earned', label: t('account.common.filters.earned') },
              { key: 'pending', label: t('account.common.filters.pending') },
              { key: 'redeemed', label: t('account.common.filters.redeemed') },
              { key: 'reversed', label: t('account.common.filters.reversed') },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setLedgerFilter(item.key as typeof ledgerFilter)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  ledgerFilter === item.key
                    ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                    : 'text-slate-400 hover:border-white/5 hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {visibleCommissions.length ? visibleCommissions.map((item) => (
            <motion.div variants={itemVariants} key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-white/[0.03]">
              <div className="min-w-0">
                <div className="font-medium text-slate-100 truncate">{getCommercialStatusLabel(t, item.status)}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-300">{item.amount} {item.currency}</span>
                  {item.reference_type || item.reference_id ? (
                    <span className="text-xs text-slate-600">· {item.reference_type} · {item.reference_id}</span>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0">
                <Wallet className="h-5 w-5 text-slate-500" />
              </div>
            </motion.div>)) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              {ledgerFilter === 'all' ? t('account.commission.empty.referral') : t('account.commission.empty.referralFiltered')}
            </div>
          )}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t('account.commission.stats.totalChannelCommission'), value: channelOverview.total_commission },
              { label: t('account.commission.stats.settled'), value: channelOverview.settled_commission },
              { label: t('account.commission.stats.bindings'), value: bindings.length },
              { label: t('account.commission.stats.settlements'), value: channelOverview.settlement_count },
            ].map((item) => (
              <motion.div variants={itemVariants} key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : item.value}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 px-6 py-5">
              <h2 className="font-medium text-slate-100">{t('account.commission.sections.channelLedgers')}</h2>
              <div className="flex flex-wrap items-center gap-1 rounded-md bg-white/[0.03] p-1 border border-white/5">
                {[
                  { key: 'all', label: t('account.common.filters.all') },
                  { key: 'pending', label: t('account.common.filters.pending') },
                  { key: 'earned', label: t('account.common.filters.earned') },
                  { key: 'settled', label: t('account.common.filters.settled') },
                  { key: 'reversed', label: t('account.common.filters.reversed') },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setChannelFilter(item.key as typeof channelFilter)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      channelFilter === item.key
                        ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                        : 'text-slate-400 hover:border-white/5 hover:text-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {visibleChannelCommissions.length ? visibleChannelCommissions.map((item) => (
                <motion.div variants={itemVariants} key={item.ledger.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-100 truncate">{item.partner?.name || item.ledger.channel_partner_id}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="font-medium text-slate-300">{item.ledger.commission_amount} {item.ledger.currency}</span>
                      <span className="text-xs text-slate-600">· {item.ledger.billable_item_code}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-end gap-3">
                    <div className="text-sm font-medium text-slate-400">{getCommercialStatusLabel(t, item.ledger.status)}</div>
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                  </div>
                </motion.div>)) : (
                <div className="px-6 py-8 text-center text-sm text-slate-500">
                  {channelFilter === 'all' ? t('account.commission.empty.channelLedgers') : t('account.commission.empty.channelLedgersFiltered')}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <div className="flex flex-col gap-6">
          <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col">
            <div className="border-b border-white/5 px-6 py-5">
              <h2 className="font-medium text-slate-100">{t('account.commission.stats.bindings')}</h2>
            </div>
            <div className="flex-1 divide-y divide-white/5">
              {bindings.length ? bindings.map((item) => (
                <motion.div variants={itemVariants} key={item.binding.id} className="flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                  <div className="font-medium text-slate-100 truncate">{item.partner?.name || item.binding.channel_partner_id}</div>
                  <div className="text-sm text-slate-500 truncate">{item.program?.name || item.binding.channel_program_id}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">{getCommercialStatusLabel(t, item.binding.status)}</span>
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                </motion.div>)) : (
                <div className="px-6 py-8 text-center text-sm text-slate-500">
                  {t('account.commission.empty.bindings')}
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col">
            <div className="border-b border-white/5 px-6 py-5">
              <h2 className="font-medium text-slate-100">{t('account.commission.sections.channelSettlements')}</h2>
            </div>
            <div className="flex-1 divide-y divide-white/5">
              {settlements.length ? settlements.map((item) => (
                <motion.div variants={itemVariants} key={item.item.id} className="flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                  <div className="font-medium text-slate-100 truncate">{item.partner?.name || item.item.channel_partner_id}</div>
                  <div className="text-sm font-medium text-slate-300">
                    {item.item.net_amount} {item.item.currency}
                  </div>
                  <div className="text-xs text-slate-600 truncate">{item.batch?.batch_no || item.item.settlement_batch_id}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">{getCommercialStatusLabel(t, item.item.status)}</span>
                    <Coins className="h-4 w-4 text-slate-500" />
                  </div>
                </motion.div>)) : (
                <div className="px-6 py-8 text-center text-sm text-slate-500">
                  {t('account.commission.empty.channelSettlements')}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </motion.section>
    </motion.div>
  )
}
