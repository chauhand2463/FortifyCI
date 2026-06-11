'use client'

import { useState } from 'react'
import { useNotifications, useMarkNotificationRead } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, Spinner, ErrorState } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Bell, CheckCheck, AlertTriangle, ShieldAlert, Info, ScanSearch } from 'lucide-react'
import { toast } from 'sonner'

const notifTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
]

const typeConfig: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  critical_cve: { icon: AlertTriangle, color: 'text-red-400' },
  scan_complete: { icon: ScanSearch, color: 'text-emerald-400' },
  policy_breach: { icon: ShieldAlert, color: 'text-amber-400' },
  system: { icon: Info, color: 'text-blue-400' },
}

const severityVariant = (severity: string) => {
  switch (severity) {
    case 'critical': return 'danger' as const
    case 'high': return 'warning' as const
    case 'medium': return 'info' as const
    case 'low': return 'default' as const
    default: return 'default' as const
  }
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('all')
  const { data: notifications, isLoading, error, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()

  const handleMarkRead = (id: string) => {
    markRead.mutate(id, {
      onSuccess: () => toast.success('Marked as read'),
    })
  }

  const filtered = tab === 'unread'
    ? (notifications ?? []).filter(n => !n.isRead)
    : (notifications ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-[#5A6380] mt-1">Stay informed about security events</p>
        </div>
        <Tabs tabs={notifTabs} activeTab={tab} onTabChange={setTab} />
      </div>

      <Card>
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load notifications" onRetry={() => refetch()} /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-[#3A4058] mb-4" />
            <h3 className="text-lg font-semibold text-[#5A6380]">No notifications</h3>
            <p className="text-sm text-[#3A4058] mt-1">You are all caught up!</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-[#1C2150]/50">
            {filtered.map(n => {
              const config = typeConfig[n.type] || typeConfig.system
              const Icon = config.icon
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[#131736]/50',
                    !n.isRead && 'bg-[#00D4AA]/[0.02]'
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-[#131736]/50 shrink-0', !n.isRead && 'bg-[#131736]')}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn('text-sm', n.isRead ? 'text-[#9098B8]' : 'text-white font-semibold')}>
                        {n.title || n.subject}
                      </h4>
                        <Badge variant={severityVariant(n.severity || 'low')} className="text-[10px] px-1.5 py-0">
                          {n.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#5A6380] mt-0.5">{n.message || n.body}</p>
                    <span className="text-xs text-[#3A4058] mt-1 block">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Read
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
