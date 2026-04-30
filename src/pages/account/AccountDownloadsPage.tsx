import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FolderArchive, PackageCheck, ExternalLink, LoaderCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { downloadExport, listDownloads } from '@/services/product'
import type { DownloadRecord } from '@/types/product'

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
        className="w-full rounded-md border border-white/10 bg-[#09090b] px-3 py-1.5 text-sm text-slate-200 outline-none transition focus:border-brand-500/50 focus:bg-[#0c0c10]"
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
        className="w-full rounded-md border border-white/10 bg-[#09090b] px-3 py-1.5 text-sm text-slate-200 outline-none transition focus:border-brand-500/50 focus:bg-[#0c0c10]"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export default function AccountDownloadsPage() {
  const { pathname } = useLocation()
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
  }, [downloads, downloadableOnly, platformFilter, search, statusFilter])

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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{t('account.downloads.title')}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{t('account.downloads.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {inProductCenter ? (
              <>
                <Link
                  to="/products"
                  className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                >
                  {t('account.downloads.backToProducts')}
                </Link>
                <Link
                  to="/products/workbench/visual-tools"
                  className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                >
                  {t('account.downloads.openVisualTools')}
                </Link>
              </>
            ) : null}
            <Link
              to="/account/billing"
              className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              {t('account.downloads.reviewBilling')}
            </Link>
          </div>
        </motion.div>
        {inProductCenter ? (
          <Link
            to="/products/workbench/batch-listing"
            className="group inline-flex items-center justify-center gap-2 rounded border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-300 transition-all hover:bg-brand-500/20 shrink-0"
          >
            <PackageCheck className="h-4 w-4" />
            {t('account.downloads.backToProduction')}
          </Link>
        ) : (
          <Link
            to="/account/billing"
            className="group inline-flex items-center justify-center gap-2 rounded border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-300 transition-all hover:bg-brand-500/20 shrink-0"
          >
            <PackageCheck className="h-4 w-4" />
            {t('account.downloads.reviewBilling')}
          </Link>
        )}
      </div>

      {/* Stats */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <motion.div variants={itemVariants} key={item.label} className="rounded-lg border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md p-4 transition-colors hover:bg-white/[0.02]">
            <div className="flex items-center gap-2 text-slate-400">
              <item.icon className="h-4 w-4" />
              <div className="text-xs font-medium">{item.label}</div>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* Filters */}
      <motion.section variants={itemVariants} className="rounded-lg border border-white/10 bg-[#0a0a12]/80 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">{t('account.downloads.filters.title')}</div>
            <p className="mt-1 text-xs text-slate-400">{t('account.downloads.filters.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setPlatformFilter('all')
              setDownloadableOnly(false)
            }}
            className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            {t('account.downloads.filters.reset')}
          </button>
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
        {/* Main Records */}
        <motion.section variants={itemVariants} className="rounded-lg border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md flex flex-col h-full overflow-hidden">
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
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={!item.downloadable || downloadingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 disabled:border disabled:border-white/5"
                    >
                      {downloadingId === item.id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      {downloadingId === item.id ? t('account.downloads.records.downloading') : t('account.downloads.records.download')}
                    </button>
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

        {/* Trace */}
        <motion.section variants={itemVariants} className="rounded-lg border border-white/10 bg-[#0a0a12]/80 backdrop-blur-md flex flex-col h-full overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4 bg-white/[0.01]">
            <h2 className="text-sm font-medium text-slate-200">{t('account.downloads.trace.title')}</h2>
            <p className="mt-1 text-xs text-slate-400">{t('account.downloads.trace.subtitle')}</p>
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
