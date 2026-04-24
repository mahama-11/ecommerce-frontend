import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff, User, Layers } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { register } from '@/services/auth'
import { applyAuth } from '@/state/auth'
import { getAuthAwareStartPath } from '@/utils/authNavigation'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth({ refreshOnMount: false })
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
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
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the terms first.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = await register({
        full_name: username,
        email,
        password,
        language: 'zh',
      })
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
      <div className="glow-orb w-[500px] h-[500px] bg-brand-500/20 -top-32 -right-32" />
      <div className="glow-orb w-[400px] h-[400px] bg-accent-500/15 -bottom-24 -left-24" />
      <div className="glow-orb w-[250px] h-[250px] bg-pink-500/10 bottom-1/3 left-1/4" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Agent Ecommerce</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-white/50 text-center mb-8">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('common.username')}</label>
              <div className="glass rounded-xl flex items-center px-4 py-3 focus-within:border-brand-500/40 transition-colors">
                <User className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('auth.usernamePlaceholder')}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 outline-none ml-3"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t('auth.confirmPassword')}</label>
              <div className="glass rounded-xl flex items-center px-4 py-3 focus-within:border-brand-500/40 transition-colors">
                <Lock className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 outline-none ml-3"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(prev => !prev)}
                  className="text-white/30 hover:text-white/60 transition-colors ml-2"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500/30"
              />
              <span className="text-sm text-white/50 leading-snug">
                {t('auth.agreeToTerms')}{' '}
                <Link to="/terms" className="text-brand-400 hover:text-brand-300 transition-colors">
                  {t('auth.termsOfService')}
                </Link>{' '}
                {t('common.and')}{' '}
                <Link to="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors">
                  {t('auth.privacyPolicy')}
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white"
            >
              {submitting ? t('common.loading') : t('auth.createAccount')}
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">{t('auth.orContinueWith')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="glass rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button className="glass rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="text-sm text-white/40 text-center mt-6">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
              {t('auth.signInNow')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
