import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight,Star, WandSparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { productWorkspaceRepository } from '@/repositories/productWorkspace'
import type { SavedTemplateRecord } from '@/mock/templateLibrary'
import type { LinkedTemplateBridge } from '@/mock/workflowBridge'

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

export default function AccountTemplatesPage() {
  const { i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'
  const [templates, setTemplates] = useState<SavedTemplateRecord[]>([])
  const [bridges, setBridges] = useState<LinkedTemplateBridge[]>([])

  useEffect(() => {
    void productWorkspaceRepository.listSavedTemplates().then(setTemplates)
    void productWorkspaceRepository.listTemplateBridges().then(setBridges)
  }, [])

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 ">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{copy(locale, '模板库', 'Template Library')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {copy(locale, '统一管理私有模板、收藏模板，以及设计稿与 AI 模板之间的桥接记录。', 'Manage private templates, saved templates, and design-to-AI template bridges.')}
          </p>
        </motion.div>
        <Link
          to="/aiChat/template"
          className="group inline-flex items-center justify-center gap-2 rounded-md btn-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <WandSparkles className="h-4 w-4" />
          {copy(locale, '前往模板市场', 'Open Template Market')}
        </Link>
      </div>

      <motion.section variants={itemVariants} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {templates.length ? templates.map((item) => (
          <article 
            key={item.id} 
            className="group flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.08)] transition-all hover:border-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-100 transition-colors group-hover:text-white truncate">
                    {locale === 'zh' ? item.zh.title : item.en.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                    {locale === 'zh' ? item.zh.summary : item.en.summary}
                  </p>
        </div>
                <div className="shrink-0 rounded-md bg-amber-500/10 p-2 text-amber-500 transition-colors group-hover:bg-amber-500/20 group-hover:text-amber-400">
                  <Star className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md border border-white/5 bg-white/5 px-2 py-1 text-xs font-medium text-slate-400">
                  {item.platform}
                </span>
                <span className="inline-flex items-center rounded-md border border-white/5 bg-white/5 px-2 py-1 text-xs font-medium text-slate-400">
                  {locale === 'zh' ? item.zh.scenario : item.en.scenario}
                </span>
                <span className="inline-flex items-center rounded-md border border-white/5 bg-white/5 px-2 py-1 text-xs font-medium text-slate-400">
                  {copy(locale, '调用', 'Usage')} {item.usageCount}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-medium text-slate-500">
              <span>{item.savedAt}</span>
              <span className="flex items-center gap-1 text-slate-400">
                {copy(locale, '收藏', 'Favorites')} {item.favorite}
              </span>
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-white/5 bg-white/5/20 p-12 text-center text-sm font-medium text-slate-500 md:col-span-2 lg:col-span-3">
            {copy(locale, '你还没有保存模板。去模板市场收藏或复制一个模板后，这里会成为你的私有模板库。', 'You do not have saved templates yet. Save or copy one from the market and it will appear here as part of your private library.')}
          </div>
        )}
      </motion.section>

      <motion.section variants={itemVariants} className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-[0_2px_10px_rgb(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="font-medium text-slate-100">{copy(locale, '模板桥接记录', 'Template bridge records')}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {copy(locale, '记录设计稿与 AI 模板之间的关联关系', 'Shows how design drafts and AI templates connect inside your workflow.')}
            </p>
        </div>
          <Link to="/account/assets" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
            {copy(locale, '回到账户总览', 'Back to overview')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-white/5">
          {bridges.length ? bridges.map((item) => (
            <motion.div variants={itemVariants} key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between px-6 py-5 transition-colors hover:bg-white/[0.03]">
              <div className="min-w-0">
                <div className="font-medium text-slate-100 truncate">
                  {locale === 'zh' ? item.aiTemplateTitle.zh : item.aiTemplateTitle.en}
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 shrink-0">{copy(locale, '关联设计稿', 'Linked design')}:</span> 
                    <span className="font-medium text-slate-300 truncate">{locale === 'zh' ? item.designTitle.zh : item.designTitle.en}</span>
                  </div>
                  <div className="hidden sm:block text-zinc-700">&bull;</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 shrink-0">{copy(locale, '场景', 'Scenario')}:</span> 
                    <span className="font-medium text-slate-300 truncate">{locale === 'zh' ? item.scenario.zh : item.scenario.en}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-xs font-medium text-slate-500">
                {item.createdAt}
              </div>
            </motion.div>)) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              {copy(locale, '暂时没有桥接记录。后续从模板市场使用模板、复制模板或在设计器中保存模板时，这里会开始累积。', 'There are no bridge records yet. They will appear once templates start flowing through the designer and marketplace workflows.')}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}
