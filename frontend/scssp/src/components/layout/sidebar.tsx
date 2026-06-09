'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore, useAuthStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  LayoutDashboard,
  Container,
  ScanSearch,
  Bug,
  Package,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: readonly ('admin' | 'developer' | 'viewer')[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'developer', 'viewer'] },
  { href: '/images', label: 'Images', icon: Container, roles: ['admin', 'developer', 'viewer'] },
  { href: '/scans', label: 'Scans', icon: ScanSearch, roles: ['admin', 'developer', 'viewer'] },
  { href: '/vulnerabilities', label: 'Vulnerabilities', icon: Bug, roles: ['admin', 'developer', 'viewer'] },
  { href: '/sbom', label: 'SBOM Explorer', icon: Package, roles: ['admin', 'developer', 'viewer'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'developer', 'viewer'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'developer', 'viewer'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'developer', 'viewer'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore()
  const { user } = useAuthStore()

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#1C2150] bg-[#080A14] transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-60',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-[#1C2150] px-4', isCollapsed && 'justify-center')}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-lg shadow-[#00D4AA]/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-bold text-white tracking-tight">FortifyCI</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.filter(item => !user || item.roles.includes(user.role)).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20'
                    : 'text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] hover:border-[#1C2150] border border-transparent',
                  isCollapsed && 'justify-center px-2'
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center h-10 border-t border-[#1C2150] text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => setMobileOpen(false)}
          className="flex lg:hidden items-center justify-center h-10 border-t border-[#1C2150] text-[#5A6380] hover:text-[#EEF0F7]"
        >
          <X className="h-4 w-4" />
        </button>
      </aside>
    </>
  )
}
