import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Coins, CreditCard, History, PackageCheck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resolveAppLocale } from '@/i18n/helpers'
import { useAuth } from '@/hooks/useAuth'
import { commercialService } from '@/services/commercial'
import type { BillingSummary, CommercialOrderView, CommissionOverview, PromotionOverview, WalletHistoryEntry, WalletSummary } from '@/types/commercial'
import { buildAssetBalanceMap, formatMoney, formatPackageName, formatWalletHistoryAmount, getCurrentSubscription } from '@/utils/commercialDisplay'

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

export default function AccountAssetsPage() {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language)
  const { user, access } = useAuth({ refreshOnMount: false })
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [promotionOverview, setPromotionOverview] = useState<PromotionOverview | null>(null)
  const [commissionOverview, setCommissionOverview] = useState<CommissionOverview | null>(null)
  const [orders, setOrders] = useState<CommercialOrderView[]>([])
  const [history, setHistory] = useState<WalletHistoryEntry[]>([])

  useEffect(() => {
    void Promise.all([
      commercialService.getWalletSummary(),
      commercialService.listOrders(),
      commercialService.getWalletHistory(5),
      commercialService.getBillingSummary(),
      commercialService.getPromotionOverview(),
      commercialService.getCommissionOverview(),
    ]).then(([wallet, orderResult, walletHistory, billing, promotion, commission]) => {
      setWalletSummary(wallet)
      setOrders(orderResult.items || [])
      setHistory(walletHistory.items || [])
      setBillingSummary(billing)
      setPromotionOverview(promotion)
      setCommissionOverview(commission)
    })
  }, [])

  const quickCards = [
    { to: '/account/history', title: t('account.assets.cards.history.title'), desc: t('account.assets.cards.history.desc'), icon: History },
    { to: '/account/billing', title: t('account.assets.cards.billing.title'), desc: t('account.assets.cards.billing.desc'), icon: CreditCard },
    { to: '/account/promotion', title: t('account.assets.cards.promotion.title'), desc: t('account.assets.cards.promotion.desc'), icon: Wallet },
    { to: '/account/commission', title: t('account.assets.cards.commission.title'), desc: t('account.assets.cards.commission.desc'), icon: Coins },
  ]

  const assetMap = useMemo(() => buildAssetBalanceMap(walletSummary), [walletSummary])
  const currentSubscription = useMemo(() => getCurrentSubscription(orders), [orders])

  const stats = useMemo(
    () => [
      { label: t('account.assets.stats.currentPlan'), value: formatPackageName(currentSubscription?.order?.package_code, locale) || '-' },
      { label: t('account.assets.stats.remainingCredits'), value: `${assetMap.get('ECOMMERCE_MONTHLY_ALLOWANCE') || 0}` },
      { label: t('account.assets.stats.walletBalance'), value: formatMoney(assetMap.get('ECOMMERCE_CASH') || 0) },
      { label: t('account.assets.stats.promotionConversions'), value: `${promotionOverview?.total_conversions ?? 0}` },
      { label: t('account.assets.stats.redeemableCommission'), value: `${commissionOverview?.redeemable_commission ?? 0}` },
      { label: t('account.assets.stats.billingRecords'), value: `${billingSummary?.charge_count ?? 0}` },
      { label: t('account.assets.stats.primaryRole'), value: access?.product_roles?.[0] || user?.org_role || '-' },
      { label: locale === 'zh' ? '已购套餐' : 'Purchased plans', value: `${orders.filter(item => item.order?.status === 'fulfilled').length}` },
    ],
    [access?.product_roles, assetMap, billingSummary?.charge_count, commissionOverview?.redeemable_commission, currentSubscription?.order?.package_code, locale, orders, promotionOverview?.total_conversions, t, user?.org_role],
  )

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.assets.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('account.assets.subtitle')}</p>
        </motion.div>

      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((item) => (
          <motion.div variants={itemVariants} key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickCards.map(item => (
          <Link key={item.to} to={item.to} className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-all hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-slate-100 transition-colors group-hover:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
        </div>
              <div className="rounded-md bg-white/5 p-2 text-slate-400 transition-colors group-hover:bg-white/10 group-hover:text-slate-100">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-slate-400 opacity-0 transition-all group-hover:text-slate-300 group-hover:opacity-100">
              {t('common.startUsing')}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium text-slate-100">{locale === 'zh' ? '当前套餐' : 'Current package'}</h2>
              <p className="mt-2 text-2xl font-semibold text-white">{formatPackageName(currentSubscription?.order?.package_code, locale) || '-'}</p>
              <p className="mt-2 text-sm text-slate-400">
                {currentSubscription?.order
                  ? (locale === 'zh'
                    ? `实付 ${formatMoney(currentSubscription.order.total_amount)}，状态 ${currentSubscription.order.status}`
                    : `Paid ${formatMoney(currentSubscription.order.total_amount)}, status ${currentSubscription.order.status}`)
                  : (locale === 'zh' ? '还没有已生效套餐' : 'No active package yet')}
              </p>
            </div>
            <div className="rounded-md bg-white/5 p-3 text-slate-200">
              <PackageCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{locale === 'zh' ? '支付余额' : 'Payment balance'}</div>
              <div className="mt-2 text-xl font-semibold text-white">{formatMoney(assetMap.get('ECOMMERCE_CASH') || 0)}</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{locale === 'zh' ? '月额度 / Quota' : 'Monthly allowance / Quota'}</div>
              <div className="mt-2 text-xl font-semibold text-white">{assetMap.get('ECOMMERCE_MONTHLY_ALLOWANCE') || 0}</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{locale === 'zh' ? '永久积分 / Credit' : 'Permanent credit'}</div>
              <div className="mt-2 text-xl font-semibold text-white">{assetMap.get('ECOMMERCE_CREDIT') || 0}</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">{locale === 'zh' ? '活动积分 / Promo' : 'Promo credit'}</div>
              <div className="mt-2 text-xl font-semibold text-white">{assetMap.get('ECOMMERCE_PROMO_CREDIT') || 0}</div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h2 className="font-medium text-slate-100">{locale === 'zh' ? '最近购买' : 'Recent purchases'}</h2>
            <Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-slate-100">{locale === 'zh' ? '购买套餐' : 'Buy plan'}</Link>
          </div>
          <div className="divide-y divide-white/5">
            {orders.slice(0, 4).length ? orders.slice(0, 4).map(item => (
              <motion.div variants={itemVariants} key={item.order?.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">{formatPackageName(item.order?.package_code, locale)}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{item.order?.created_at ? new Date(item.order.created_at).toLocaleString() : ''}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-emerald-300">{formatMoney(item.order?.total_amount || 0)}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.order?.status || '-'}</div>
                </div>
              </motion.div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">{locale === 'zh' ? '暂无购买记录' : 'No purchase records yet'}</div>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="font-medium text-slate-100">{locale === 'zh' ? '最近资产流水' : 'Recent wallet activity'}</h2>
          <Link to="/account/history" className="text-sm font-medium text-slate-400 hover:text-slate-100">{locale === 'zh' ? '查看全部' : 'See all'}</Link>
        </div>
        <div className="divide-y divide-white/5">
          {history.length ? history.map(item => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.03]">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">{item.title}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{item.description || item.asset_code || '-'}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-sm font-semibold ${item.direction === 'credit' ? 'text-emerald-300' : 'text-orange-300'}`}>{formatWalletHistoryAmount(item)}</div>
                <div className="mt-1 text-xs text-slate-500">{item.occurred_at ? new Date(item.occurred_at).toLocaleString() : ''}</div>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">{locale === 'zh' ? '暂无流水记录' : 'No wallet activity yet'}</div>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}
