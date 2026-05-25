import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FileCode2, KeyRound, Layers3, Sparkles, Webhook } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const API_GROUPS = [
  {
    icon: Layers3,
    title: { zh: '生成接口', en: 'Generation APIs' },
    desc: {
      zh: '覆盖图像生成、任务创建、结果查询和批量处理的核心能力。',
      en: 'Cover image generation, task creation, result retrieval, and batch processing capabilities.',
    },
  },
  {
    icon: KeyRound,
    title: { zh: '鉴权与配额', en: 'Auth and Quotas' },
    desc: {
      zh: '统一说明 API Key、调用配额、套餐权益和错误返回规范。',
      en: 'Describe API keys, quotas, plan entitlements, and error response conventions.',
    },
  },
  {
    icon: Webhook,
    title: { zh: '回调与异步任务', en: 'Callbacks and Async Jobs' },
    desc: {
      zh: '围绕任务状态变更、结果回传和失败重试设计异步交互。',
      en: 'Design async interactions around status changes, delivery callbacks, and retry behavior.',
    },
  },
] as const

const ENDPOINTS = [
  { method: 'POST', path: '/api/v1/generate/image', summary: { zh: '创建图像生成任务', en: 'Create an image generation job' } },
  { method: 'GET', path: '/api/v1/tasks/:id', summary: { zh: '查询任务状态与结果', en: 'Fetch task status and outputs' } },
  { method: 'POST', path: '/api/v1/assets/upload', summary: { zh: '上传素材并写入资料层', en: 'Upload assets into the library layer' } },
  { method: 'GET', path: '/api/v1/orders', summary: { zh: '读取订单与权益信息', en: 'Read orders and entitlements' } },
] as const

export default function ApiDocsPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '开发者接入入口' : 'Developer Integration Entry'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.apiDocs')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: 'API 文档页从占位页升级为开发者入口，先把能力目录、接入方式、错误规范和异步任务模式组织起来，为后续真实开放接口预热。',
              en: 'The API docs evolve from a placeholder into a developer entry point, organizing capability catalogs, auth patterns, error conventions, and async job flows ahead of real public APIs.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pricing" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '查看计费方案' : 'View Pricing'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/help" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              <span>{locale === 'zh' ? '查看帮助中心' : 'Open Help Center'}</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {API_GROUPS.map(item => (
            <article key={item.title.zh} className="glass rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <item.icon className="h-5 w-5 text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{text(locale, item.title)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{text(locale, item.desc)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white/75">
              <FileCode2 className="h-4 w-4 text-brand-400" />
              <span>{locale === 'zh' ? '接口目录预览' : 'Endpoint Preview'}</span>
            </div>
            <div className="space-y-3">
              {ENDPOINTS.map(item => (
                <div key={item.path} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-300">
                      {item.method}
                    </span>
                    <code className="text-sm text-white/80">{item.path}</code>
                  </div>
                  <div className="mt-2 text-sm text-white/45">{text(locale, item.summary)}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '首批文档模块' : 'Initial Doc Modules'}
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? '鉴权说明与 API Key 管理' : 'Authentication and API key management'}</div>
                <div>{locale === 'zh' ? '错误码与限流说明' : 'Error codes and rate limits'}</div>
                <div>{locale === 'zh' ? '异步任务与回调示例' : 'Async jobs and callback examples'}</div>
                <div>{locale === 'zh' ? 'SDK 与调用示例' : 'SDK and request examples'}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '推荐联动页面' : 'Related Pages'}
              </div>
              <div className="space-y-3">
                {[
                  { label: { zh: '帮助中心', en: 'Help Center' }, to: '/help' },
                  { label: { zh: '定价页', en: 'Pricing' }, to: '/pricing' },
                  { label: { zh: '联系我们', en: 'Contact Us' }, to: '/contact' },
                ].map(item => (
                  <Link key={item.to} to={item.to} className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55 transition-colors hover:bg-[var(--ecom-surface-hover)] hover:text-white">
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
