import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpenText, FileText, Search, Sparkles, TrendingUp } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const CATEGORIES = [
  { zh: '案例拆解', en: 'Case Studies' },
  { zh: '操作教程', en: 'Tutorials' },
  { zh: '产品更新', en: 'Product Updates' },
  { zh: '行业趋势', en: 'Industry Insights' },
] as const

const POSTS = [
  {
    tag: { zh: '案例拆解', en: 'Case Study' },
    title: { zh: '如何把商品图生产链从单点工具升级为工作台', en: 'How to evolve product-image workflows from tools into workbenches' },
    desc: {
      zh: '从上传、任务队列、素材回收、下载交付四个层次拆解视觉工作流。',
      en: 'Break down visual workflows into upload, task queue, asset reuse, and delivery layers.',
    },
  },
  {
    tag: { zh: '操作教程', en: 'Tutorial' },
    title: { zh: '模板市场到我的模板库：如何沉淀团队 Prompt 资产', en: 'From marketplace to my library: how teams retain prompt assets' },
    desc: {
      zh: '解释复制、分叉、发布和团队共享的典型模板生命周期。',
      en: 'Explain copy, fork, publish, and team-sharing patterns in a practical template lifecycle.',
    },
  },
  {
    tag: { zh: '产品更新', en: 'Update' },
    title: { zh: '为什么我们优先补上传队列、订单流和下载中心', en: 'Why we prioritized upload queues, order flows, and the download center' },
    desc: {
      zh: '展示从视觉 mock 迈向可运营产品时，哪些基础能力必须最先补齐。',
      en: 'Show which foundations must come first when moving from a visual mock toward an operable product.',
    },
  },
] as const

export default function BlogPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '内容中心与增长入口' : 'Content Hub and Growth Entry'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.blog')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '沉淀案例、教程、产品更新和行业趋势，帮助团队与客户更快理解最佳实践。',
              en: 'Case studies, tutorials, product updates, and industry insights help teams and customers learn best practices faster.',
            })}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <div className="glass rounded-2xl p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  readOnly
                  value={locale === 'zh' ? '搜索案例、教程或更新...' : 'Search cases, tutorials, or updates...'}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white/55 outline-none"
                />
              </div>
            </div>
            <Link to="/changelog" className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '查看更新日志' : 'View Changelog'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {CATEGORIES.map(item => (
            <div key={item.zh} className="glass rounded-2xl p-5">
              <div className="text-sm font-medium text-white">{text(locale, item)}</div>
              <div className="mt-2 text-xs text-white/40">
                {locale === 'zh' ? '内容栏目持续更新' : 'Editorial sections in progress'}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {POSTS.map(post => (
              <article key={post.title.zh} className="glass rounded-2xl p-6">
                <div className="inline-flex rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-300">
                  {text(locale, post.tag)}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-white">{text(locale, post.title)}</h2>
                <p className="mt-3 text-sm leading-7 text-white/55">{text(locale, post.desc)}</p>
                <button className="mt-5 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200">
                  <span>{locale === 'zh' ? '阅读全文' : 'Read More'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <TrendingUp className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '内容价值' : 'Content Value'}</span>
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? '对外案例表达' : 'External case storytelling'}</div>
                <div>{locale === 'zh' ? '教程型增长内容' : 'Tutorial-led growth content'}</div>
                <div>{locale === 'zh' ? '产品透明更新入口' : 'Transparent product updates'}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <BookOpenText className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '相关页面' : 'Related Pages'}</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: { zh: '帮助中心', en: 'Help Center' }, to: '/help' },
                  { label: { zh: '更新日志', en: 'Changelog' }, to: '/changelog' },
                  { label: { zh: '关于我们', en: 'About Us' }, to: '/aboutus' },
                ].map(item => (
                  <Link key={item.to} to={item.to} className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                    {text(locale, item.label)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
                <FileText className="h-4 w-4 text-brand-400" />
                <span>{locale === 'zh' ? '后续扩展位' : 'Next Extensions'}</span>
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? '文章详情页' : 'Article detail pages'}</div>
                <div>{locale === 'zh' ? '内容标签与筛选' : 'Tags and filtering'}</div>
                <div>{locale === 'zh' ? 'SEO 落地页模板' : 'SEO landing templates'}</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
