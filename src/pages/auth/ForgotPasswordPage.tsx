import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowLeft, CheckCircle, Layers } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
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

          {submitted ? (
            <div className="text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold mb-3">{t('auth.resetSent')}</h1>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                {t('auth.resetSentDescription')}
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">{t('auth.forgotTitle')}</h1>
              <p className="text-sm text-white/50 text-center mb-8">{t('auth.forgotSubtitle')}</p>

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

                <button
                  type="submit"
                  className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white"
                >
                  {t('auth.sendResetLink')}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
