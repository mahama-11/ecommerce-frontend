import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, CircleHelp, FileText, Search, Sparkles, Wrench } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const TOPICS = [
  {
    icon: Wrench,
    title: { zh: '视觉工具使用', en: 'Visual Tool Usage' },
    desc: { zh: '从上传素材、配置参数到查看生成记录的完整说明。', en: 'Guides from uploading assets and setting parameters to reviewing generated records.' },
    to: '/draw/changing-model',
  },
  {
    icon: BookOpen,
    title: { zh: '资料库与知识库', en: 'Libraries and Knowledge Base' },
    desc: { zh: '说明知识入库、品牌规则、敏感词和标签体系如何使用。', en: 'Explains how to use knowledge indexing, brand rules, sensitive terms, and tag systems.' },
    to: '/database/knowledge',
  },
  {
    icon: FileText,
    title: { zh: '订单与下载', en: 'Orders and Downloads' },
    desc: { zh: '覆盖订阅、加油包、下载交付和文件失效说明。', en: 'Covers subscriptions, credit packs, delivery downloads, and file-expiry behavior.' },
    to: '/orderList',
  },
] as const

const FAQS = [
  {
    q: { zh: '如何开始第一次生成？', en: 'How do I start my first generation?' },
    a: {
      zh: '建议先从首页进入任一视觉工具，上传 1 张示例素材后完成一次完整生成，再回到记录页查看任务状态。',
      en: 'Start from any visual tool on the home page, upload one sample asset, complete a generation, then review its status from the records page.',
    },
  },
  {
    q: { zh: '模板市场和我的模板有什么区别？', en: 'What is the difference between the marketplace and my templates?' },
    a: {
      zh: '模板市场是可浏览和复制的公共模板资产层，我的模板库承接你复制、修改和沉淀后的私有或团队模板。',
      en: 'The marketplace is the browsable public template layer, while My Templates stores the private or team versions you copy, edit, and retain.',
    },
  },
  {
    q: { zh: '下载中心里的文件为什么会过期？', en: 'Why do files in the download center expire?' },
    a: {
      zh: '交付包通常会有保留周期，后续会支持重新打包和再次下载，避免长期堆积大文件。',
      en: 'Delivery bundles usually have a retention window. Re-bundling and re-download support will be added later to avoid storing large files indefinitely.',
    },
  },
] as const

export default function HelpCenterPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '新手入口与问题排查' : 'Onboarding and Troubleshooting'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.helpCenter')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: '帮助中心不只是静态 FAQ，而是连接首页、工具、模板、资料库、订单和下载交付的统一文档入口。',
              en: 'The Help Center is more than a static FAQ. It is the unified documentation entry linking the home page, tools, templates, libraries, orders, and delivery flows.',
            })}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="glass rounded-2xl p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  readOnly
                  value={locale === 'zh' ? '例如：如何复制模板到我的模板库' : 'Example: how to copy a template into my library'}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white/55 outline-none"
                />
              </div>
            </div>
            <Link to="/contact" className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '仍未解决？联系支持' : 'Still stuck? Contact support'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {TOPICS.map(item => (
            <article key={item.title.zh} className="glass rounded-2xl p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <item.icon className="h-5 w-5 text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{text(locale, item.title)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{text(locale, item.desc)}</p>
              <Link to={item.to} className="mt-5 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200">
                <span>{locale === 'zh' ? '进入查看' : 'Open'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="glass rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white/75">
              <CircleHelp className="h-4 w-4 text-brand-400" />
              <span>{locale === 'zh' ? '高频问题' : 'Frequently Asked Questions'}</span>
            </div>
            <div className="space-y-4">
              {FAQS.map(item => (
                <div key={item.q.zh} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <div className="text-base font-semibold text-white">{text(locale, item.q)}</div>
                  <div className="mt-3 text-sm leading-6 text-white/50">{text(locale, item.a)}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '推荐阅读' : 'Recommended Reads'}
              </div>
              <div className="space-y-3">
                {[
                  { label: { zh: '模板市场', en: 'Template Market' }, to: '/aiChat/template' },
                  { label: { zh: '知识库对话', en: 'Knowledge Chat' }, to: '/chat/doc' },
                  { label: { zh: '下载中心', en: 'Download Center' }, to: '/downloadCenter' },
                ].map(item => (
                  <Link key={item.to} to={item.to} className="block rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                    {text(locale, item.label)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="mb-3 text-sm font-medium text-white/75">
                {locale === 'zh' ? '后续计划接入' : 'Planned Next'}
              </div>
              <div className="space-y-2 text-sm text-white/45">
                <div>{locale === 'zh' ? '帮助搜索真实检索' : 'Real help search'}</div>
                <div>{locale === 'zh' ? '按工具的分步引导' : 'Tool-specific step guides'}</div>
                <div>{locale === 'zh' ? '视频教程与更新联动' : 'Tutorial videos and release linkage'}</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
