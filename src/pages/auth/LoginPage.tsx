import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '@/services/auth'
import { applyAuth } from '@/state/auth'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') || '/products'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = await login({ email, password })
      applyAuth(payload)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ecom-bg)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[var(--ecom-surface)] p-8">
        <h1 className="text-center text-xl font-bold text-white">Sign In</h1>
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:ring-1 focus:ring-cyan-400"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0 focus:ring-1 focus:ring-cyan-400"
        />
        <Button disabled={submitting} type="submit" className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
        <p className="text-center text-xs text-white/40">
          Don&apos;t have an account? <a href="/register" className="text-cyan-400 hover:underline">Register</a>
        </p>
      </form>
    </div>
  )
}
