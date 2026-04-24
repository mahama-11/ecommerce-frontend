import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Layers, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { login } from '@/services/auth'
import { applyAuth } from '@/state/auth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectPath = typeof location.state?.from === 'string' ? location.state.from : getAuthAwareStartPath(true)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = await login({ email, password })
      applyAuth(payload)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] bg-brand-500/20 -top-32 -left-32" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent-500/15 -bottom-24 -right-24" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Agent Ecommerce</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-white/50 text-center mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('common.email')}</label>
              <div className="glass rounded-xl flex items-center px-4 py-3 focus-within:border-brand-500/40 transition-colors">
                <Mail className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 outline-none ml-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('common.password')}</label>
              <div className="glass rounded-xl flex items-center px-4 py-3 focus-within:border-brand-500/40 transition-colors">
                <Lock className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 outline-none ml-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-white/30 hover:text-white/60 transition-colors ml-2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                {t('auth.forgotTitle')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white"
            >
              {submitting ? t('common.loading') : t('common.login')}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">{t('auth.orContinueWith')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="glass rounded-xl py-3 text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
              Google
            </button>
            <button className="glass rounded-xl py-3 text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
              GitHub
            </button>
          </div>

          <p className="text-sm text-white/40 text-center mt-6">
            {t('auth.hasAccount').replace('?', '').replace('？', '')}
            {' / '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
              {t('common.signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
