import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Play,
  ArrowRight,
  Zap,
  Image,
  MessageSquare,
  Database,
  Users,
  ImagePlus,
  Wrench,
  Clock,
  Check,
} from 'lucide-react'
import {
  SOLUTIONS,
  PRICING_PLANS,
  TOOL_CATEGORIES,
  TOOLS,
  NAV_TOOL_GROUPS,
  getLocalizedTool,
  getLocalizedSolution,
  getLocalizedPricingPlan,
} from '@/mock/data'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath, getWorkbenchEntryPath } from '@/utils/authNavigation'

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
  const startPath = getAuthAwareStartPath(isAuthenticated)

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

  const PRODUCT_LINES = [
    {
      key: 'visual',
      icon: Image,
      title: t('home.product_lines.visual_title'),
      desc: t('home.product_lines.visual_desc'),
      color: 'from-brand-500 to-accent-500',
      tools: TOOLS.slice(0, 6),
    },
    {
      key: 'ops',
      icon: MessageSquare,
      title: t('home.product_lines.ops_title'),
      desc: t('home.product_lines.ops_desc'),
      color: 'from-purple-500 to-pink-500',
      features: NAV_TOOL_GROUPS[1].items.map(i => t(i.labelKey)),
    },
    {
      key: 'data',
      icon: Database,
      title: t('home.product_lines.data_title'),
      desc: t('home.product_lines.data_desc'),
      color: 'from-emerald-500 to-teal-500',
      features: NAV_TOOL_GROUPS[2].items.map(i => t(i.labelKey)),
    },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 pb-32">
        <div className="glow-orb w-[600px] h-[600px] bg-brand-500/20 -top-40 -left-40" />
        <div className="glow-orb w-[500px] h-[500px] bg-accent-500/15 -bottom-32 -right-32" />
        <div className="glow-orb w-[300px] h-[300px] bg-pink-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-0 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white/70">{t('home.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            {t('home.title_line1')}
            <br />
            <span className="gradient-text">{t('home.title_line2')}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 animate-slide-up">
            {t('home.subtitle')}
          </p>

          <div className="flex items-center justify-center gap-4 mb-20 animate-slide-up">
            <Link
              to={getWorkbenchEntryPath()}
              className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold text-white inline-flex items-center gap-2"
            >
              {t('home.cta_start')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/solutions/boutique"
              className="btn-outline px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> {t('home.cta_demo')}
            </Link>
          </div>

          <div className="relative max-w-5xl mx-auto animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TOOL_CATEGORIES.slice(0, 3).map((cat, i) => (
                <div
                  key={cat.key}
                  className={`glass rounded-2xl p-6 h-48 bg-gradient-to-br ${cat.color} flex flex-col justify-between`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <p className="font-semibold text-white/90">{t(cat.labelKey)}</p>
                    <p className="text-sm text-white/50 mt-1">
                      {t('home.tools_count', { count: TOOLS.filter(tl => tl.category === cat.key).length })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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

      {/* ── Product Lines ── */}
      <section className="reveal py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.product_lines.title_prefix')}<span className="gradient-text">{t('home.product_lines.title_highlight')}</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t('home.product_lines.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRODUCT_LINES.map(line => (
              <div
                key={line.key}
                className="glass rounded-2xl p-8 group hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${line.color} flex items-center justify-center mb-5`}
                >
                  <line.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{line.title}</h3>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">{line.desc}</p>

                {'tools' in line && line.tools ? (
                  <div className="flex flex-wrap gap-2">
                    {line.tools.map(tool => {
                      const localizedTool = getLocalizedTool(tool, language)

                      return (
                      <Link
                        key={tool.id}
                        to={`/draw/${tool.slug}`}
                        className="glass rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-brand-400 hover:border-brand-500/30 transition-colors"
                      >
                        {localizedTool.icon} {localizedTool.name}
                      </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {line.features.map(f => (
                      <span
                        key={f}
                        className="glass rounded-lg px-3 py-1.5 text-xs text-white/60"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map(plan => {
              const localizedPlan = getLocalizedPricingPlan(plan, language)

              return (
                <div
                  key={plan.id}
                  className={`relative glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-brand-500/40 shadow-[0_0_40px_-8px_rgba(59,130,246,0.3)]'
                      : 'hover:border-white/15'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-primary px-3 py-1 rounded-full text-xs font-semibold text-white">
                      {t('home.pricing_preview.popular')}
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{localizedPlan.name}</h3>
                  <p className="text-sm text-white/40 mb-4">{localizedPlan.desc}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{localizedPlan.price}</span>
                    <span className="text-sm text-white/40">{localizedPlan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {localizedPlan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/pricing"
                    className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      plan.popular
                        ? 'btn-primary text-white'
                        : 'btn-outline'
                    }`}
                  >
                    {localizedPlan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
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
