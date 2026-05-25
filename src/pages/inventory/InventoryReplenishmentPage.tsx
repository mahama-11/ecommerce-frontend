import { Button } from '@/components/ui/Button'
// ============================================================
// 补货计算页面 (InventoryReplenishmentPage)
// 对应原 HTML replenishment 页面
// CSV 上传 → 参数配置 → 计算 → 结果表格
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Download, Trash2, Calculator, AlertTriangle, FileText } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'
import { parseCsv, exportReplenishmentCsv, downloadTemplateCsv } from '@/services/inventory'
import type { ReplenishmentCalc } from '@/types/inventory'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/30">{sub}</div>}
    </div>
  )
}

function PriorityBadge({ current, safe }: { current: number; safe: number }) {
  const ratio = current / safe
  const cls = ratio < 0.5 ? 'bg-red-400/15 text-red-300' : ratio < 0.7 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'
  const label = ratio < 0.5 ? '高' : ratio < 0.7 ? '中' : '低'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {ratio < 0.5 && <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  )
}

export default function InventoryReplenishmentPage() {
  const { t } = useTranslation()
  const { calculating, calculateReplenishment, clearCurrentCalc } = useInventoryStore()

  const [csvText, setCsvText] = useState('')
  const [safeStockDays] = useState(15)
  const [replenishFactor, setReplenishFactor] = useState(1.0)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [packSize] = useState(10)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('全部')
  const [calcResult, setCalcResult] = useState<ReplenishmentCalc | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 执行计算
  const handleCalculate = useCallback(async () => {
    const result = await calculateReplenishment(safeStockDays, replenishFactor, period)
    setCalcResult(result)
  }, [calculateReplenishment, period, replenishFactor, safeStockDays])

  // 处理 CSV 文件上传
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsvText(text)
    const result = await parseCsv(text)
    if (result.success && result.data.length > 0) {
      void handleCalculate()
    }
  }, [handleCalculate])

  // 填充示例
  const handleSample = () => {
    setCsvText(`SKU,商品名称,历史天数,历史销量,当前库存,在途库存,安全库存
AMZ-EAR-1024,无线蓝牙耳机 Pro,30,1380,1280,300,100
AMZ-CUP-750,不锈钢保温杯 750ml,30,630,42,0,120
AMZ-POW-500,便携充电宝 10000mAh,30,960,320,200,80
AMZ-KEY-200,机械键盘 RGB,30,420,45,0,60`)
    setCalcResult(null)
  }

  // 导出
  const handleExport = () => {
    if (calcResult) exportReplenishmentCsv(calcResult)
  }

  // 清空
  const handleClear = () => {
    setCsvText('')
    setCalcResult(null)
    clearCurrentCalc()
  }

  // 过滤行
  const filteredRows = calcResult?.rows.filter(r => {
    const matchSearch = !search || r.sku.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (priorityFilter === '全部') return true
    const ratio = r.currentStock / (r.avgDailySales * safeStockDays || 1)
    if (priorityFilter === '高') return ratio < 0.5
    if (priorityFilter === '中') return ratio >= 0.5 && ratio < 0.7
    if (priorityFilter === '低') return ratio >= 0.7
    return true
  }) ?? []

  return (
    <div className="space-y-6">
      {/* 头部标题 */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('inventory.replenishment.title')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('inventory.replenishment.subtitle')}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('inventory.replenishment.uploadedSku')} value={calcResult?.rows.length ?? 0} sub={t('inventory.replenishment.waitingUpload')} />
        <StatCard label={t('inventory.replenishment.totalInbound')} value={calcResult?.totalSuggested ?? 0} sub={t('inventory.replenishment.byCycle')} />
        <StatCard label={t('inventory.replenishment.highPriority')} value={filteredRows.filter(r => r.currentStock < (r.avgDailySales * safeStockDays * 0.7)).length} sub={t('inventory.replenishment.below70')} />
        <StatCard label={t('inventory.replenishment.cycleDays')} value={`${period === '7d' ? 7 : period === '30d' ? 15 : 30} ${t('inventory.replenishment.days')}`} sub={t('inventory.replenishment.switchable')} />
      </div>

      {/* 两列布局：CSV上传 + 参数配置 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CSV 上传 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{t('inventory.replenishment.uploadSkuHistory')}</h3>
              <p className="mt-0.5 text-xs text-white/40">{t('inventory.replenishment.csvHint')}</p>
            </div>
          </div>

          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          {/* 上传区 */}
          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center transition hover:border-[var(--ecom-border)]/30 hover:bg-[var(--ecom-surface)]/5">
            <Upload className="mb-3 h-8 w-8 text-white/30" />
            <strong className="text-sm text-white/70">{t('inventory.replenishment.clickUpload')}</strong>
            <p className="mt-1 text-xs text-white/30">{t('inventory.replenishment.csvFields')}</p>
          </label>

          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`${t('inventory.replenishment.pasteHint')}\nSKU,商品名称,历史天数,历史销量,当前库存,在途库存,安全库存\nAMZ-EAR-1024,无线蓝牙耳机 Pro,30,1380,1280,300,100`}
            className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20 font-mono"
            rows={6}
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => handleCalculate()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ecom-surface)] px-4 py-2 text-sm font-semibold text-[var(--ecom-text-primary)] transition hover:bg-[var(--ecom-surface)] disabled:opacity-50" disabled={calculating}>
              <Calculator className="h-4 w-4" />
              {calculating ? t('inventory.replenishment.calculating') : t('inventory.replenishment.calculate')}
            </Button>
            <Button onClick={handleSample} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition hover:bg-[var(--ecom-surface-hover)]">
              <FileText className="h-4 w-4" />
              {t('inventory.replenishment.fillSample')}
            </Button>
            <Button onClick={() => downloadTemplateCsv()} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition hover:bg-[var(--ecom-surface-hover)]">
              <Download className="h-4 w-4" />
              {t('inventory.replenishment.downloadTemplate')}
            </Button>
            <Button onClick={handleClear} className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-400/20">
              <Trash2 className="h-4 w-4" />
              {t('inventory.replenishment.clearData')}
            </Button>
          </div>
        </div>

        {/* 参数配置 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
          <h3 className="mb-4 text-base font-semibold text-white">{t('inventory.replenishment.calcParams')}</h3>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-medium text-white/60">{t('inventory.replenishment.turnoverCycle')}</label>
              <select value={period} onChange={e => setPeriod(e.target.value as typeof period)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20">
                <option value="7d">7 {t('inventory.replenishment.daysCycle')}</option>
                <option value="30d">15 {t('inventory.replenishment.daysCycle')}</option>
                <option value="90d">30 {t('inventory.replenishment.daysCycle')}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-white/60">{t('inventory.replenishment.replenishMultiple')}</label>
              <input type="number" step="0.1" min="0.5" max="3" value={replenishFactor} onChange={e => setReplenishFactor(Number(e.target.value))} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" />
              <p className="mt-1.5 text-xs text-white/30">{t('inventory.replenishment.replenishHint')}</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-white/60">{t('inventory.replenishment.minUnit')}</label>
              <input type="number" min="1" value={packSize} readOnly className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20" />
              <p className="mt-1.5 text-xs text-white/30">{t('inventory.replenishment.minUnitHint')}</p>
            </div>

            {/* 计算公式 */}
            <div className="rounded-xl border border-[var(--ecom-border)]/20 bg-[var(--ecom-surface)]/8 p-4">
              <div className="text-xs font-semibold text-[var(--ecom-text-primary)]">{t('inventory.replenishment.formula')}</div>
              <div className="mt-2 space-y-1 text-xs text-white/50 font-mono leading-relaxed">
                <div>{t('inventory.replenishment.formula1')}</div>
                <div>{t('inventory.replenishment.formula2')}</div>
                <div>{t('inventory.replenishment.formula3')}</div>
                <div>{t('inventory.replenishment.formula4')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 计算结果概览 */}
      {calcResult && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
          <h3 className="mb-4 text-base font-semibold text-white">{t('inventory.replenishment.calcResultOverview')}</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <div className="text-lg font-bold text-white">{calcResult.rows.reduce((s, r) => s + r.avgDailySales, 0).toFixed(1)}</div>
              <div className="mt-1 text-xs text-white/40">{t('inventory.replenishment.avgDailySales')}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <div className="text-lg font-bold text-white">{calcResult.rows.reduce((s, r) => s + r.avgDailySales * (period === '7d' ? 7 : period === '30d' ? 15 : 30), 0).toFixed(0)}</div>
              <div className="mt-1 text-xs text-white/40">{t('inventory.replenishment.targetStockTotal')}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <div className="text-lg font-bold text-white">{calcResult.rows.reduce((s, r) => s + r.currentStock, 0)}</div>
              <div className="mt-1 text-xs text-white/40">{t('inventory.replenishment.currentStockTotal')}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <div className="text-lg font-bold text-white">{calcResult.rows.reduce((s, r) => s + r.inTransit, 0)}</div>
              <div className="mt-1 text-xs text-white/40">{t('inventory.replenishment.onwayStockTotal')}</div>
            </div>
          </div>
        </div>
      )}

      {/* 结果表格 */}
      {calcResult && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <input
              type="text"
              placeholder={t('inventory.replenishment.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="min-w-[200px] flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 pl-10 text-sm text-white placeholder-white/30 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20"
            />
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20">
              <option value="全部">{t('inventory.replenishment.allPriority')}</option>
              <option value="高">{t('inventory.replenishment.highPriorityOpt')}</option>
              <option value="中">{t('inventory.replenishment.midPriority')}</option>
              <option value="低">{t('inventory.replenishment.lowPriority')}</option>
            </select>
            <Button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl bg-[var(--ecom-surface)] px-4 py-2 text-sm font-semibold text-[var(--ecom-text-primary)] transition hover:bg-[var(--ecom-surface)]">
              <Download className="h-4 w-4" />
              {t('inventory.replenishment.exportResult')}
            </Button>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">{t('inventory.replenishment.thSku')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thHistoryDays')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thHistorySales')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thAvgDaily')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thCurrentStock')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thInTransit')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thSafeStock')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thTargetStock')}</th>
                  <th className="px-4 py-3 text-right">{t('inventory.replenishment.thSuggested')}</th>
                  <th className="px-4 py-3 text-center">{t('inventory.replenishment.thPriority')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-white/40">
                      {t('inventory.replenishment.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => {
                    const targetStock = row.avgDailySales * (period === '7d' ? 7 : period === '30d' ? 15 : 30)
                    return (
                      <tr key={row.sku} className="border-b border-white/[0.04] hover:bg-[var(--ecom-surface-hover)]">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-cyan-400">{row.sku}</div>
                          <div className="mt-0.5 text-xs text-white/50">{row.title}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{period === '7d' ? 7 : period === '30d' ? 30 : 90}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{period === '7d' ? row.sales7d : row.sales30d}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{row.avgDailySales.toFixed(1)}</td>
                        <td className={`px-4 py-3 text-right font-mono ${row.currentStock < 50 ? 'text-red-400' : 'text-white/80'}`}>{row.currentStock}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-400">{row.inTransit}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{Math.ceil(row.avgDailySales * safeStockDays)}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{Math.ceil(targetStock)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${row.suggestedQty > 0 ? 'text-[var(--ecom-text-primary)]' : 'text-white/40'}`}>{row.suggestedQty}</td>
                        <td className="px-4 py-3 text-center">
                          <PriorityBadge current={row.currentStock} safe={Math.ceil(row.avgDailySales * safeStockDays)} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/[0.06] px-5 py-3 text-xs text-white/30">
            {t('inventory.replenishment.recordCount', { count: filteredRows.length })}
          </div>
        </div>
      )}
    </div>
  )
}
