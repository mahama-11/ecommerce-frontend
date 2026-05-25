import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { BrainCircuit, Layers, FlaskConical, Paintbrush, ArrowRight, BoxSelect, LayoutTemplate, PackageSearch } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareLoginPath } from '@/utils/authNavigation'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const PIPELINE_STEPS = [
  { icon: Layers, titleKey: 'home.dashboard.step_prep_title', descKey: 'home.dashboard.step_prep_desc', color: 'from-cyan-400/15 to-cyan-600/5', border: 'border-cyan-400/20', iconColor: 'text-cyan-300' },
  { icon: FlaskConical, titleKey: 'home.dashboard.step_sandbox_title', descKey: 'home.dashboard.step_sandbox_desc', color: 'from-violet-400/15 to-violet-600/5', border: 'border-violet-400/20', iconColor: 'text-violet-300' },
  { icon: Paintbrush, titleKey: 'home.dashboard.step_workshop_title', descKey: 'home.dashboard.step_workshop_desc', color: 'from-emerald-400/15 to-emerald-600/5', border: 'border-emerald-400/20', iconColor: 'text-emerald-300' },
] as const

export default function HomePage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const loginPath = getAuthAwareLoginPath(isAuthenticated)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="relative min-h-screen bg-[var(--ecom-bg)] text-[var(--ecom-text-primary)] overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-20rem] top-[-16rem] h-[36rem] w-[36rem] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-[-14rem] top-[24rem] h-[30rem] w-[30rem] rounded-full bg-violet-400/6 blur-3xl" />
        <div className="absolute left-[40%] bottom-[-12rem] h-[24rem] w-[24rem] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      {/* Hero */}
      <motion.header variants={fadeUp} transition={{ duration: 0.6 }} className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
          <BrainCircuit className="h-3.5 w-3.5" />
          {t('home.dashboard.hero_badge')}
        </div>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          {t('home.dashboard.hero_title')}{' '}
          <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
            {t('home.dashboard.hero_highlight')}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--ecom-text-secondary)] sm:text-lg">
          {t('home.dashboard.hero_subtitle')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-[28px] bg-cyan-200 px-7 py-3 text-sm font-bold text-[var(--ecom-action-primary-text)] shadow-[0_0_32px_rgba(34,211,238,0.18)] transition hover:bg-white hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
            >
              {t('home.dashboard.hero_cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to={loginPath}
              className="inline-flex items-center gap-2 rounded-[28px] bg-cyan-200 px-7 py-3 text-sm font-bold text-[var(--ecom-action-primary-text)] shadow-[0_0_32px_rgba(34,211,238,0.18)] transition hover:bg-white hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
            >
              {t('home.cta_start')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-[28px] border border-[var(--ecom-border-strong)] bg-[var(--ecom-surface-raised)] px-7 py-3 text-sm font-semibold text-[var(--ecom-text-secondary)] transition hover:border-[var(--ecom-border-bright)] hover:bg-[var(--ecom-surface-hover)] hover:text-[var(--ecom-text-primary)]"
          >
            {t('home.cta_demo')}
          </Link>
        </div>
      </motion.header>

      {/* Pipeline Steps */}
      <motion.section variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }} className="relative z-10 mx-auto mb-24 max-w-5xl px-6">
        <div className="mb-8 text-center">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200/55">
            {t('home.dashboard.pipeline_title')}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PIPELINE_STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className={`group relative rounded-[28px] border ${step.border} bg-gradient-to-br ${step.color} p-6 backdrop-blur-sm transition hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ${step.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{t(step.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-[var(--ecom-text-muted)]">{t(step.descKey)}</p>
                <div className="absolute right-4 top-4 text-[10px] font-bold text-white/15">0{index + 1}</div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Quick Entry */}
      <motion.section variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="relative z-10 mx-auto mb-24 max-w-5xl px-6">
        <div className="rounded-[28px] border border-[var(--ecom-border)] bg-[var(--ecom-surface-raised)] p-8 shadow-[var(--ecom-shadow-card)] backdrop-blur-sm">
          <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ecom-text-faint)]">
            {t('home.dashboard.quick_entry_title')}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to={isAuthenticated ? '/products' : loginPath} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-cyan-300/25 hover:bg-[var(--ecom-surface-hover)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/[0.08] text-cyan-200">
                <BoxSelect className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/88 group-hover:text-white">{t('home.dashboard.quick_entry_product_center')}</div>
                <div className="mt-0.5 text-xs text-[var(--ecom-text-muted)]">{t('home.dashboard.quick_entry_product_center_hint')}</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[var(--ecom-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
            </Link>
            <Link to={isAuthenticated ? '/aiChat/template' : loginPath} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-violet-300/25 hover:bg-[var(--ecom-surface-hover)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/[0.08] text-violet-200">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/88 group-hover:text-white">{t('home.dashboard.quick_entry_template_market')}</div>
                <div className="mt-0.5 text-xs text-[var(--ecom-text-muted)]">{t('home.dashboard.quick_entry_template_market_hint')}</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[var(--ecom-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-violet-200" />
            </Link>
            <Link to={isAuthenticated ? '/inventory' : loginPath} className="group flex items-center gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4 transition hover:border-amber-300/30 hover:bg-amber-300/[0.06]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/[0.10] text-amber-200">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/88 group-hover:text-white">{t('home.dashboard.quick_entry_inventory_demo')}</div>
                <div className="mt-0.5 text-xs text-[var(--ecom-text-muted)]">{t('home.dashboard.quick_entry_inventory_demo_hint')}</div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-[var(--ecom-text-faint)] transition group-hover:translate-x-0.5 group-hover:text-amber-200" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer spacer */}
      <div className="h-16" />
    </motion.div>
  )
}
