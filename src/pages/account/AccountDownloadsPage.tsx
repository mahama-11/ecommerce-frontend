import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FolderArchive, Link as LinkIcon, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DELIVERY_ITEMS } from '@/mock/assetCommerce'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import type { LinkedDelivery } from '@/mock/workflowBridge'

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
  const { i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const [linkedDeliveries, setLinkedDeliveries] = useState<LinkedDelivery[]>([])

  useEffect(() => {
    void productWorkspaceRepository.listLinkedDeliveries().then(setLinkedDeliveries)
  }, [])

  const stats = useMemo(
    () => [
      { label: copy(locale, '交付包', 'Delivery bundles'), value: `${DELIVERY_ITEMS.length}`, icon: FolderArchive },
      { label: copy(locale, '关联导出', 'Linked exports'), value: `${linkedDeliveries.length}`, icon: LinkIcon },
      { label: copy(locale, '可下载结果', 'Downloadable results'), value: `${DELIVERY_ITEMS.length + linkedDeliveries.length}`, icon: Download },
    ],
    [linkedDeliveries.length, locale],
  )

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{copy(locale, '下载中心', 'Download Center')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {copy(locale, '统一管理你的交付包、导出结果和历史下载记录。', 'Manage your delivery bundles, exported results, and download history.')}
          </p>
        </motion.div>
        <Link
          to="/account/billing"
          className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <PackageCheck className="h-4 w-4" />
          {copy(locale, '查看订单与额度', 'Review billing')}
        </Link>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{copy(locale, '平台交付包', 'Platform delivery bundles')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '统一查看历史交付、导出格式和状态。', 'Review delivery history, output formats, and statuses.')}
            </p>
        </div>
          <div className="flex-1 divide-y divide-white/5">
            {DELIVERY_ITEMS.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between px-6 py-5 transition-colors hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">{locale === 'zh' ? item.title.zh : item.title.en}</div>
                  <div className="mt-1 text-xs text-slate-500 break-words line-clamp-2">{locale === 'zh' ? item.meta.zh : item.meta.en}</div>
                </div>
                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                  <div className="text-sm font-semibold text-slate-300">{item.size}</div>
                  <div className="text-xs font-medium text-slate-500">{item.status}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)] flex flex-col h-full">
          <div className="border-b border-white/5 px-6 py-5">
            <h2 className="font-medium text-slate-100">{copy(locale, '关联导出记录', 'Linked export records')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '追踪从任务到交付的链路。', 'Track the path from task to delivery.')}
            </p>
        </div>
          <div className="flex-1 divide-y divide-white/5">
            {linkedDeliveries.length ? linkedDeliveries.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-white/[0.03]">
                <div className="text-sm font-medium text-slate-100 truncate">{locale === 'zh' ? item.title.zh : item.title.en}</div>
                <div className="text-xs text-slate-500 truncate">{item.size}</div>
                <div className="mt-2 flex items-center justify-between text-xs font-medium">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400 border border-white/5">{item.status}</span>
                  <span className="text-slate-600">{item.createdAt}</span>
                </div>
              </motion.div>)) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                {copy(locale, '当前还没有桥接导出记录。', 'No linked exports yet.')}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
