import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { register } from '@/services/auth'
import { applyAuth } from '@/state/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') || '/products'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = await register({
        full_name: fullName,
        email,
        password,
        organization_name: organizationName || undefined,
        language: 'zh',
      })
      applyAuth(payload)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a12] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#0d0f18] p-8">
        <h1 className="text-center text-xl font-bold text-white">Create Account</h1>
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          required
          minLength={2}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <input
          type="text"
          value={organizationName}
          onChange={e => setOrganizationName(e.target.value)}
          placeholder="Organization name"
          autoComplete="organization"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <button disabled={submitting} type="submit" className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Creating...' : 'Register'}
        </button>
        <p className="text-center text-xs text-white/40">
          Already have an account? <a href="/login" className="text-cyan-400 hover:underline">Sign In</a>
        </p>
      </form>
    </div>
  )
}
