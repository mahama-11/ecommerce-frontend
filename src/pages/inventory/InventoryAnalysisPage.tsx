// ============================================================
// 销售分析页面 (InventoryAnalysisPage)
// 对应原 HTML analysis 页面
// ============================================================

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, BarChart3, DollarSign, ShoppingCart } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'

export default function InventoryAnalysisPage() {
  const { t } = useTranslation()
  const { salesAnalysis, loadSales } = useInventoryStore()

  useEffect(() => {
    void loadSales('30d')
  }, [loadSales])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('inventory.analysis.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('inventory.analysis.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => { void loadSales(p) }}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                salesAnalysis?.period === p
                  ? 'bg-[#ff9900] text-[#111827] font-semibold'
                  : 'border border-white/[0.08] bg-white/[0.05] text-white/60 hover:bg-white/[0.09]'
              }`}
            >
              {p === '7d' ? t('inventory.analysis.period7d') : p === '30d' ? t('inventory.analysis.period30d') : t('inventory.analysis.period90d')}
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <ShoppingCart className="h-4 w-4" />
            {t('inventory.analysis.totalSales')}
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{salesAnalysis?.totalSales.toLocaleString() ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <DollarSign className="h-4 w-4" />
            {t('inventory.analysis.totalRevenue')}
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">${salesAnalysis?.totalRevenue.toLocaleString() ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            <BarChart3 className="h-4 w-4" />
            {t('inventory.analysis.totalOrders')}
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{salesAnalysis?.totalOrders.toLocaleString() ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
            {salesAnalysis && salesAnalysis.returnRate > 3 ? <TrendingDown className="h-4 w-4 text-red-400" /> : <TrendingUp className="h-4 w-4 text-emerald-400" />}
            {t('inventory.analysis.returnRate')}
          </div>
          <div className={`mt-2 text-3xl font-bold ${(salesAnalysis?.returnRate ?? 0) > 3 ? 'text-red-400' : 'text-white'}`}>
            {salesAnalysis?.returnRate.toFixed(1) ?? '—'}%
          </div>
        </div>
      </div>

      {/* 热销 SKU */}
      {salesAnalysis && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">{t('inventory.analysis.topSku')}</h3>
            <p className="mt-1 text-sm text-white/50">{t('inventory.analysis.topSkuSales')}: <strong className="text-[#ffb84d]">{salesAnalysis.topSku}</strong> — {salesAnalysis.topSkuSales.toLocaleString()}</p>
          </div>

          {/* 简易柱状图 */}
          <div className="space-y-2">
            {salesAnalysis.dataPoints.slice(-14).map((dp) => {
              const max = Math.max(...salesAnalysis.dataPoints.map(d => d.sales))
              const width = max > 0 ? (dp.sales / max) * 100 : 0
              return (
                <div key={dp.date} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-white/40 font-mono">{dp.date.slice(5)}</span>
                  <div className="flex-1 h-5 overflow-hidden rounded-full bg-[#ff9900]/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#ff9900]/60 to-[#ffb84d]" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs font-mono text-white/70">{dp.sales}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}