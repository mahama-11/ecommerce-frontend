import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FolderArchive, PackageCheck, ExternalLink, LoaderCircle } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { downloadExport, listDownloads } from '@/services/product'
import { ProductWorkflowNav } from '@/components/product-workbench/ProductWorkflowNav'
import type { DownloadRecord } from '@/types/product'
import { Button } from '@/components/ui/Button'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40 focus:bg-white/[0.06]"
        {...props}
      />
    </div>
  )
}

function SelectField({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <select
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40 focus:bg-white/[0.06]"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export default function AccountDownloadsPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const contextProductIDs = useMemo(
    () => (searchParams.get('productIds') ?? '').split(',').map(item => item.trim()).filter(Boolean),
    [searchParams],
  )
  const { t } = useTranslation()
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'generating' | 'succeeded'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'amazon' | 'shopee' | 'lazada'>('all')
  const [downloadableOnly, setDownloadableOnly] = useState(false)

  useEffect(() => {
    void loadDownloads()
  }, [])

  async function loadDownloads() {
    setLoading(true)
    try {
      const items = await listDownloads()
      setDownloads(items)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(item: DownloadRecord) {
    setDownloadingId(item.id)
    try {
      await downloadExport(item)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredDownloads = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return downloads.filter(item => {
      if (contextProductIDs.length > 0 && !contextProductIDs.includes(item.productId)) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false
      if (downloadableOnly && !item.downloadable) return false
      if (!keyword) return true
      const haystacks = [
        item.productTitle,
        item.productSKU,
        item.downloadFileName,
        item.listingVersionLabel,
        item.site,
        item.locale,
        item.id,
      ]
      return haystacks.some(value => value?.toLowerCase().includes(keyword))
    })
  }, [downloads, downloadableOnly, platformFilter, search, statusFilter, contextProductIDs])

  const stats = useMemo(
    () => [
      { label: t('account.downloads.stats.filtered'), value: `${filteredDownloads.length}`, icon: FolderArchive },
      { label: t('account.downloads.stats.downloadable'), value: `${filteredDownloads.filter(item => item.downloadable).length}`, icon: Download },
      { label: t('account.downloads.stats.linkedProducts'), value: `${new Set(filteredDownloads.map(item => item.productId)).size}`, icon: PackageCheck },
    ],
    [filteredDownloads, t]
  )
  const inProductCenter = pathname.startsWith('/products/workbench/downloads')

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative min-h-[calc(100vh-52px)] bg-[var(--ecom-bg)] px-5 py-6 text-[var(--ecom-text-primary)] lg:px-8">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[-18rem] top-[-18rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/8 blur-3xl" />
      </div>
      {/* Header */}
      <div className={`${inProductCenter ? 'rounded-[32px]' : 'rounded-3xl'} relative mx-auto flex max-w-[1500px] flex-col gap-4 border border-white/10 bg-[var(--ecom-surface)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)] ring-1 ring-cyan-300/5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between`}>
        <motion.div variants={itemVariants}>
          {inProductCenter ? <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/65">交付中心 · 下载记录</div> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-white">{inProductCenter ? '交付中心' : t('account.downloads.title')}</h1>
          <p className="mt-1.5 text-sm text-white/50">{inProductCenter ? '导出任务队列、下载追踪、包完整性校验、交付链路' : t('account.downloads.subtitle')}</p>
          {contextProductIDs.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
              当前共关联 {contextProductIDs.length} 个 SKU；只有文件准备完成后才会启用下载按钮。
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {inProductCenter ? (
              <>
                <Link to="/products" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white">{t('account.downloads.backToProducts')}</Link>
                <Link to={`/products/workbench/visual-tools${contextProductIDs[0] ? `?productId=${encodeURIComponent(contextProductIDs[0])}&source=delivery` : '?source=delivery'}`} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white">{t('account.downloads.openVisualTools')}</Link>
              </>
            ) : null}
            {!inProductCenter ? (
              <Link to="/account/billing" className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10">{t('account.downloads.reviewBilling')}</Link>
            ) : null}
          </div>
        </motion.div>
        {inProductCenter ? (
          <Link to={`/products/workbench/batch-listing${contextProductIDs.length ? `?productIds=${encodeURIComponent(contextProductIDs.join(','))}&source=delivery` : '?source=delivery'}`} className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-[var(--ecom-action-primary-text)] transition hover:bg-white">
            <PackageCheck className="h-4 w-4" />
            {t('account.downloads.backToProduction')}
          </Link>
        ) : (
          <Link to="/account/billing" className="group inline-flex items-center justify-center gap-2 rounded border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-300 transition-all hover:bg-brand-500/20 shrink-0"><PackageCheck className="h-4 w-4" />{t('account.downloads.reviewBilling')}</Link>
        )}
      </div>

      {inProductCenter ? (
        <motion.div variants={itemVariants} className="relative mx-auto mt-4 max-w-[1500px]">
          <ProductWorkflowNav active="delivery" productId={contextProductIDs[0]} productIds={contextProductIDs} source="delivery" />
        </motion.div>
      ) : null}

      {inProductCenter ? (
        <motion.section variants={itemVariants} className="relative mx-auto mt-6 max-w-[1500px] space-y-5">
          <div className="flex flex-wrap gap-2 rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.32)]">
            {[
              ['任务', `${downloads.length}`],
              ['可下载', `${downloads.filter(item => item.downloadable).length}`],
              ['处理中', `${downloads.filter(item => item.status === 'generating' || item.status === 'pending').length}`],
              ['失败', `${downloads.filter(item => item.status === 'failed').length}`],
              ['暂不可用', `${downloads.filter(item => !item.downloadable && item.status !== 'generating' && item.status !== 'pending' && item.status !== 'failed').length}`],
            ].map(([label, value]) => <span key={label} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/65">{label} <b className="text-cyan-100">{value}</b></span>)}
            <span className="ml-auto rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-1.5 text-xs text-cyan-100/75">可下载的交付文件会在这里统一管理</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {['全部','可下载','处理中','失败','暂不可用'].map((chip, index) => <Button key={chip} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{chip}</Button>)}
          </div>

          <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[var(--ecom-surface)] shadow-[0_20px_70px_rgba(0,0,0,0.36)]">
            <div className="border-b border-white/[0.06] px-5 py-4"><h2 className="text-sm font-semibold text-white/85">导出任务队列 — {filteredDownloads.length} 条记录</h2><p className="mt-1 text-xs text-white/40">可下载的记录会启用下载按钮；暂不支持的平台发布会保持关闭。</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-white/[0.035] text-[11px] uppercase tracking-[0.12em] text-white/35"><tr><th className="px-4 py-3">任务 ID</th><th className="px-4 py-3">SKU / 标题</th><th className="px-4 py-3">平台 / 站点 / 语言</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">可下载</th><th className="px-4 py-3">创建时间</th><th className="px-4 py-3">操作</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">{loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-white/40"><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></td></tr> : filteredDownloads.length ? filteredDownloads.map(item => <tr key={item.id} className="text-white/65 hover:bg-white/[0.025]"><td className="px-4 py-3 font-mono text-cyan-100/72">{item.id}</td><td className="px-4 py-3"><div className="font-semibold text-white/82">{item.productTitle || item.productSKU || item.id}</div><div className="font-mono text-xs text-white/38">{item.productSKU || item.productId}</div></td><td className="px-4 py-3">{item.platform} / {item.site || '—'} / {item.locale || '—'}</td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${item.status === 'succeeded' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : item.status === 'failed' ? 'border-rose-300/25 bg-rose-300/10 text-rose-200' : 'border-amber-300/25 bg-amber-300/10 text-amber-200'}`}>{item.status}</span></td><td className="px-4 py-3">{item.downloadable ? <span className="text-emerald-200">✓ Yes</span> : <span className="text-white/35">✕ No</span>}</td><td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td><td className="px-4 py-3"><Button onClick={() => handleDownload(item)} disabled={!item.downloadable || downloadingId === item.id} className="rounded-lg bg-cyan-200 px-3 py-1.5 text-xs font-bold text-[var(--ecom-action-primary-text)] disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-white/25">{item.downloadable ? '下载' : '下载禁用'}</Button></td></tr>) : <tr><td colSpan={7} className="px-4 py-10 text-center text-white/40">暂无导出任务。</td></tr>}</tbody></table>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[28px] border border-white/[0.07] bg-[var(--ecom-surface)] p-5"><div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/38">包预览</div><div className="mb-4 flex gap-2">{['文件','素材','追踪','错误'].map((tab, index) => <span key={tab} className={`rounded-full border px-3 py-1 text-xs ${index === 0 ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{tab}</span>)}</div><div className="space-y-2">{(filteredDownloads[0]?.assets || []).slice(0,5).map(asset => <div key={asset.relationId} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-sm"><span className="text-white/65">{asset.fileName || asset.assetRole}</span><span className="text-white/35">{asset.mimeType || 'asset'}</span></div>)}{!filteredDownloads[0]?.assets?.length ? <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/42">选择/生成导出包后展示文件、素材清单和校验信息。</div> : null}</div></div>
            <aside className="rounded-[28px] border border-amber-300/18 bg-amber-300/[0.06] p-5 text-xs leading-6 text-amber-100/78"><div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-100">交付说明</div><p>这里展示导出队列和包预览。平台发布暂未开放；只有已生成且可下载的记录会启用下载按钮。</p></aside>
          </section>
        </motion.section>
      ) : null}

      {/* Stats */}
      <motion.section variants={itemVariants} className={`relative mx-auto mt-6 max-w-[1500px] grid-cols-1 gap-4 sm:grid-cols-3 ${inProductCenter ? 'hidden' : 'grid'}`}>
        {stats.map((item) => (
          <motion.div variants={itemVariants} key={item.label} className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.32)] ring-1 ring-cyan-300/5 transition hover:border-cyan-200/20 hover:bg-[var(--ecom-surface-hover)]">
            <div className="flex items-center gap-2 text-cyan-100/60">
              <item.icon className="h-4 w-4" />
              <div className="text-xs font-semibold uppercase tracking-[0.18em]">{item.label}</div>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* Filters */}
      <motion.section variants={itemVariants} className={`relative mx-auto mt-6 max-w-[1500px] rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.32)] backdrop-blur-md ${inProductCenter ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">{t('account.downloads.filters.title')}</div>
            <p className="mt-1 text-xs text-slate-400">{t('account.downloads.filters.subtitle')}</p>
          </div>
          <Button
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setPlatformFilter('all')
              setDownloadableOnly(false)
            }}
            className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            {t('account.downloads.filters.reset')}
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <InputField
            label={t('account.downloads.filters.searchLabel')}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('account.downloads.filters.searchPlaceholder')}
          />
          <SelectField
            label={t('account.downloads.filters.statusLabel')}
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="all">{t('account.downloads.filters.allStatuses')}</option>
            <option value="pending">{t('account.downloads.filters.pending')}</option>
            <option value="generating">{t('account.downloads.filters.generating')}</option>
            <option value="succeeded">{t('account.downloads.filters.succeeded')}</option>
          </SelectField>
          <SelectField
            label={t('account.downloads.filters.platformLabel')}
            value={platformFilter}
            onChange={event => setPlatformFilter(event.target.value as typeof platformFilter)}
          >
            <option value="all">{t('account.downloads.filters.allPlatforms')}</option>
            <option value="amazon">{t("product.detail.platforms.amazon")}</option>
            <option value="shopee">{t("product.detail.platforms.shopee")}</option>
            <option value="lazada">{t("product.detail.platforms.lazada")}</option>
          </SelectField>
          <div className="flex flex-col justify-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={downloadableOnly}
                  onChange={event => setDownloadableOnly(event.target.checked)}
                  className="peer h-4 w-4 appearance-none rounded border border-white/20 bg-transparent checked:border-brand-500 checked:bg-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all cursor-pointer"
                />
                <svg
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{t('account.downloads.filters.downloadableOnly')}</span>
            </label>
          </div>
        </div>
      </motion.section>

      {/* Lists */}
      <div className={`mx-auto mt-6 max-w-[1500px] grid-cols-1 gap-6 lg:grid-cols-[1fr_350px] ${inProductCenter ? 'hidden' : 'grid'}`}>
        {/* Main Records */}
        <motion.section variants={itemVariants} className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] backdrop-blur-md flex flex-col h-full overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4 bg-white/[0.01]">
            <h2 className="text-sm font-medium text-slate-200">{t('account.downloads.records.title')}</h2>
            <p className="mt-1 text-xs text-slate-400">{t('account.downloads.records.subtitle')}</p>
          </div>
          <div className="flex-1 divide-y divide-white/5 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="px-6 py-12 flex items-center justify-center text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredDownloads.length ? filteredDownloads.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200 truncate">{item.productTitle || item.productSKU || item.id}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-white/10">{item.status}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.platform.toUpperCase()}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.site}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.locale}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.format.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {t('account.downloads.records.linkedAssets')}: {item.assetCount}
                      {item.primaryAssetRole ? <span className="ml-2 text-slate-500">· {t('account.downloads.records.primaryRole')}: {item.primaryAssetRole}</span> : null}
                    </div>
                    {item.listingVersionLabel ? (
                      <div className="mt-1 text-xs text-slate-400">
                        {t('account.downloads.records.listingSnapshot')}: <span className="text-slate-300">{item.listingVersionLabel}</span>
                      </div>
                    ) : null}
                    {item.assets?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.assets.slice(0, 4).map((asset) => (
                          <span
                            key={asset.relationId}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] ${
                              asset.isPrimary
                                ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                                : 'border-white/10 bg-white/5 text-slate-400'
                            }`}
                          >
                            <span>{asset.assetRole}</span>
                            {asset.fileName ? <span className="text-slate-500 max-w-[100px] truncate">· {asset.fileName}</span> : null}
                          </span>
                        ))}
                        {item.assets.length > 4 ? (
                          <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                            +{item.assets.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={item.productPath}
                      className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t('account.downloads.records.viewProduct')}
                    </Link>
                    <Button
                      onClick={() => handleDownload(item)}
                      disabled={!item.downloadable || downloadingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 disabled:border disabled:border-white/5"
                    >
                      {downloadingId === item.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      {downloadingId === item.id ? t('account.downloads.records.downloading') : t('account.downloads.records.download')}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-end text-[11px] text-slate-500">
                  {item.fileSize || '--'} · {new Date(item.createdAt).toLocaleString()}
                </div>
              </motion.div>
            )) : (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                {downloads.length
                  ? t('account.downloads.records.emptyFiltered')
                  : t('account.downloads.records.empty')}
              </div>
            )}
          </div>
        </motion.section>

        {/* Package preview / Tracking drawer */}
        <motion.section variants={itemVariants} className="rounded-[28px] border border-white/10 bg-[var(--ecom-surface)] backdrop-blur-md flex flex-col h-full overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4 bg-white/[0.01]">
            <h2 className="text-sm font-medium text-slate-200">Package preview tabs / tracking drawer</h2>
            <p className="mt-1 text-xs text-slate-400">{t('account.downloads.trace.subtitle')}</p>
            <div className="mt-3 flex gap-2 text-[11px]">
              {['文件', '素材', '检查'].map(tab => (
                <span key={tab} className={`rounded-full border px-2.5 py-1 ${tab === '文件' ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/5 text-white/45'}`}>{tab}</span>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-[11px] leading-5 text-amber-100/75">下载按钮只会在文件准备完成后启用。</div>
          </div>
          <div className="flex-1 divide-y divide-white/5 overflow-y-auto custom-scrollbar">
            {filteredDownloads.slice(0, 8).length ? filteredDownloads.slice(0, 8).map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-2.5 px-5 py-4 transition-colors hover:bg-white/[0.02]">
                <div className="text-sm font-medium text-slate-200 truncate">{item.productTitle || item.productSKU}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  <span className="text-slate-600">{t('account.downloads.trace.productPath')}:</span> {item.productPath}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  <span className="text-slate-600">{t('account.downloads.trace.file')}:</span> {item.downloadFileName}
                </div>
                {item.listingVersionLabel ? (
                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="text-slate-600">{t('account.downloads.trace.listingSnapshot')}:</span> {item.listingVersionLabel}
                  </div>
                ) : null}
                {item.assets?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.assets.slice(0, 3).map((asset) => (
                      <span key={asset.relationId} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {asset.assetRole}{asset.isPrimary ? ` · ${t('account.downloads.trace.primary')}` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium">
                  <span className={`rounded px-1.5 py-0.5 border ${item.downloadable ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
                    {item.downloadable ? t('account.downloads.trace.downloadable') : t('account.downloads.trace.notReady')}
                  </span>
                  <span className="text-slate-500">{t('account.downloads.trace.assetsCount', { count: item.assetCount })}</span>
                </div>
              </motion.div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                {downloads.length
                  ? t('account.downloads.trace.emptyFiltered')
                  : t('account.downloads.trace.empty')}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
