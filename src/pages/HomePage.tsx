import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Play,
  ArrowRight,
  Zap,
  Users,
  ImagePlus,
  Wrench,
  Clock,
  Check,
} from 'lucide-react'
import {
  SOLUTIONS,
  getLocalizedSolution,
} from '@/mock/data'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath, getWorkbenchEntryPath } from '@/utils/authNavigation'
import PricingPlanGrid from '@/components/pricing/PricingPlanGrid'

const STATS_KEYS = [
  { valueKey: 'home.stats.sellers_value', labelKey: 'home.stats.sellers', icon: Users },
  { valueKey: 'home.stats.images_value', labelKey: 'home.stats.images', icon: ImagePlus },
  { valueKey: 'home.stats.tools_value', labelKey: 'home.stats.tools', icon: Wrench },
  { valueKey: 'home.stats.speed_value', labelKey: 'home.stats.speed', icon: Clock },
] as const

const MARQUEE_KEYS = [
  'home.marquee.sellers_trust',
  'home.marquee.ai_images',
  'home.marquee.rating',
  'home.marquee.speed',
  'home.marquee.tools',
  'home.marquee.global',
] as const

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale: 'zh' | 'en' = language.startsWith('en') ? 'en' : 'zh'
  const startPath = getAuthAwareStartPath(isAuthenticated)
  const workbenchPath = getWorkbenchEntryPath()

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-72px)] flex items-center justify-center px-4 sm:px-6 pt-24 pb-32">
        <div className="glow-orb w-[600px] h-[600px] bg-brand-500/20 -top-40 -left-40" />
        <div className="glow-orb w-[500px] h-[500px] bg-accent-500/15 -bottom-32 -right-32" />
        <div className="glow-orb w-[300px] h-[300px] bg-pink-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-0 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white/70">
              {isAuthenticated
                ? (locale === 'zh' ? '已登录，可直接继续你的 AI 工作流' : 'Signed in and ready to continue your AI workflow')
                : t('home.badge')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            {t('home.title_line1')}
            <br />
            <span className="gradient-text">{t('home.title_line2')}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 animate-slide-up">
            {isAuthenticated
              ? (
                locale === 'zh'
                  ? '继续从首页进入你的工作流、模板市场和用户中心；产品首页本身仍然保持统一的品牌展示。'
                  : 'Continue into your workspace, template market, or user center while keeping the home page as a consistent product-facing landing experience.'
              )
              : t('home.subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-20 animate-slide-up">
            <Link
              to={isAuthenticated ? workbenchPath : startPath}
              className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold text-white inline-flex items-center gap-2"
            >
              {isAuthenticated
                ? (locale === 'zh' ? '继续工作' : 'Continue Working')
                : t('home.cta_start')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="btn-outline px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" /> {locale === 'zh' ? '进入商品中心' : 'Product Center'}
            </Link>
            <Link
              to={isAuthenticated ? '/aiChat/template' : '/solutions/boutique'}
              className="btn-outline px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> {isAuthenticated ? (locale === 'zh' ? '打开模板市场' : 'Open Template Market') : t('home.cta_demo')}
            </Link>
          </div>

        </div>
      </section>

      {/* ── Social proof marquee ── */}
      <section className="relative overflow-hidden py-8 border-y border-white/5">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_KEYS, ...MARQUEE_KEYS].map((key, i) => (
            <span
              key={i}
              className="mx-8 text-sm text-white/40 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500/60" />
              {t(key)}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="reveal py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS_KEYS.map(stat => (
            <div key={stat.labelKey} className="glass rounded-2xl p-6 text-center">
              <stat.icon className="w-8 h-8 text-brand-400 mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-bold gradient-text">{t(stat.valueKey)}</p>
              <p className="text-sm text-white/50 mt-1">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solutions ── */}
      <section className="reveal py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.solutions.title_prefix')}<span className="gradient-text">{t('home.solutions.title_highlight')}</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t('home.solutions.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SOLUTIONS.map(sol => {
              const localizedSolution = getLocalizedSolution(sol, language)

              return (
                <div
                  key={sol.id}
                  className="glass rounded-2xl p-6 group hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sol.color} flex items-center justify-center mb-4 text-2xl`}
                  >
                    {sol.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{localizedSolution.title}</h3>
                  <p className="text-xs text-white/40 mb-4">{localizedSolution.audience}</p>
                  <ul className="space-y-2 mb-6">
                    {localizedSolution.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/solutions/${sol.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    {t('home.solutions.learn_more')} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <section className="reveal py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.pricing_preview.title_prefix')}<span className="gradient-text">{t('home.pricing_preview.title_highlight')}</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t('home.pricing_preview.subtitle')}
            </p>
          </div>

          <PricingPlanGrid variant="preview" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="reveal py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="glow-orb w-[300px] h-[300px] bg-brand-500/15 -top-20 -right-20" />
          <div className="glow-orb w-[200px] h-[200px] bg-accent-500/10 -bottom-10 -left-10" />

          <div className="relative z-10">
            <Zap className="w-10 h-10 text-brand-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.cta.title_prefix')}<span className="gradient-text">{t('home.cta.title_highlight')}</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto mb-8">
              {t('home.cta.subtitle')}
            </p>
            <Link
              to={startPath}
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
            >
              {t('home.cta.button')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
