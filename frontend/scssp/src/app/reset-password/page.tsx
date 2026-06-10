'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { services } from '@/services/api'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }

    setError('')
    setLoading(true)

    try {
      await services.resetPassword(token, password)
      setSuccess(true)
      toast.success('Password reset successfully')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#080A14] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-[#1C2150] bg-[#0D1022] p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-[#FF4757] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-[#5A6380] mb-6">This password reset link is invalid or has expired.</p>
          <Link href="/login" className="text-[#00D4AA] hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080A14] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-[#1C2150] bg-[#0D1022] p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 rounded-full bg-[#00D4AA]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-[#00D4AA]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Password Reset</h2>
          <p className="text-[#5A6380] mb-6">Your password has been reset successfully. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080A14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#00D4AA]/5 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-[#4DA6FF]/5 blur-[100px]" />

      <Link href="/login" className="absolute top-6 left-6 flex items-center gap-2 text-[#5A6380] hover:text-[#EEF0F7] transition-colors text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-xl shadow-[#00D4AA]/20 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-[#5A6380] mt-1 text-sm">Enter your new password</p>
        </div>

        <div className="rounded-2xl border border-[#1C2150] bg-[#0D1022]/60 backdrop-blur-xl p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#9098B8] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-10 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                  placeholder="New password"
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

            <div>
              <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#1C2150] bg-[#080A14] pl-9 pr-3 text-sm text-[#EEF0F7] placeholder:text-[#5A6380] focus:outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

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
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
