import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const redirect = searchParams.get('redirect') || '/'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder: replace with real auth API call
    navigate(redirect, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a12]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#0d0f18] p-8">
        <h1 className="text-center text-xl font-bold text-white">Sign In</h1>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        />
        <button type="submit" className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
          Sign In
        </button>
        <p className="text-center text-xs text-white/40">
          Don't have an account? <a href="/register" className="text-cyan-400 hover:underline">Register</a>
        </p>
      </form>
    </div>
  )
}
