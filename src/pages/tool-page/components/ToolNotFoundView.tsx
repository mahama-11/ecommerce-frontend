import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function ToolNotFoundView() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-6xl">🔍</div>
      <h1 className="text-2xl font-bold text-white/90">{t('tool.notFound')}</h1>
      <p className="text-white/50">{t('tool.notFoundDesc')}</p>
      <Link to="/" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
        {t('common.backToHome')}
      </Link>
    </div>
  )
}
