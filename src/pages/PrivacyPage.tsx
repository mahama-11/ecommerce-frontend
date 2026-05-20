import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Database, Lock, ShieldCheck, Sparkles } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const SECTIONS = [
  {
    icon: Database,
    title: { zh: '收集与用途', en: 'Collection and Usage' },
    desc: { zh: '说明账户信息、上传素材、日志与订单数据如何被使用。', en: 'Describe how account data, uploaded assets, logs, and order records are used.' },
  },
  {
    icon: Lock,
    title: { zh: '存储与保留', en: 'Storage and Retention' },
    desc: { zh: '定义资料、结果文件、下载包和日志的保留周期。', en: 'Define retention windows for assets, generated outputs, downloads, and logs.' },
  },
  {
    icon: ShieldCheck,
    title: { zh: '权限与删除', en: 'Access and Deletion' },
    desc: { zh: '说明团队权限、用户删除请求和数据安全边界。', en: 'Explain team access, deletion requests, and data-protection boundaries.' },
  },
] as const

export default function PrivacyPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '隐私与数据说明容器' : 'Privacy and Data Policy Container'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.privacyPolicy')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '隐私政策页现在不再只是法务占位，而是先把隐私文档未来需要承载的章节结构和数据治理关注点整理出来。',
              en: 'The privacy page is no longer just a legal placeholder. It now organizes the future section structure and data-governance concerns the policy needs to carry.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/terms" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '查看服务条款' : 'Open Terms'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              <span>{locale === 'zh' ? '联系团队' : 'Contact Team'}</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {SECTIONS.map(item => (
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
            <div className="mb-5 text-sm font-medium text-white/75">
              {locale === 'zh' ? '文档章节草案' : 'Draft Policy Sections'}
            </div>
            <div className="space-y-3">
              {[
                locale === 'zh' ? '我们收集哪些数据' : 'What data we collect',
                locale === 'zh' ? '这些数据如何被使用' : 'How this data is used',
                locale === 'zh' ? '结果文件与日志保留多久' : 'How long files and logs are retained',
                locale === 'zh' ? '如何发起删除与访问请求' : 'How deletion and access requests work',
              ].map(item => (
                <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium text-white/75">
              {locale === 'zh' ? '当前状态' : 'Current State'}
            </div>
            <div className="space-y-2 text-sm text-white/45">
              <div>{locale === 'zh' ? '条款结构清晰' : 'Clear policy structure'}</div>
              <div>{locale === 'zh' ? '版本更新清晰可追踪' : 'Version updates are easy to track'}</div>
              <div>{locale === 'zh' ? '协议正文会随产品持续完善' : 'Policy content will keep evolving with the product'}</div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
