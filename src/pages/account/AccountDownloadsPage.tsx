import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FolderArchive, PackageCheck, ExternalLink, LoaderCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { downloadExport, listDownloads } from '@/services/product'
import type { DownloadRecord } from '@/types/product'

type Locale = 'zh' | 'en'

function copy(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
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

export default function AccountDownloadsPage() {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
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
      { label: copy(locale, '筛选结果', 'Filtered results'), value: `${filteredDownloads.length}`, icon: FolderArchive },
      { label: copy(locale, '可下载结果', 'Downloadable results'), value: `${filteredDownloads.filter(item => item.downloadable).length}`, icon: Download },
      { label: copy(locale, '关联商品', 'Linked products'), value: `${new Set(filteredDownloads.map(item => item.productId)).size}`, icon: PackageCheck },
    ],
    [filteredDownloads, locale],
  )
  const inProductCenter = pathname.startsWith('/products/workbench/downloads')

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{copy(locale, '下载中心', 'Download Center')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {copy(locale, '统一管理你的交付包、导出结果和历史下载记录。', 'Manage your delivery bundles, exported results, and download history.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {inProductCenter ? (
              <>
                <Link
                  to="/products"
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05]"
                >
                  {copy(locale, '返回商品首页', 'Back to products')}
                </Link>
                <Link
                  to="/products/workbench/visual-tools"
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05]"
                >
                  {copy(locale, '前往商品视觉', 'Open visual tools')}
                </Link>
              </>
            ) : null}
            <Link
              to="/account/billing"
              className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05]"
            >
              {copy(locale, '查看订单与额度', 'Review billing')}
            </Link>
          </div>
        </motion.div>
        {inProductCenter ? (
          <Link
            to="/products/workbench/batch-listing"
            className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <PackageCheck className="h-4 w-4" />
            {copy(locale, '回到商品生产流', 'Back to production flow')}
          </Link>
        ) : (
          <Link
            to="/account/billing"
            className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <PackageCheck className="h-4 w-4" />
            {copy(locale, '查看订单与额度', 'Review billing')}
          </Link>
        )}
      </div>

      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <motion.div variants={itemVariants} key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-slate-500" />
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">{item.value}</div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-100">{copy(locale, '筛选与搜索', 'Filters and search')}</div>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '按商品、导出状态、平台和可下载状态快速定位交付记录。', 'Locate delivery records by product, export status, platform, and download readiness.')}
            </p>
          </div>
          <button
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setPlatformFilter('all')
              setDownloadableOnly(false)
            }}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05]"
          >
            {copy(locale, '重置筛选', 'Reset filters')}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{copy(locale, '搜索', 'Search')}</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={copy(locale, '商品名 / SKU / 导出文件 / Listing', 'Product / SKU / file / listing')}
              className="rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{copy(locale, '状态', 'Status')}</span>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-400/40"
            >
              <option value="all">{copy(locale, '全部状态', 'All statuses')}</option>
              <option value="pending">{copy(locale, '待处理', 'Pending')}</option>
              <option value="generating">{copy(locale, '生成中', 'Generating')}</option>
              <option value="succeeded">{copy(locale, '已完成', 'Succeeded')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{copy(locale, '平台', 'Platform')}</span>
            <select
              value={platformFilter}
              onChange={event => setPlatformFilter(event.target.value as typeof platformFilter)}
              className="rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-400/40"
            >
              <option value="all">{copy(locale, '全部平台', 'All platforms')}</option>
              <option value="amazon">Amazon</option>
              <option value="shopee">Shopee</option>
              <option value="lazada">Lazada</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={downloadableOnly}
              onChange={event => setDownloadableOnly(event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-transparent"
            />
            <span>{copy(locale, '仅看可下载', 'Downloadable only')}</span>
          </label>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{copy(locale, '真实导出记录', 'Real export records')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '统一查看商品导出状态、关联商品与可下载结果。', 'Review product export status, linked products, and downloadable results.')}
            </p>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {loading ? (
              <div className="px-6 py-10 flex items-center justify-center text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredDownloads.length ? filteredDownloads.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">{item.productTitle || item.productSKU || item.id}</div>
                    <div className="mt-1 text-xs text-slate-500 break-words">
                      {item.platform.toUpperCase()} · {item.site} · {item.locale} · {item.format.toUpperCase()}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {copy(locale, '关联资产', 'Linked assets')}: {item.assetCount}
                      {item.primaryAssetRole ? ` · ${copy(locale, '主资产角色', 'Primary role')}: ${item.primaryAssetRole}` : ''}
                    </div>
                    {item.listingVersionLabel ? (
                      <div className="mt-1 text-xs text-slate-400">
                        {copy(locale, '导出Listing', 'Listing snapshot')}: {item.listingVersionLabel}
                      </div>
                    ) : null}
                    {item.assets?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.assets.slice(0, 4).map((asset) => (
                          <span
                            key={asset.relationId}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
                              asset.isPrimary
                                ? 'border-brand-400/30 bg-brand-500/10 text-brand-200'
                                : 'border-white/10 bg-white/5 text-slate-300'
                            }`}
                          >
                            <span>{asset.assetRole}</span>
                            {asset.fileName ? <span className="text-slate-400">· {asset.fileName}</span> : null}
                          </span>
                        ))}
                        {item.assets.length > 4 ? (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
                            +{item.assets.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={item.productPath}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {copy(locale, '查看商品', 'View product')}
                    </Link>
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={!item.downloadable || downloadingId === item.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                    >
                      {downloadingId === item.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      {copy(locale, '下载', 'Download')}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400 border border-white/5">{item.status}</span>
                  <span className="text-slate-600">{item.fileSize || '--'} · {new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </motion.div>
            )) : (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                {downloads.length
                  ? copy(locale, '没有匹配当前筛选条件的导出记录。', 'No export records match the current filters.')
                  : copy(locale, '还没有真实导出记录。先去商品中心创建导出任务。', 'No real export records yet. Create an export task from product center first.')}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{copy(locale, '资产与下载链路', 'Asset-to-download trace')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '这里展示每个导出记录与商品、资产数量、格式和可下载状态的关系。', 'This panel highlights how each export ties back to product, asset count, format, and download readiness.')}
            </p>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {filteredDownloads.slice(0, 6).length ? filteredDownloads.slice(0, 6).map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                <div className="text-sm font-medium text-slate-100 truncate">{item.productTitle || item.productSKU}</div>
                <div className="text-xs text-slate-500 truncate">
                  {copy(locale, '商品路径', 'Product path')}: {item.productPath}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {copy(locale, '导出文件', 'File')}: {item.downloadFileName}
                </div>
                {item.listingVersionLabel ? (
                  <div className="text-xs text-slate-500 truncate">
                    {copy(locale, 'Listing快照', 'Listing snapshot')}: {item.listingVersionLabel}
                  </div>
                ) : null}
                {item.assets?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.assets.slice(0, 3).map((asset) => (
                      <span key={asset.relationId} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                        {asset.assetRole}{asset.isPrimary ? ` · ${copy(locale, '主图', 'Primary')}` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between text-xs font-medium">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400 border border-white/5">
                    {item.downloadable ? copy(locale, '可下载', 'Downloadable') : copy(locale, '未就绪', 'Not ready')}
                  </span>
                  <span className="text-slate-600">{item.assetCount} {copy(locale, '个资产', 'assets')}</span>
                </div>
              </motion.div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                {downloads.length
                  ? copy(locale, '当前筛选条件下没有可追踪的导出链路。', 'No traceable export chain matches the current filters.')
                  : copy(locale, '当前还没有可追踪的导出链路。', 'No traceable export chain yet.')}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
