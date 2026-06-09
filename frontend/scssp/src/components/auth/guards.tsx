'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00D4AA]/30 border-t-[#00D4AA]" />
      </div>
    )
  }

  return <>{children}</>
}

export function RoleGuard({ role, children }: { role: 'admin' | 'developer' | 'viewer'; children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (!user) return null

  if (role === 'admin' && user.role !== 'admin') return null
  if (role === 'developer' && user.role !== 'developer' && user.role !== 'admin') return null

  return <>{children}</>
}

export function PermissionGate({ permissions, children, fallback }: { permissions: string[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { user } = useAuthStore()

  if (!user) return null

  const hasAll = permissions.every(p => user.permissions.includes(p))
  if (!hasAll) return fallback || null

  return <>{children}</>
}
