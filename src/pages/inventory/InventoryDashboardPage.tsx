// ============================================================
// 库存总览页面 (InventoryDashboardPage)
// 对应原 HTML overview 页面
// ============================================================

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  alert,
  loading,
}: {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  alert?: 'danger' | 'warning' | 'normal'
  loading?: boolean
}) {
  const trendColor = trend && trend > 0 ? 'text-emerald-400' : trend && trend < 0 ? 'text-red-400' : 'text-white/40'
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-sm transition hover:bg-white/[0.07]">
      {loading ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : (
        <>
          <div className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</div>
          <div className="mt-2 text-3xl font-bold text-white">{value?.toLocaleString()}</div>
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend > 0 ? '+' : ''}{trend}%</span>
              {trendLabel && <span className="text-white/30 ml-1">{trendLabel}</span>}
            </div>
          )}
          {alert && (
            <div className={`mt-2 text-xs ${alert === 'danger' ? 'text-red-400' : alert === 'warning' ? 'text-amber-400' : 'text-white/40'}`}>
              {alert === 'danger' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              {trendLabel}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in_stock: { label: '有货', cls: 'bg-emerald-400/15 text-emerald-300' },
    low_stock: { label: '低库存', cls: 'bg-amber-400/15 text-amber-300' },
    out_of_stock: { label: '缺货', cls: 'bg-red-400/15 text-red-300' },
    in_transit: { label: '在途', cls: 'bg-blue-400/15 text-blue-300' },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-white/10 text-white/60' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function InventoryDashboardPage() {
  const { t } = useTranslation()
  const {
    stats, loadingStats,
    products, totalProducts, loadingProducts,
    filter, setFilter, loadStats, loadProducts,
  } = useInventoryStore()

  useEffect(() => {
    void loadStats()
    void loadProducts()
  }, [loadStats, loadProducts])

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('inventory.dashboard.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('inventory.dashboard.subtitle')}</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('inventory.dashboard.totalStock')}
          value={stats?.totalQuantity ?? '—'}
          trend={stats?.totalQuantityTrend}
          trendLabel={t('inventory.dashboard.trend')}
          loading={loadingStats}
        />
        <StatCard
          label={t('inventory.dashboard.skuCount')}
          value={stats?.skuCount ?? '—'}
          trendLabel={`+${stats?.skuCountNew ?? 0} ${t('inventory.dashboard.newSku')}`}
          loading={loadingStats}
        />
        <StatCard
          label={t('inventory.dashboard.lowStock')}
          value={stats?.lowStockCount ?? '—'}
          alert={stats?.lowStockTrend}
          trendLabel={t('inventory.dashboard.needReplenish')}
          loading={loadingStats}
        />
        <StatCard
          label={t('inventory.dashboard.stockDays')}
          value={stats?.stockDays ?? '—'}
          trend={stats?.stockDaysChange}
          trendLabel="天"
          loading={loadingStats}
        />
      </div>

      {/* 次要指标 */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats?.inTransitCount ?? '—'}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.dashboard.inTransit')}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats?.outboundOrders ?? '—'}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.dashboard.outboundOrders')}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats?.pendingInbound ?? '—'}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.dashboard.pendingInbound')}</div>
        </div>
      </div>

      {/* 库存列表 */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索 SKU 或商品名称..."
              value={filter.search}
              onChange={e => setFilter({ search: e.target.value })}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 pl-10 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.07]"
            />
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          </div>

          <select
            value={filter.status}
            onChange={e => setFilter({ status: e.target.value as any })}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 outline-none focus:border-white/20"
          >
            <option value="all">全部状态</option>
            <option value="in_stock">有货</option>
            <option value="low_stock">低库存</option>
            <option value="out_of_stock">缺货</option>
            <option value="in_transit">在途</option>
          </select>

          <select
            value={filter.platform}
            onChange={e => setFilter({ platform: e.target.value as any })}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 outline-none focus:border-white/20"
          >
            <option value="all">全部平台</option>
            <option value="amazon">Amazon</option>
            <option value="shopee">Shopee</option>
            <option value="lazada">Lazada</option>
          </select>

          <button
            onClick={() => { void loadProducts() }}
            className="rounded-xl bg-brand-400/15 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-400/25"
          >
            刷新
          </button>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                <th className="px-5 py-3">{t('inventory.products.sku')}</th>
                <th className="px-5 py-3">{t('inventory.products.title_col')}</th>
                <th className="px-5 py-3">{t('inventory.products.platform')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.products.fbaStock')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.products.inTransit')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.products.available')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.products.sales7d')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.products.sales30d')}</th>
                <th className="px-5 py-3 text-center">{t('inventory.products.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-white/40">
                    暂无库存数据
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr
                    key={product.id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">{product.sku}</td>
                    <td className="px-5 py-3 text-white/90">{product.title}</td>
                    <td className="px-5 py-3 text-white/50">{product.platform}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/80">{product.fbaStock.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-blue-400">{product.inTransit.toLocaleString()}</td>
                    <td className={`px-5 py-3 text-right font-mono ${product.available < 100 ? 'text-red-400' : 'text-white/80'}`}>
                      {product.available.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white/60">{product.sales7d.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/60">{product.sales30d.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center"><StatusBadge status={product.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalProducts > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4 text-sm text-white/50">
            <span>
              共 {totalProducts} 条，第 {filter.page}/{Math.ceil(totalProducts / filter.pageSize)} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter({ page: Math.max(1, filter.page - 1) })}
                disabled={filter.page <= 1}
                className="rounded-lg px-3 py-1 text-xs transition hover:bg-white/[0.07] disabled:opacity-30"
              >
                上一页
              </button>
              <button
                onClick={() => setFilter({ page: filter.page + 1 })}
                disabled={filter.page >= Math.ceil(totalProducts / filter.pageSize)}
                className="rounded-lg px-3 py-1 text-xs transition hover:bg-white/[0.07] disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}