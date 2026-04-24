import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { PRICING_PLANS, getLocalizedPricingPlan } from '@/mock/data'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'

interface FaqItem {
  q: string
  a: string
}

export default function PricingPage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const language = i18n.resolvedLanguage ?? i18n.language
  const startPath = getAuthAwareStartPath(isAuthenticated)

  const faqItems = t('pricing.faq.items', { returnObjects: true }) as FaqItem[]

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
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 text-center">
        <div className="glow-orb w-[500px] h-[500px] bg-brand-500/15 -top-40 left-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 animate-slide-up">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white/70">{t('pricing.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
            {t('pricing.title_prefix')}<span className="gradient-text">{t('pricing.title_highlight')}</span>
          </h1>
          <p className="text-lg text-white/50 animate-slide-up">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="reveal px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PRICING_PLANS.map(plan => {
            const localizedPlan = getLocalizedPricingPlan(plan, language)

            return (
              <div
                key={plan.id}
                className={`relative glass rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-brand-500/40 shadow-[0_0_40px_-8px_rgba(59,130,246,0.3)]'
                    : 'hover:border-white/15'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-primary px-4 py-1 rounded-full text-xs font-semibold text-white">
                    {t('pricing.popular')}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{localizedPlan.name}</h3>
                  <p className="text-sm text-white/40">{localizedPlan.desc}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold">{localizedPlan.price}</span>
                  <span className="text-sm text-white/40 ml-1">{localizedPlan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {localizedPlan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={startPath}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
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
      </section>

      {/* ── FAQ ── */}
      <section className="reveal px-4 sm:px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('pricing.faq_title')}
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-white/90">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-4 text-sm text-white/50 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="reveal px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="glow-orb w-[250px] h-[250px] bg-brand-500/15 -top-16 -right-16" />
          <div className="glow-orb w-[200px] h-[200px] bg-accent-500/10 -bottom-10 -left-10" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('pricing.bottom_cta.title')}
            </h2>
            <p className="text-white/50 mb-8">
              {t('pricing.bottom_cta.subtitle')}
            </p>
            <a
              href="mailto:sales@agent-ecommerce.com"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
            >
              {t('pricing.bottom_cta.button')} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
