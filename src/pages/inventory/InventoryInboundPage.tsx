// ============================================================
// FBA 入库记录页面 (InventoryInboundPage)
// 对应原 HTML inbound 页面
// ============================================================

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useInventoryStore } from '@/store/inventoryStore'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '待处理', cls: 'bg-white/10 text-white/60' },
    in_transit: { label: '运输中', cls: 'bg-blue-400/15 text-blue-300' },
    received: { label: '已入库', cls: 'bg-emerald-400/15 text-emerald-300' },
    damaged: { label: '破损', cls: 'bg-red-400/15 text-red-300' },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-white/10 text-white/60' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function InventoryInboundPage() {
  const { t } = useTranslation()
  const { inboundRecords, loadingInbound, loadInbound } = useInventoryStore()

  useEffect(() => {
    void loadInbound()
  }, [loadInbound])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('inventory.inbound.title')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('inventory.inbound.subtitle')}</p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-white">{inboundRecords.length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.inbound.totalRecords') ?? '总记录'}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{inboundRecords.filter(r => r.status === 'pending').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.inbound.pending')}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{inboundRecords.filter(r => r.status === 'in_transit').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.inbound.in_transit')}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{inboundRecords.filter(r => r.status === 'received').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.inbound.received')}</div>
        </div>
      </div>

      {/* 列表 */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                <th className="px-5 py-3">{t('inventory.inbound.shipmentId')}</th>
                <th className="px-5 py-3">{t('inventory.inbound.sku')}</th>
                <th className="px-5 py-3">{t('inventory.inbound.title_col')}</th>
                <th className="px-5 py-3">{t('inventory.inbound.inboundDate')}</th>
                <th className="px-5 py-3 text-right">{t('inventory.inbound.quantity')}</th>
                <th className="px-5 py-3">{t('inventory.inbound.warehouse')}</th>
                <th className="px-5 py-3 text-center">{t('inventory.inbound.status')}</th>
                <th className="px-5 py-3">{t('inventory.inbound.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingInbound ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" /></div>
                  </td>
                </tr>
              ) : inboundRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-white/40">{t('inventory.inbound.noData') ?? '暂无入库记录'}</td>
                </tr>
              ) : (
                inboundRecords.map(r => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">{r.shipmentId}</td>
                    <td className="px-5 py-3 font-mono text-xs text-white/70">{r.sku}</td>
                    <td className="px-5 py-3 text-white/90">{r.title}</td>
                    <td className="px-5 py-3 text-white/60">{r.inboundDate}</td>
                    <td className="px-5 py-3 text-right font-mono text-white/80">{r.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-white/60">{r.warehouse}</td>
                    <td className="px-5 py-3 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-xs text-white/40">{r.notes ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}