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
  Activity,
  GitCompare,
  UserCheck,
  ShieldOff,
  ScrollText,
  Webhook,
  Radio,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: readonly ('admin' | 'developer' | 'viewer')[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'developer', 'viewer'] },
      { href: '/posture', label: 'Posture', icon: GitCompare, roles: ['admin', 'developer', 'viewer'] },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/images', label: 'Images', icon: Container, roles: ['admin', 'developer', 'viewer'] },
      { href: '/sbom', label: 'SBOM Explorer', icon: Package, roles: ['admin', 'developer', 'viewer'] },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/scans', label: 'Scans', icon: ScanSearch, roles: ['admin', 'developer', 'viewer'] },
      { href: '/vulnerabilities', label: 'Vulnerabilities', icon: Bug, roles: ['admin', 'developer', 'viewer'] },
      { href: '/blast-radius', label: 'Blast Radius', icon: Activity, roles: ['admin', 'developer'] },
      { href: '/exceptions', label: 'Exceptions', icon: ShieldOff, roles: ['admin'] },
      { href: '/policies', label: 'Policies', icon: ScrollText, roles: ['admin'] },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'developer', 'viewer'] },
      { href: '/assignments', label: 'Assignments', icon: UserCheck, roles: ['admin', 'developer'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'developer', 'viewer'] },
      { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'developer', 'viewer'] },
      { href: '/webhooks', label: 'Webhooks', icon: Webhook, roles: ['admin'] },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/live-scan', label: 'Live Scan', icon: Radio, roles: ['admin', 'developer'] },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore()
  const { user } = useAuthStore()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const isGroupExpanded = (label: string) => !collapsedGroups.has(label)

  const filterItems = (items: NavItem[]) =>
    items.filter(item => !user || item.roles.includes(user.role as 'admin' | 'developer' | 'viewer'))

  // Collapsed state: flat icons only
  if (isCollapsed) {
    const flatItems = navGroups.flatMap(g => filterItems(g.items))
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
        <aside className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#1C2150] bg-[#080A14] transition-all duration-300 w-16',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className="flex h-14 items-center justify-center border-b border-[#1C2150]">
            <Link href="/dashboard" className="group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-lg shadow-[#00D4AA]/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
            {flatItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20'
                      : 'text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] border border-transparent',
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              )
            })}
          </nav>
          <button
            onClick={toggle}
            className="hidden lg:flex items-center justify-center h-10 border-t border-[#1C2150] text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#1C2150] bg-[#080A14] transition-all duration-300 w-60',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center border-b border-[#1C2150] px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#059669] shadow-lg shadow-[#00D4AA]/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">FortifyCI</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-3">
          {navGroups.map(group => {
            const filtered = filterItems(group.items)
            if (filtered.length === 0) return null
            const expanded = isGroupExpanded(group.label)

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#5A6380] hover:text-[#9098B8] transition-colors"
                >
                  {group.label}
                  <ChevronDown className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    expanded && 'rotate-180'
                  )} />
                </button>
                {expanded && (
                  <div className="mt-1 space-y-0.5">
                    {filtered.map(item => {
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
                              : 'text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] border border-transparent'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#00D4AA]' : 'text-[#5A6380]')} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center h-10 border-t border-[#1C2150] text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
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
