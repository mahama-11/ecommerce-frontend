import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Briefcase, Sparkles, Users, Workflow } from 'lucide-react'

type Locale = 'zh' | 'en'

interface LocalizedText {
  zh: string
  en: string
}

function text(locale: Locale, value: LocalizedText) {
  return locale === 'zh' ? value.zh : value.en
}

const ROLE_GROUPS = [
  {
    icon: Briefcase,
    title: { zh: '产品与设计', en: 'Product and Design' },
    desc: { zh: '负责工作台体验、信息架构和多角色协作流程。', en: 'Own workbench experience, information architecture, and multi-role collaboration flows.' },
  },
  {
    icon: Workflow,
    title: { zh: '工程与平台', en: 'Engineering and Platform' },
    desc: { zh: '覆盖前端、后端、任务系统、资料层和交付链路。', en: 'Cover frontend, backend, task systems, data layers, and delivery flows.' },
  },
  {
    icon: Users,
    title: { zh: '增长与商业化', en: 'Growth and Commercialization' },
    desc: { zh: '围绕内容增长、企业服务、渠道合作和客户成功。', en: 'Focus on content growth, enterprise service, channel partnerships, and customer success.' },
  },
] as const

export default function CareersPage() {
  const { t, i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'zh'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>{locale === 'zh' ? '团队与岗位入口' : 'Team and Career Entry'}</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text sm:text-5xl">{t('pages.joinUs')}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            {text(locale, {
              zh: 'Careers 页从占位页升级为团队与岗位的品牌延伸页，当前先落地团队方向、协作方式和岗位分组骨架，后续再接真实职位和投递流。',
              en: 'The Careers page evolves from a placeholder into a team and hiring extension page, starting with role groups, collaboration style, and hiring structure before real job listings and applications.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/aboutus" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
              <span>{locale === 'zh' ? '了解团队背景' : 'Learn About the Team'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              <span>{locale === 'zh' ? '联系团队' : 'Contact Team'}</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ROLE_GROUPS.map(item => (
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
              {locale === 'zh' ? '当前招聘页骨架内容' : 'Current Hiring Page Structure'}
            </div>
            <div className="space-y-3">
              {[
                locale === 'zh' ? '团队方向与协作方式介绍' : 'Team directions and collaboration style',
                locale === 'zh' ? '岗位分组与能力画像' : 'Role groups and capability profiles',
                locale === 'zh' ? '招聘流程与投递说明' : 'Hiring process and application notes',
                locale === 'zh' ? '文化内容与品牌表达' : 'Culture content and employer branding',
              ].map(item => (
                <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium text-white/75">
              {locale === 'zh' ? '后续可接能力' : 'Next-step Integrations'}
            </div>
            <div className="space-y-2 text-sm text-white/45">
              <div>{locale === 'zh' ? '真实岗位列表' : 'Real job listings'}</div>
              <div>{locale === 'zh' ? '在线投递与状态跟踪' : 'Application and status tracking'}</div>
              <div>{locale === 'zh' ? '招聘 FAQ 与团队介绍' : 'Hiring FAQ and team stories'}</div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
