import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, CheckCircle, Users, Gem, Store, Palette, Shirt } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SOLUTIONS, TOOLS, getLocalizedSolution, getLocalizedTool } from '@/mock/data'
import { useAuth } from '@/hooks/useAuth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'

const SOLUTION_ICON_MAP: Record<string, LucideIcon> = {
  Gem, Store, Palette, Shirt,
}

function SolutionIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = SOLUTION_ICON_MAP[icon]
  if (IconComponent) return <IconComponent className={className} />
  return <span className={className}>{icon}</span>
}

function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-6xl">📄</div>
      <h1 className="text-2xl font-bold text-white/90">{t('solution.notFound')}</h1>
      <p className="text-white/50">{t('solution.notFoundDesc')}</p>
      <Link to="/" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
        {t('common.backToHome')}
      </Link>
    </div>
  )
}

export default function SolutionDetailPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const solution = SOLUTIONS.find((s) => s.slug === slug)

  if (!solution) return <NotFound />

  const language = i18n.resolvedLanguage ?? i18n.language
  const localizedSolution = getLocalizedSolution(solution, language)
  const relatedTools = TOOLS.slice(0, 4)
  const startPath = getAuthAwareStartPath(isAuthenticated)

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${localizedSolution.color} opacity-15`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />
        <div className="glow-orb w-[500px] h-[500px] bg-brand-500/20 -top-40 -right-40" />

        <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {t('common.backToHome')}
          </Link>

          <div className="flex flex-col items-center text-center gap-6">
            <div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${localizedSolution.color} flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300`}
            >
              <SolutionIcon icon={localizedSolution.icon} className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">{localizedSolution.title}</h1>
            <p className="text-xl text-white/60 max-w-xl">{localizedSolution.subtitle}</p>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Users size={16} />
              <span>{t('solution.targetAudience')}: {localizedSolution.audience}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {localizedSolution.features.map((feature) => (
            <div
              key={feature}
              className="glass rounded-xl p-5 flex items-start gap-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{feature}</h3>
                <p className="text-xs text-white/40 mt-1">
                  {t('solution.aiProcess')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16">
        <h2 className="text-xl font-bold text-white mb-6">{t('solution.relatedTools')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatedTools.map((tool) => {
            const localizedTool = getLocalizedTool(tool, language)

            return (
              <Link
                key={tool.id}
                to={`/products/workbench/visual-tools/${tool.slug}`}
                className="glass tool-card rounded-xl p-5 block group"
              >
                <div className="text-3xl mb-3">{localizedTool.icon}</div>
                <h3 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                  {localizedTool.name}
                </h3>
                <p className="text-xs text-white/40 mt-1 line-clamp-2">{localizedTool.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t('solution.useTool')}</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 pb-20">
        <div className="glass-strong rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold gradient-text mb-3">{t('solution.ctaTitle')}</h2>
          <p className="text-white/50 mb-6">
            {t('solution.ctaDesc', { title: localizedSolution.title })}
          </p>
          <Link
            to={startPath}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold"
          >
            {t('common.startUsing')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
