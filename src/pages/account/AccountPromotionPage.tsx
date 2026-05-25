import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Gift, Loader2, Share2,Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCommercialStatusLabel } from '@/i18n/helpers'
import { commercialService } from '@/services/commercial'
import type { PromotionCode, PromotionCodeResolve, PromotionConversion, PromotionOverview, PromotionProgram } from '@/types/commercial'
import { useToastStore } from '@/store/toastStore'
import { Button } from '@/components/ui/Button'

function emptyOverview(): PromotionOverview {
  return {
    programs: [],
    codes: [],
    conversions: [],
    total_conversions: 0,
    tracked_conversions: 0,
    earned_conversions: 0,
    reversed_conversions: 0,
    invite_base_url: undefined,
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

export default function AccountPromotionPage() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const [overview, setOverview] = useState<PromotionOverview>(emptyOverview)
  const [programs, setPrograms] = useState<PromotionProgram[]>([])
  const [codes, setCodes] = useState<PromotionCode[]>([])
  const [conversions, setConversions] = useState<PromotionConversion[]>([])
  const [resolvedCode, setResolvedCode] = useState<PromotionCodeResolve | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [conversionStatus, setConversionStatus] = useState<'all' | 'reward_issued' | 'tracked' | 'reversed'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, programsRes, codesRes, conversionsRes] = await Promise.all([
        commercialService.getPromotionOverview(),
        commercialService.getPromotionPrograms(),
        commercialService.getPromotionCodes(),
        commercialService.getPromotionConversions(),
      ])
      setOverview(overviewRes)
      setPrograms(programsRes)
      setCodes(codesRes)
      setConversions(conversionsRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const activeCode = overview.codes[0] || codes[0]
  const primaryProgram = overview.programs[0] || programs[0]

  useEffect(() => {
    if (!activeCode?.code) {
      setResolvedCode(null)
      return
    }
    commercialService.resolvePromotionCode(activeCode.code).then(setResolvedCode).catch(() => setResolvedCode(null))
  }, [activeCode?.code])

  const stats = useMemo(
    () => [
      { label: t('account.promotion.stats.totalConversions'), value: overview.total_conversions },
      { label: t('account.promotion.stats.rewardedConversions'), value: overview.earned_conversions },
      { label: t('account.promotion.stats.trackedConversions'), value: overview.tracked_conversions },
      { label: t('account.promotion.stats.reversedConversions'), value: overview.reversed_conversions },
    ],
    [overview, t],
  )

  const visibleConversions = useMemo(() => {
    if (conversionStatus === 'all') return conversions
    if (conversionStatus === 'tracked') {
      return conversions.filter(item => !['reward_issued', 'commission_earned', 'reversed'].includes(item.status))
    }
    return conversions.filter(item => item.status === conversionStatus || (conversionStatus === 'reward_issued' && item.status === 'commission_earned'))
  }, [conversionStatus, conversions])

  const handleEnsureCode = async () => {
    if (!primaryProgram) return
    setCreating(true)
    try {
      await commercialService.ensurePromotionCode(primaryProgram.program_code)
      showToast(t('account.promotion.toasts.codeReady'), 'success')
      await fetchData()
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    const value = activeCode?.invite_url || activeCode?.signup_url
    if (!value) {
      await handleEnsureCode()
      return
    }
    await navigator.clipboard.writeText(value)
    showToast(t('account.promotion.toasts.linkCopied'), 'success')
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t('account.promotion.title')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('account.promotion.subtitle')}</p>
        </motion.div>
        <Button
          type="button"
          onClick={handleEnsureCode}
          disabled={creating}
          className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-colors active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
          {activeCode ? t('account.common.actions.refreshInvite') : t('account.common.actions.generateInvite')}
        </Button>
      </div>

      <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-white/5 p-2 text-slate-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-slate-100">{t('account.promotion.invite.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('account.promotion.invite.subtitle')}</p>
              
              <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.03] p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('account.promotion.invite.linkLabel')}</div>
                <div className="mt-2 break-all rounded-md bg-white/[0.02] backdrop-blur-xl px-4 py-3 text-sm text-slate-300 font-mono border border-white/5">
                  {activeCode?.invite_url || activeCode?.signup_url || t('account.promotion.invite.noCode')}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleCopy}
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    {t('account.common.actions.copyLink')}
                  </Button>
                  {activeCode?.share_text ? (
                    <div className="text-sm text-slate-500">
                      {activeCode.share_text}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <RuleCard label={t('account.promotion.rules.rewardRule')} value={resolvedCode?.reward_policy_desc || t('account.promotion.rules.pending')} />
          <RuleCard
            label={t('account.promotion.rules.settlementDelay')}
            value={
              typeof resolvedCode?.settlement_delay_days === 'number'
                ? `${resolvedCode.settlement_delay_days} ${t('account.promotion.rules.days')}`
                : t('account.promotion.rules.pending')
            }
          />
          <RuleCard
            label={t('account.promotion.rules.repeatTrigger')}
            value={resolvedCode?.allow_repeat ? t('account.promotion.rules.allowed') : t('account.promotion.rules.singleTrigger')}
          />
        </div>
      </motion.section>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{t('account.promotion.myCodes')}</h2>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {codes.length ? codes.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-[var(--ecom-surface-hover)]">
                <div className="font-medium text-slate-100 font-mono truncate">{item.code}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{getCommercialStatusLabel(t, item.status)}</span>
                  <span className="text-slate-600">{item.created_at}</span>
                </div>
              </motion.div>)) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                {t('account.promotion.noCodes')}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{t('account.promotion.conversions.title')}</h2>
            <div className="flex flex-wrap items-center gap-1 rounded-md bg-white/[0.03] p-1 border border-white/5">
              {[
                { key: 'all', label: t('account.common.filters.all') },
                { key: 'reward_issued', label: t('account.common.filters.rewarded') },
                { key: 'tracked', label: t('account.common.filters.tracked') },
                { key: 'reversed', label: t('account.common.filters.reversed') },
              ].map(item => (
                <Button
                  key={item.key}
                  type="button"
                  onClick={() => setConversionStatus(item.key as typeof conversionStatus)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    conversionStatus === item.key
                      ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'text-slate-400 hover:border-white/5 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {visibleConversions.length ? visibleConversions.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[var(--ecom-surface-hover)]">
                <div className="min-w-0">
                  <div className="font-medium text-slate-100 truncate">{item.trigger_type}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>{t('account.promotion.conversions.commissionAmount')}: <span className="font-medium text-slate-300">{item.commission_amount} {item.commission_currency}</span></span>
                    {(item.reference_type || item.reference_id) ? (
                      <span className="text-xs text-slate-600">· {item.reference_type} · {item.reference_id}</span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-end gap-3 text-right">
                  <div className="text-sm font-medium text-slate-400">{getCommercialStatusLabel(t, item.status)}</div>
                  <Gift className="h-4 w-4 text-slate-500" />
                </div>
              </motion.div>)) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                {conversionStatus === 'all' ? t('account.promotion.conversions.empty') : t('account.promotion.conversions.emptyFiltered')}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}

function RuleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}
