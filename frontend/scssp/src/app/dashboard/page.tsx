'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useStatistics, useChartData, useScans, useImages, usePostureTrend, useAssignments, useExceptions } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { ErrorState } from '@/components/ui/shared'
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'
import { SeverityDonutChart, ScanTrendChart, PostureChart } from '@/components/dashboard/dashboard-charts'
import { formatRelativeTime, cn, severityBgClass } from '@/lib/utils'
import { useAuthStore } from '@/store'
import type { ScanTrend, MonthlySecurity, VulnerabilitySeverity, PostureTrend } from '@/types'
import {
  Container, Bug, Shield, AlertTriangle, CheckCircle,
  ArrowUp, ArrowDown, ScanSearch, Activity,
} from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function computeDelta(trend: ScanTrend[], key: 'scans' | 'vulnerabilities'): number | null {
  if (!trend || trend.length < 2) return null
  return trend[trend.length - 1][key] - trend[0][key]
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStatistics()
  const { data: chartData, isLoading: chartLoading } = useChartData()
  const { data: scansData, isLoading: scansLoading } = useScans(1, 5)
  const { data: imagesData, isLoading: imagesLoading } = useImages(1, 100)
  const { data: postureTrend } = usePostureTrend()
  const { data: breachedAssignments } = useAssignments({ breached: true })
  const { data: pendingExceptions } = useExceptions({ isActive: true })

  const trendData: ScanTrend[] = useMemo(() => (chartData?.scanTrend ?? []) as ScanTrend[], [chartData])
  const severityData: VulnerabilitySeverity[] = useMemo(() => (chartData?.vulnerabilitySeverity ?? []) as VulnerabilitySeverity[], [chartData])
  const monthlyData: MonthlySecurity[] = useMemo(() => (chartData?.monthlySecurity ?? []) as MonthlySecurity[], [chartData])
  const postureData: PostureTrend[] = useMemo(() => (postureTrend ?? []) as PostureTrend[], [postureTrend])

  const vulnDelta = useMemo(() => computeDelta(trendData, 'vulnerabilities'), [trendData])
  const scanDelta = useMemo(() => computeDelta(trendData, 'scans'), [trendData])

  const totalVulns = stats?.totalVulnerabilities ?? 0
  const criticalCount = stats?.criticalVulnerabilities ?? 0
  const highCount = stats?.highVulnerabilities ?? 0
  const imagesAtRisk = stats?.imagesAtRisk ?? 0
  const fixesAvailable = stats?.fixesAvailable ?? 0
  const totalImages = stats?.totalImages ?? 0
  const scannedImages = stats?.scannedImages ?? 0

  const breachedCount = breachedAssignments?.items?.length ?? 0
  const exceptionCount = pendingExceptions?.items?.length ?? 0

  const isLoading = statsLoading || chartLoading

  if (statsError) return <ErrorState message="Failed to load dashboard data" onRetry={() => refetchStats()} />

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-40" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard className="h-72" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    )
  }

  if (totalImages === 0 && totalVulns === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4AA]/20 to-[#059669]/10 border border-[#00D4AA]/20">
          <Shield className="h-8 w-8 text-[#00D4AA]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to FortifyCI</h1>
        <p className="mt-3 text-[#5A6380] max-w-md">
          Your container security dashboard is ready. Register an image and run your first scan to see security insights.
        </p>
        <Link
          href="/images"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00D4AA] to-[#059669] px-5 py-2.5 text-sm font-medium text-[#080A14] hover:from-[#05C091] hover:to-[#059669] transition-all duration-200 shadow-lg shadow-[#00D4AA]/15"
        >
          <ScanSearch className="h-4 w-4" />
          Go to Images
        </Link>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Vulnerabilities',
      value: totalVulns,
      delta: vulnDelta,
      icon: Bug,
      color: 'text-[#FF4757]',
      bg: 'bg-[#FF4757]/10',
    },
    {
      label: 'Images Scanned',
      value: scannedImages,
      delta: scanDelta,
      icon: ScanSearch,
      color: 'text-[#00D4AA]',
      bg: 'bg-[#00D4AA]/10',
    },
    {
      label: 'Critical',
      value: criticalCount,
      icon: AlertTriangle,
      color: 'text-[#FF4757]',
      bg: 'bg-[#FF4757]/10',
    },
    {
      label: 'High',
      value: highCount,
      icon: AlertTriangle,
      color: 'text-[#FFA502]',
      bg: 'bg-[#FFA502]/10',
    },
    {
      label: 'Images at Risk',
      value: imagesAtRisk,
      icon: Container,
      color: 'text-[#FF4757]',
      bg: 'bg-[#FF4757]/10',
    },
    {
      label: 'Fixes Available',
      value: fixesAvailable,
      icon: CheckCircle,
      color: 'text-[#00D4AA]',
      bg: 'bg-[#00D4AA]/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. KPI Hero — single large metric */}
      <motion.div
        variants={fadeUp} initial="initial" animate="animate"
        className="relative overflow-hidden rounded-2xl border border-[#1C2150] bg-gradient-to-br from-[#0D1022] via-[#0D1022]/80 to-[#00D4AA]/5 p-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF4757]/10">
                <Bug className="h-4 w-4 text-[#FF4757]" />
              </div>
              <span className="text-xs font-medium text-[#5A6380] tracking-wider uppercase">Security Overview</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-white tabular-nums tracking-tight">{totalVulns.toLocaleString()}</span>
              <span className="text-lg text-[#5A6380] font-medium">Total Vulnerabilities</span>
            </div>
            {vulnDelta !== null && vulnDelta !== 0 && (
              <div className={cn(
                'flex items-center gap-1.5 mt-2 text-sm font-medium',
                vulnDelta < 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'
              )}>
                {vulnDelta < 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                <span>{Math.abs(vulnDelta)} from last week</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 self-start mt-1">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', severityBgClass(criticalCount > 0 ? 'critical' : 'none'))}>
              <span className={cn('h-1.5 w-1.5 rounded-full', criticalCount > 0 ? 'bg-red-400' : 'bg-green-400')} />
              {criticalCount} Critical
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Stat Grid — 3x2 (dense) */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="overflow-x-auto -mx-4 px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-w-[500px]">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="group hover:border-[#252A5A] transition-all duration-200 hover:shadow-lg hover:shadow-[#00D4AA]/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300', card.bg, 'group-hover:scale-110')}>
                        <Icon className={cn('h-5 w-5', card.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#5A6380] font-medium uppercase tracking-wider truncate">{card.label}</p>
                        <p className="text-xl font-bold text-white mt-0.5 tabular-nums">{card.value.toLocaleString()}</p>
                        {card.delta !== undefined && card.delta !== null ? (
                          <p className={cn(
                            'text-[11px] font-medium mt-0.5',
                            card.delta < 0 ? 'text-[#00D4AA]' : card.delta > 0 ? 'text-[#FF4757]' : 'text-[#3A4058]'
                          )}>
                            {card.delta > 0 ? '+' : ''}{card.delta} this week
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 3. Posture Chart — full width (breathing room) */}
      {postureData.length > 0 && (
        <motion.div variants={fadeUp} initial="initial" animate="animate">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-[#00D4AA]" />
                <CardTitle>Security Posture Trend</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-4">
                <PostureChart data={postureData.map(d => ({ date: d.date, score: d.score }))} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 4. Severity Donut + Scan Trend — side by side (dense) */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityDonutChart data={severityData.map(d => ({ name: d.name, value: d.value, color: d.color }))} />
            <div className="space-y-2 mt-4 px-2">
              {severityData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[#5A6380]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white tabular-nums">{d.value.toLocaleString()}</span>
                    <span className="text-xs text-[#3A4058]">
                      ({severityData.reduce((s, x) => s + x.value, 0) > 0
                        ? Math.round((d.value / severityData.reduce((s, x) => s + x.value, 0)) * 100)
                        : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScanTrendChart data={trendData} />
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#5A6380]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#FFA502]" />
                <span>Vulnerabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#00D4AA]" />
                <span>Scans</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. SLA / Exceptions — compact full width (breathing room) */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SLA Breaches</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                breachedCount > 0 ? 'bg-[#FF4757]/10' : 'bg-[#00D4AA]/10'
              )}>
                {breachedCount > 0
                  ? <AlertTriangle className="h-5 w-5 text-[#FF4757]" />
                  : <CheckCircle className="h-5 w-5 text-[#00D4AA]" />
                }
              </div>
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{breachedCount}</p>
                <p className="text-xs text-[#5A6380]">{breachedCount === 1 ? 'breach' : 'breaches'}</p>
              </div>
            </div>
            {breachedCount > 0 && (
              <Link href="/assignments" className="text-sm text-[#FFA502] hover:underline">View →</Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Exceptions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4DA6FF]/10">
                <Shield className="h-5 w-5 text-[#4DA6FF]" />
              </div>
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{exceptionCount}</p>
                <p className="text-xs text-[#5A6380]">pending</p>
              </div>
            </div>
            {exceptionCount > 0 && (
              <Link href="/exceptions" className="text-sm text-[#4DA6FF] hover:underline">View →</Link>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 6. Recent Scans + Images at Risk — side by side (dense) */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          {scansLoading ? (
            <CardContent><SkeletonTable rows={4} cols={2} /></CardContent>
          ) : (scansData?.items ?? []).length === 0 ? (
            <CardContent className="text-center py-8 text-sm text-[#5A6380]">No scans yet</CardContent>
          ) : (
            <div className="divide-y divide-[#1C2150]/50">
              {(scansData?.items ?? []).slice(0, 5).map(scan => (
                <div key={scan.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#131736]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <StatusDot status={scan.status} />
                    <div>
                      <p className="text-sm font-medium text-[#EEF0F7]">{scan.imageName}</p>
                      <p className="text-xs text-[#5A6380]">{formatRelativeTime(scan.startedAt)}</p>
                    </div>
                  </div>
                  <Badge variant={scan.status === 'completed' ? 'success' : scan.status === 'failed' ? 'danger' : 'warning'}>
                    {scan.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images at Risk</CardTitle>
          </CardHeader>
          {imagesLoading ? (
            <CardContent><SkeletonTable rows={4} cols={2} /></CardContent>
          ) : (
            <div className="divide-y divide-[#1C2150]/50">
              {(imagesData?.items ?? [])
                .filter(img => img.lastScanStatus === 'vulnerable')
                .slice(0, 5)
                .map(img => (
                  <div key={img.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#131736]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusDot status="vulnerable" />
                      <div>
                        <p className="text-sm font-medium text-[#EEF0F7]">{img.name}:{img.tag}</p>
                        <p className="text-xs text-[#5A6380]">{img.vulnerabilitySummary.critical + img.vulnerabilitySummary.high} critical/high</p>
                      </div>
                    </div>
                    <Badge variant="danger">{img.vulnerabilitySummary.critical}C / {img.vulnerabilitySummary.high}H</Badge>
                  </div>
                ))}
              {(imagesData?.items ?? []).filter(img => img.lastScanStatus === 'vulnerable').length === 0 && (
                <div className="px-6 py-8 text-center text-[#5A6380] text-sm">No vulnerable images</div>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
