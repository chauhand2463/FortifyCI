'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { services } from '@/services/api'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [name, setName] = useState('')
  const router = useRouter()
  const login = useAuthStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await services.login(email, password)
        login(res.user, res.token)
        router.push('/dashboard')
      } else if (mode === 'register') {
        const res = await services.register(email, name, password)
        login(res.user, res.token)
        router.push('/dashboard')
      } else {
        await services.forgotPassword(email)
        setError('Password reset link sent to your email')
        setMode('login')
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080A14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#00D4AA]/5 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-[#4DA6FF]/5 blur-[100px]" />

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-[#5A6380] hover:text-[#EEF0F7] transition-colors text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-xl shadow-[#00D4AA]/20 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FortifyCI</h1>
          <p className="text-[#5A6380] mt-1 text-sm">Container Security & Vulnerability Management Platform</p>
        </div>

        <div className="rounded-2xl border border-[#1C2150] bg-[#0D1022]/60 backdrop-blur-xl p-6 shadow-xl shadow-black/20">
          <div className="flex gap-1 rounded-lg bg-[#080A14] p-1 mb-6 border border-[#1C2150]">
            {(['login', 'register', 'forgot'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#00D4AA]/20 to-[#00D4AA]/5 text-[#00D4AA] shadow-sm'
                    : 'text-[#5A6380] hover:text-[#9098B8]'
                }`}
              >
                {m === 'forgot' ? 'Reset' : m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Name</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-10 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6380] hover:text-[#9098B8] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-[#FF4757]/10 border border-[#FF4757]/20 px-3 py-2 text-sm text-[#FF4757]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-lg bg-gradient-to-r from-[#00D4AA] to-[#059669] text-[#080A14] text-sm font-semibold hover:from-[#05C091] hover:to-[#059669] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00D4AA]/20"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#080A14]/30 border-t-[#080A14]" />
              ) : mode === 'login' ? (
                'Sign in'
              ) : mode === 'register' ? (
                'Create account'
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="text-xs text-[#5A6380] text-center mt-4 border-t border-[#1C2150] pt-4">
            New here? Use the Register tab to create an account
          </p>
        </div>
      </div>
    </div>
  )
}
