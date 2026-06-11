import { create } from 'zustand'
import type { User } from '@/types'
import { services } from '@/services/api'

let _token: string | null = null
let _refreshPromise: Promise<string | null> | null = null

export function getAccessToken(): string | null {
  return _token
}

export function setAccessToken(token: string | null): void {
  _token = token
}

export function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!res.ok) return null
      const body = await res.json()
      if (body.success && body.data?.accessToken) {
        _token = body.data.accessToken
        return _token
      }
      return null
    } catch {
      return null
    } finally {
      _refreshPromise = null
    }
  })()
  return _refreshPromise
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  initialized: boolean
  initialize: () => Promise<void>
  login: (user: User, token: string) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  initialized: false,

  initialize: async () => {
    const token = await refreshAccessToken()
    if (token) {
      try {
        const res = await fetch('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const body = await res.json()
          set({
            user: body.data,
            isAuthenticated: true,
            initialized: true,
          })
          return
        }
      } catch {}
    }
    _token = null
    set({ user: null, isAuthenticated: false, initialized: true })
  },

  login: (user, token) => {
    _token = token
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${_token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    } catch {}
    _token = null
    set({ user: null, isAuthenticated: false })
  },
}))

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}))
