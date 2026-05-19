// ============================================================
// 补货预警页面 (InventoryAlertsPage)
// 对应原 HTML alerts 页面
// ============================================================

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'

function LevelIcon({ level }: { level: string }) {
  if (level === 'danger') return <AlertTriangle className="h-4 w-4 text-red-400" />
  if (level === 'warning') return <Bell className="h-4 w-4 text-amber-400" />
  return <Info className="h-4 w-4 text-blue-400" />
}

export default function InventoryAlertsPage() {
  const { t } = useTranslation()
  const { alerts, loadingAlerts, loadAlerts, markAlertRead } = useInventoryStore()

  useEffect(() => {
    void loadAlerts()
  }, [loadAlerts])

  const unreadAlerts = alerts.filter(a => !a.read)
  const readAlerts = alerts.filter(a => a.read)

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('inventory.alerts.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('inventory.alerts.subtitle')}</p>
        </div>
        {unreadAlerts.length > 0 && (
          <button
            onClick={async () => {
              for (const a of unreadAlerts) {
                await markAlertRead(a.id)
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.09]"
          >
            <CheckCircle className="h-4 w-4" />
            {t('inventory.alerts.allRead')}
          </button>
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-400/20 bg-red-400/8 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{alerts.filter(a => a.alertLevel === 'danger').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.alerts.danger')}</div>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{alerts.filter(a => a.alertLevel === 'warning').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.alerts.warning')}</div>
        </div>
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/8 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{alerts.filter(a => a.alertLevel === 'info').length}</div>
          <div className="mt-1 text-xs text-white/40">{t('inventory.alerts.info')}</div>
        </div>
      </div>

      {/* 未读预警 */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70">未读预警 ({unreadAlerts.length})</h3>
          {unreadAlerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 transition hover:bg-white/[0.04] ${
                alert.alertLevel === 'danger' ? 'border-red-400/20 bg-red-400/5' :
                alert.alertLevel === 'warning' ? 'border-amber-400/20 bg-amber-400/5' :
                'border-blue-400/20 bg-blue-400/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <LevelIcon level={alert.alertLevel} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400">{alert.sku}</span>
                    <span className="text-sm text-white/90">{alert.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
                    <span>{t('inventory.alerts.currentStock')}: <strong className="text-white/70">{alert.currentStock}</strong></span>
                    <span>{t('inventory.alerts.suggestedAction')}: <strong className="text-[#ffb84d]">{alert.suggestedAction}</strong></span>
                    <span>{new Date(alert.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => { void markAlertRead(alert.id) }}
                  className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.08] hover:text-white/60"
                  title="标记已读"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已读预警 */}
      {readAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/40">已读预警 ({readAlerts.length})</h3>
          {readAlerts.map(alert => (
            <div
              key={alert.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 opacity-60"
            >
              <div className="flex items-start gap-3">
                <LevelIcon level={alert.alertLevel} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400">{alert.sku}</span>
                    <span className="text-sm text-white/70">{alert.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-white/30">
                    <span>{t('inventory.alerts.currentStock')}: {alert.currentStock}</span>
                    <span>{alert.suggestedAction}</span>
                    <span>{new Date(alert.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {alerts.length === 0 && !loadingAlerts && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] py-16">
          <Bell className="mb-4 h-12 w-12 text-white/20" />
          <p className="text-white/40">{t('inventory.alerts.noData') ?? '暂无预警信息'}</p>
        </div>
      )}
    </div>
  )
}