import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock3, Milestone, Sparkles } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const RELEASES = [
  {
    version: 'v0.9.0',
    date: '2026-04',
    badge: { zh: '工作台工程化', en: 'Workbench Engineering' },
    items: [
      { zh: '模板市场补齐搜索、筛选、分页与复制到我的模板库链路', en: 'Template marketplace gains search, filters, pagination, and copy-to-library flows' },
      { zh: '资料库与商业页升级为上传队列、订单流和下载交付骨架', en: 'Library and commerce pages evolve into upload queues, order flows, and delivery skeletons' },
      { zh: '门户层继续拆分独立页面，减少通用占位感', en: 'Portal pages continue splitting into standalone pages to reduce placeholder feel' },
    ],
  },
  {
    version: 'v0.8.0',
    date: '2026-04',
    badge: { zh: '主路径打通', en: 'Core Flow Connected' },
    items: [
      { zh: 'AI 对话、知识库对话、模板市场、我的模板库形成闭环', en: 'AI chat, knowledge chat, marketplace, and my template library form a closed loop' },
      { zh: '视觉工作台引入任务状态推进与详情抽屉', en: 'Visual workbench introduces task progression and detail drawers' },
      { zh: '首页与导航国际化、响应式和下拉视觉问题修复', en: 'Homepage and nav i18n, responsiveness, and dropdown visual issues are fixed' },
    ],
  },
  {
    version: 'v0.7.0',
    date: '2026-04',
    badge: { zh: '视觉骨架首版', en: 'Initial Visual Skeleton' },
    items: [
      { zh: '完成门户层、控制台层和关键工作台路由骨架', en: 'Completed portal, console, and key workbench route skeletons' },
      { zh: '建立中英文国际化基础与 mock 数据本地化转换', en: 'Established i18n foundation and localized mock-data transforms' },
      { zh: '引入登录、注册、忘记密码等基础入口页', en: 'Added login, registration, and password-reset entry pages' },
    ],
  },
] as const

export default function ChangelogPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '产品演进与版本透明度' : 'Product Evolution and Transparency'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.changelog')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '更新日志页不再只是占位信息，而是把当前工程化演进、上线重点和模块变化沉淀成对外可读的版本时间线。',
              en: 'The changelog is no longer a placeholder. It becomes a readable timeline of engineering progress, launch highlights, and module evolution.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/blog" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '查看相关文章' : 'Open Related Posts'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/help" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              <span>{locale === 'zh' ? '帮助中心' : 'Help Center'}</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {RELEASES.map(release => (
              <article key={release.version} className="glass rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-semibold text-white">{release.version}</div>
                  <div className="inline-flex items-center gap-1 text-xs text-white/35">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{release.date}</span>
                  </div>
                  <div className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                    {text(locale, release.badge)}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {release.items.map(item => (
                    <div key={item.zh} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                      {text(locale, item)}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <Milestone className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '更新聚焦维度' : 'Update Dimensions'}</span>
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? '页面内容与视觉层' : 'Page content and visual layer'}</div>
                <div>{locale === 'zh' ? '基础状态与任务流' : 'Foundation states and task flows'}</div>
                <div>{locale === 'zh' ? '商业化与资料治理' : 'Commercial and asset governance'}</div>
                <div>{locale === 'zh' ? '对外门户与开发者入口' : 'Portal and developer-facing entry points'}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '推荐联动' : 'Recommended Links'}
              </div>
              <div className="space-y-3">
                {[
                  { label: { zh: '博客', en: 'Blog' }, to: '/blog' },
                  { label: { zh: 'API 文档', en: 'API Docs' }, to: '/api-docs' },
                  { label: { zh: '关于我们', en: 'About Us' }, to: '/aboutus' },
                ].map(item => (
                  <Link key={item.to} to={item.to} className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                    {text(locale, item.label)}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
