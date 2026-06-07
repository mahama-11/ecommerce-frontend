import { Button } from '@/components/ui/Button'
// ============================================================
// 商品管理页面 (InventoryProductManagePage)
// 对应原 HTML products 页面
// ============================================================

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, ExternalLink, Package } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'

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

export default function InventoryProductManagePage() {
  const { t } = useTranslation()
  const { products, totalProducts, loadingProducts, filter, setFilter, loadProducts } = useInventoryStore()

  const safeProducts = Array.isArray(products) ? products : []
  const safeTotalProducts = typeof totalProducts === 'number' ? totalProducts : 0

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('inventory.products.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('inventory.products.subtitle')}</p>
        </div>
        <Button className="inline-flex items-center gap-2 rounded-xl bg-[var(--ecom-surface)] px-4 py-2 text-sm font-semibold text-[var(--ecom-text-primary)] transition hover:bg-[var(--ecom-surface)]">
          <Plus className="h-4 w-4" />
          {t('inventory.products.addProduct')}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-white">{safeTotalProducts}</div>
          <div className="mt-1 text-xs text-white/40">商品总数</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{safeProducts.filter(p => p.status === 'in_stock').length}</div>
          <div className="mt-1 text-xs text-white/40">在售商品</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{safeProducts.filter(p => p.status === 'low_stock').length}</div>
          <div className="mt-1 text-xs text-white/40">低库存商品</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{safeProducts.filter(p => p.status === 'out_of_stock').length}</div>
          <div className="mt-1 text-xs text-white/40">缺货商品</div>
        </div>
      </div>

      {/* 列表 */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={t('inventory.products.searchPlaceholder') ?? '搜索 SKU 或商品名称...'}
              value={filter.search}
              onChange={e => setFilter({ search: e.target.value })}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 pl-10 text-sm text-white placeholder-white/30 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20"
            />
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          </div>
          <select value={filter.status} onChange={e => setFilter({ status: e.target.value as any })} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:border-white/20">
            <option value="all">{t('inventory.products.allStatus') ?? '全部状态'}</option>
            <option value="in_stock">{t('inventory.products.instock') ?? '有货'}</option>
            <option value="low_stock">{t('inventory.products.lowstock') ?? '低库存'}</option>
            <option value="out_of_stock">{t('inventory.products.outofstock') ?? '缺货'}</option>
          </select>
          <Button onClick={() => { void loadProducts() }} className="rounded-xl bg-brand-400/15 px-4 py-2 text-sm text-brand-100 transition hover:bg-brand-400/25">
            {t('inventory.products.refresh') ?? '刷新'}
          </Button>
        </div>

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
                <th className="px-5 py-3 text-center">{t('inventory.products.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" /></div>
                  </td>
                </tr>
              ) : safeProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-white/40">{t('inventory.products.noData') ?? '暂无商品数据'}</td>
                </tr>
              ) : (
                safeProducts.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-[var(--ecom-surface-hover)]">
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">{p.sku}</td>
                    <td className="px-5 py-3 text-white/90">{p.title}</td>
                    <td className="px-5 py-3 text-white/50">{p.platform}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/80">{p.fbaStock.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-blue-400">{p.inTransit.toLocaleString()}</td>
                    <td className={`px-5 py-3 text-right font-mono ${p.available < 100 ? 'text-red-400' : 'text-white/80'}`}>{p.available.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/60">{p.sales7d.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/60">{p.sales30d.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button className="rounded-lg p-1.5 text-white/40 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white/70">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button className="rounded-lg p-1.5 text-white/40 transition hover:bg-[var(--ecom-surface-hover)] hover:text-white/70">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalProducts > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4 text-sm text-white/50">
            <span>共 {totalProducts} 条</span>
            <div className="flex gap-2">
              <Button onClick={() => setFilter({ page: Math.max(1, filter.page - 1) })} disabled={filter.page <= 1} className="rounded-lg px-3 py-1 text-xs transition hover:bg-[var(--ecom-surface-hover)] disabled:opacity-30">上一页</Button>
              <Button onClick={() => setFilter({ page: filter.page + 1 })} disabled={filter.page >= Math.ceil(totalProducts / filter.pageSize)} className="rounded-lg px-3 py-1 text-xs transition hover:bg-[var(--ecom-surface-hover)] disabled:opacity-30">下一页</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
