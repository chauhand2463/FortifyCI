'use client'

import { useAuthStore, useSidebarStore } from '@/store'
import { Bell, Search, Menu, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-queries'
import { Badge } from '@/components/ui/badge'
import { useCommandPalette } from '@/store/command-palette'
import { useRouter } from 'next/navigation'

export function TopNav() {
  const { user, logout } = useAuthStore()
  const { setMobileOpen } = useSidebarStore()
  const { data: notifications } = useNotifications()
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { open: openCommandPalette } = useCommandPalette()
  const router = useRouter()
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openCommandPalette()
    }
  }, [openCommandPalette])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#1C2150] bg-[#080A14]/80 backdrop-blur-lg px-4 lg:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden -ml-1 flex h-8 w-8 items-center justify-center rounded-md text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={openCommandPalette}
          className={cn(
            'hidden sm:flex items-center gap-2 rounded-lg border border-[#1C2150] bg-[#0D1022]/50 px-3 py-1.5 text-sm text-[#5A6380] hover:text-[#9098B8] hover:border-[#252A5A] transition-all duration-200',
            searchFocused && 'border-[#00D4AA]/50 ring-1 ring-[#00D4AA]/20'
          )}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-6 rounded border border-[#1C2150] bg-[#080A14] px-1.5 py-0.5 text-[10px] font-medium text-[#5A6380]">Ctrl+K</kbd>
        </button>

        <button
          onClick={openCommandPalette}
          className="flex sm:hidden h-8 w-8 items-center justify-center rounded-md text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative">
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <Badge variant="danger" className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] px-1 text-[10px] leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 border-l border-[#1C2150] pl-3 transition-colors hover:opacity-80"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[#EEF0F7] leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-[#5A6380] capitalize">{user?.role || 'user'}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/10 text-[#00D4AA] text-xs font-semibold border border-[#00D4AA]/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#5A6380] hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#1C2150] bg-[#0D1022] shadow-xl shadow-black/20 py-1 z-50 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-[#1C2150]">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-[#5A6380]">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); router.push('/settings') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#9098B8] hover:bg-[#131736] hover:text-[#EEF0F7] transition-colors"
              >
                <User className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); router.push('/login') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FF4757] hover:bg-[#FF4757]/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
