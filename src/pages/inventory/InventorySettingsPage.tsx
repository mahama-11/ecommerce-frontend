// ============================================================
// 系统设置页面 (InventorySettingsPage)
// 对应原 HTML settings 页面
// ============================================================

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, RotateCcw } from 'lucide-react'
import { useInventoryStore } from '@/store/inventoryStore'
import type { InventorySettings } from '@/types/inventory'

export default function InventorySettingsPage() {
  const { t } = useTranslation()
  const { settings, loadSettings, saveSettings } = useInventoryStore()

  const [form, setForm] = useState<InventorySettings>({
    defaultSafeStockDays: 14,
    defaultReplenishFactor: 1.0,
    defaultLeadDays: 7,
    alertEnabled: true,
    alertEmail: '',
    currency: 'USD',
    autoRefreshInterval: 30,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    await saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setForm({
      defaultSafeStockDays: 14,
      defaultReplenishFactor: 1.0,
      defaultLeadDays: 7,
      alertEnabled: true,
      alertEmail: '',
      currency: 'USD',
      autoRefreshInterval: 30,
    })
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('inventory.settings.title')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('inventory.settings.subtitle')}</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
        {/* 预警配置 */}
        <div className="mb-8">
          <h3 className="mb-4 text-base font-semibold text-white">{t('inventory.settings.alertConfig')}</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/80">{t('inventory.settings.enableAlert')}</div>
                <div className="mt-0.5 text-xs text-white/40">{t('inventory.settings.enableAlertHint')}</div>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, alertEnabled: !f.alertEnabled }))}
                className={`relative h-6 w-11 rounded-full transition ${form.alertEnabled ? 'bg-[#ff9900]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${form.alertEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.alertEmail')}</label>
              <input
                type="email"
                value={form.alertEmail}
                onChange={e => setForm(f => ({ ...f, alertEmail: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>

        {/* 计算默认值 */}
        <div className="mb-8">
          <h3 className="mb-4 text-base font-semibold text-white">{t('inventory.settings.calcDefaults')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.defaultSafeStock')}</label>
              <input
                type="number"
                min="1"
                value={form.defaultSafeStockDays}
                onChange={e => setForm(f => ({ ...f, defaultSafeStockDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.defaultReplenish')}</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={form.defaultReplenishFactor}
                onChange={e => setForm(f => ({ ...f, defaultReplenishFactor: Number(e.target.value) }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.defaultLeadDays')}</label>
              <input
                type="number"
                min="1"
                value={form.defaultLeadDays}
                onChange={e => setForm(f => ({ ...f, defaultLeadDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="mb-8">
          <h3 className="mb-4 text-base font-semibold text-white">{t('inventory.settings.otherSettings')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.currency')}</label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value as 'CNY' | 'USD' }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="USD">USD ($)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white/80">{t('inventory.settings.autoRefresh')}</label>
              <select
                value={form.autoRefreshInterval}
                onChange={e => setForm(f => ({ ...f, autoRefreshInterval: Number(e.target.value) }))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              >
                <option value={0}>{t('inventory.settings.noAutoRefresh')}</option>
                <option value={15}>15 {t('inventory.settings.minutes')}</option>
                <option value={30}>30 {t('inventory.settings.minutes')}</option>
                <option value={60}>60 {t('inventory.settings.minutes')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] pt-6">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff9900] px-5 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#ffb84d]"
          >
            <Save className="h-4 w-4" />
            {saved ? t('inventory.settings.saved') : t('inventory.settings.save')}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.09]"
          >
            <RotateCcw className="h-4 w-4" />
            {t('inventory.settings.reset')}
          </button>
          {saved && <span className="text-sm text-emerald-400">{t('inventory.settings.saveSuccess')}</span>}
        </div>
      </div>
    </div>
  )
}