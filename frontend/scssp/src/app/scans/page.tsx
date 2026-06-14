'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useScans, useActiveScans } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Spinner, ErrorState, Pagination } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { ScanSearch, RefreshCw, GitCompare, AlertTriangle, Activity, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function ScansPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useScans(page, 10)
  const { data: activeData } = useActiveScans()
  const activeScans = activeData?.items ?? []
  const runningCount = activeScans.filter(s => s.status === 'running').length
  const queuedCount = activeScans.filter(s => s.status === 'queued').length
  const hasActiveScans = runningCount + queuedCount > 0
  const completedToday = activeScans.filter(s => {
    if (s.status !== 'completed') return false
    const today = new Date()
    const scanDate = s.completedAt ? new Date(s.completedAt) : s.startedAt ? new Date(s.startedAt) : null
    return scanDate && scanDate.toDateString() === today.toDateString()
  }).length

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success' as const
      case 'running': return 'info' as const
      case 'queued': return 'warning' as const
      case 'failed': return 'danger' as const
      default: return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scans</h1>
          <p className="text-sm text-[#5A6380] mt-1">View and manage container image scans</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetch(); toast.success('Refreshed scan data') }}
          className="gap-2 transition-all duration-200"
        >
          <RefreshCw className={cn('h-4 w-4', hasActiveScans && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(
          'rounded-xl border p-4 transition-all duration-300',
          hasActiveScans
            ? 'bg-[#4DA6FF]/5 border-[#4DA6FF]/20'
            : 'bg-[#0D1022]/60 border-[#1C2150]'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              hasActiveScans ? 'bg-[#4DA6FF]/10' : 'bg-[#1C2150]/50'
            )}>
              <Activity className={cn('h-4 w-4', hasActiveScans ? 'text-[#4DA6FF]' : 'text-[#5A6380]')} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  hasActiveScans ? 'text-[#4DA6FF]' : 'text-[#5A6380]'
                )}>
                  {runningCount + queuedCount}
                </span>
                {hasActiveScans && <span className="h-2 w-2 rounded-full bg-[#4DA6FF] animate-pulse" />}
              </div>
              <p className="text-xs text-[#5A6380]">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#1C2150] bg-[#0D1022]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFA502]/10">
              <Clock className="h-4 w-4 text-[#FFA502]" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#FFA502] tabular-nums">{queuedCount}</span>
              <p className="text-xs text-[#5A6380]">Queued</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#1C2150] bg-[#0D1022]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D4AA]/10">
              <CheckCircle className="h-4 w-4 text-[#00D4AA]" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#00D4AA] tabular-nums">{completedToday}</span>
              <p className="text-xs text-[#5A6380]">Completed today</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load scans" onRetry={() => refetch()} /></CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Scanner</TableHead>
                  <TableHead>Regression</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#5A6380]">No scans found</TableCell>
                  </TableRow>
                ) : (
                  (data?.items ?? []).map(scan => (
                    <TableRow key={scan.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4AA]/10 group-hover:bg-[#00D4AA]/20 transition-colors">
                            <ScanSearch className="h-4 w-4 text-[#00D4AA]" />
                          </div>
                          <span className="font-medium text-white group-hover:text-[#00D4AA] transition-colors">{scan.imageName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusDot status={scan.status} />
                          <Badge variant={statusVariant(scan.status)}>{scan.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#131736] overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                scan.status === 'failed' ? 'bg-[#FF4757]' :
                                scan.status === 'completed' ? 'bg-[#00D4AA]' : 'bg-[#4DA6FF]'
                              )}
                              style={{ width: `${scan.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#5A6380] tabular-nums">{scan.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          {scan.criticalCount > 0 && <span className="text-[#FF4757] font-medium">{scan.criticalCount}C</span>}
                          {scan.highCount > 0 && <span className="text-[#FFA502] font-medium">{scan.highCount}H</span>}
                          {scan.mediumCount > 0 && <span className="text-[#4DA6FF]">{scan.mediumCount}M</span>}
                          {scan.lowCount > 0 && <span className="text-[#5A6380]">{scan.lowCount}L</span>}
                          {scan.vulnerabilitiesCount === 0 && scan.status === 'completed' && (
                            <span className="text-[#00D4AA]">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{scan.scanType}</TableCell>
                      <TableCell>
                        {(scan as any).regressionDetected ? (
                          <Badge variant="danger" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Regression
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#3A4058]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{formatDate(scan.startedAt)}</TableCell>
                      <TableCell className="text-[#5A6380] text-xs tabular-nums">{scan.completedAt ? formatDate(scan.completedAt) : '-'}</TableCell>
                      <TableCell>
                        {scan.status === 'completed' && (
                          <Link
                            href={`/scans/${scan.id}/diff`}
                            className="inline-flex items-center gap-1 text-xs text-[#4DA6FF] hover:text-[#6BB8FF] transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <GitCompare className="h-3 w-3" />
                            Diff
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}
