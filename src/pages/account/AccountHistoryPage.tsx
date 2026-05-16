import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getCommercialAssetLabel,
  getCommercialStatusLabel,
  getWalletHistoryTitleLabel,
  resolveAppLocale,
} from '@/i18n/helpers'
import { commercialService } from '@/services/commercial'
import { formatWalletHistoryAmount, getWalletHistoryAssetSummary } from '@/utils/commercialDisplay'
import type { WalletHistoryEntry } from '@/types/commercial'

type HistoryFilter = 'all' | 'cash' | 'quota' | 'credits'


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

export default function AccountHistoryPage() {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language)
  const [entries, setEntries] = useState<WalletHistoryEntry[]>([])
  const [filter, setFilter] = useState<HistoryFilter>('all')

  useEffect(() => {
    void commercialService.getWalletHistory(100).then(result => setEntries(result.items || []))
  }, [])

  const visibleEntries = useMemo(() => {
    if (filter === 'all') return entries
    if (filter === 'cash') return entries.filter(item => item.asset_code === 'ECOMMERCE_CASH')
    if (filter === 'quota') return entries.filter(item => item.asset_code === 'ecommerce.image.generate')
    return entries.filter(item => item.asset_code === 'ECOMMERCE_CREDIT' || item.asset_code === 'ECOMMERCE_PROMO_CREDIT')
  }, [entries, filter])

  const filters: HistoryFilter[] = ['all', 'cash', 'quota', 'credits']

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.history.title')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('account.history.subtitle')}</p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="font-medium text-slate-100">{t('account.history.filterTitle')}</h2>
          <p className="text-sm text-slate-400">{t('account.history.filterSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-white/[0.03] p-1 border border-white/5">
          {filters.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === item
                  ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:border-white/5 hover:text-slate-100'
              }`}
            >
              {historyFilterLabel(item, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleEntries.length ? visibleEntries.map((entry) => (
          <motion.div variants={itemVariants} key={entry.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10 hover:bg-white/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <Filter className="h-3 w-3" />
                  {getCommercialAssetLabel(t, entry.asset_code)}
                </span>
                <div className="text-xs text-slate-500">{entry.occurred_at ? new Date(entry.occurred_at).toLocaleString() : ''}</div>
              </div>
              <div className="mt-3 text-base font-medium text-slate-100 transition-colors group-hover:text-white truncate">
                {getWalletHistoryTitleLabel(t, entry)}
              </div>
              <div className="mt-1 text-sm text-slate-400 break-words">
                {getWalletHistoryAssetSummary(t, entry)}
              </div>
              <div className="mt-1 text-xs text-slate-500">{getCommercialStatusLabel(t, entry.status)}</div>
            </div>
            <div className={`shrink-0 text-right text-lg font-semibold ${entry.direction === 'credit' ? 'text-emerald-300' : 'text-orange-300'}`}>
              {formatWalletHistoryAmount(t, entry)}
            </div>
          </motion.div>)) : (
          <div className="rounded-xl border border-dashed border-white/5 bg-white/5/20 p-12 text-center text-sm font-medium text-slate-500">
            {t('account.history.empty')}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function historyFilterLabel(filter: HistoryFilter, locale: string) {
  switch (filter) {
    case 'cash':
      return locale === 'zh' ? '现金' : 'Cash'
    case 'quota':
      return locale === 'zh' ? '额度' : 'Quota'
    case 'credits':
      return locale === 'zh' ? '积分' : 'Credits'
    default:
      return locale === 'zh' ? '全部' : 'All'
  }
}
