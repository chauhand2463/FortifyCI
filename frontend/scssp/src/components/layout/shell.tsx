'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { TopNav } from './topnav'
import { CommandPalette } from '@/components/layout/command-palette'
import { PageTransition } from '@/components/shared/page-transition'
import { Toaster } from 'sonner'
import { AuthGuard } from '@/components/auth/guards'

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicPage = pathname === '/login' || pathname === '/'

  if (isPublicPage) {
    return (
      <>
        <PageTransition key={pathname}>{children}</PageTransition>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#0D1022', border: '1px solid #1C2150', color: '#EEF0F7' } }} />
      </>
    )
  }

  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-[#080A14] text-[#EEF0F7]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-[#00D4AA]/[0.03] blur-[100px]" />
        </div>
        <Sidebar />
        <div className="lg:pl-60 relative">
          <TopNav />
          <main className="p-4 lg:p-6">
            <PageTransition key={pathname}>{children}</PageTransition>
          </main>
        </div>
        <CommandPalette />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0D1022',
              border: '1px solid #1C2150',
              color: '#EEF0F7',
            },
          }}
        />
      </div>
    </AuthGuard>
  )
}
