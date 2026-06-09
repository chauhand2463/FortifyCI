'use client'

import { useStatistics, useChartData, useScans, useImages } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Spinner, ErrorState } from '@/components/ui/shared'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import {
  Container, Bug, Shield, AlertTriangle, CheckCircle,
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useStatistics()
  const { data: chartData, isLoading: chartLoading } = useChartData()
  const { data: scansData, isLoading: scansLoading } = useScans(1, 5)
  const { data: imagesData, isLoading: imagesLoading } = useImages(1, 100)

  if (statsLoading || chartLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (statsError) return <ErrorState message="Failed to load dashboard data" onRetry={() => refetchStats()} />

  const statCards = [
    { label: 'Total Images', value: stats?.totalImages ?? 0, icon: Container, color: 'text-[#4DA6FF]', bg: 'bg-[#4DA6FF]/10', change: '+2 this week' },
    { label: 'Total Vulnerabilities', value: stats?.totalVulnerabilities ?? 0, icon: Bug, color: 'text-[#FF4757]', bg: 'bg-[#FF4757]/10', change: '+12 new' },
    { label: 'Critical', value: stats?.criticalVulnerabilities ?? 0, icon: AlertTriangle, color: 'text-[#FF4757]', bg: 'bg-[#FF4757]/10', change: '+3 this week' },
    { label: 'High', value: stats?.highVulnerabilities ?? 0, icon: AlertTriangle, color: 'text-[#FFA502]', bg: 'bg-[#FFA502]/10', change: 'Stable' },
    { label: 'Fixes Available', value: stats?.fixesAvailable ?? 0, icon: CheckCircle, color: 'text-[#00D4AA]', bg: 'bg-[#00D4AA]/10', change: 'Action needed' },
    { label: 'Images at Risk', value: stats?.imagesAtRisk ?? 0, icon: Shield, color: 'text-[#FF4757]', bg: 'bg-[#FF4757]/10', change: 'Needs review' },
  ]

  const severityData = chartData?.vulnerabilitySeverity ?? []
  const trendData = chartData?.scanTrend ?? []
  const monthlyData = chartData?.monthlySecurity ?? []

  const maxTrend = Math.max(...trendData.map(d => d.vulnerabilities), 1)
  const maxMonthly = Math.max(...monthlyData.flatMap(d => [d.critical, d.high, d.medium, d.low]), 1)
  const severityTotal = severityData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-[#1C2150] bg-gradient-to-br from-[#0D1022] via-[#0D1022]/80 to-[#00D4AA]/5 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4AA]">
              <Shield className="h-4 w-4 text-[#080A14]" />
            </div>
            <span className="text-sm font-medium text-[#00D4AA]">Security Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-[#5A6380] mt-2 max-w-xl">
            Your container security posture overview. Monitor vulnerabilities, track scans, 
            and manage your container images across all environments.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: 'Total Scans', value: scansData?.total ?? 0, color: 'text-[#00D4AA]' },
              { label: 'Scan Rate', value: `${Math.round((stats?.scannedImages ?? 0) / Math.max(stats?.totalImages ?? 1, 1) * 100)}%`, color: 'text-[#00D4AA]' },
              { label: 'Critical CVEs', value: severityData.find(d => d.name === 'Critical')?.value ?? 0, color: 'text-[#FF4757]' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 rounded-lg border border-[#1C2150] bg-[#0D1022]/50 px-3 py-2">
                <span className="text-xs text-[#5A6380]">{item.label}</span>
                <span className={cn('text-sm font-semibold', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="group hover:border-[#252A5A] transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-colors', card.bg, 'group-hover:scale-105 duration-200')}>
                    <Icon className={cn('h-5 w-5', card.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#5A6380] font-medium uppercase tracking-wider truncate">{card.label}</p>
                    <p className="text-xl font-bold text-white mt-0.5 tabular-nums">{card.value.toLocaleString()}</p>
                    <p className="text-[10px] text-[#3A4058] mt-0.5">{card.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  const total = severityData.reduce((s, d) => s + d.value, 0)
                  let cumulative = 0
                  const radius = 80
                  const cx = 100
                  const cy = 100
                  return severityData.map((d) => {
                    const percentage = total > 0 ? d.value / total : 0
                    const angle = percentage * 360
                    const startAngle = (cumulative / total) * 360
                    cumulative += d.value
                    const startRad = ((startAngle - 90) * Math.PI) / 180
                    const endRad = ((startAngle + angle - 90) * Math.PI) / 180
                    const x1 = cx + radius * Math.cos(startRad)
                    const y1 = cy + radius * Math.sin(startRad)
                    const x2 = cx + radius * Math.cos(endRad)
                    const y2 = cy + radius * Math.sin(endRad)
                    const largeArc = angle > 180 ? 1 : 0
                    if (percentage === 0) return null
                    return (
                      <path
                        key={d.name}
                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={d.color}
                        opacity="0.8"
                        className="hover:opacity-100 transition-opacity"
                      />
                    )
                  })
                })()}
                <circle cx="100" cy="100" r="50" fill="#080A14" />
                <text x="100" y="96" textAnchor="middle" fill="#EEF0F7" fontSize="20" fontWeight="bold">
                  {stats?.totalVulnerabilities ?? 0}
                </text>
                <text x="100" y="112" textAnchor="middle" fill="#5A6380" fontSize="10">
                  Total
                </text>
              </svg>
            </div>
            <div className="space-y-2">
              {severityData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[#5A6380]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white tabular-nums">{d.value.toLocaleString()}</span>
                    <span className="text-xs text-[#3A4058]">
                      ({severityTotal > 0 ? Math.round((d.value / severityTotal) * 100) : 0}%)
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
            <div className="h-48 flex items-end justify-between gap-2 pt-4">
              {trendData.map((d, i) => {
                const height = (d.vulnerabilities / maxTrend) * 160
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[#5A6380] tabular-nums">{d.vulnerabilities}</span>
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t bg-[#00D4AA]/60 transition-all duration-300 hover:bg-[#00D4AA]/80 min-h-[4px]"
                        style={{ height: `${Math.max(height, 4)}px` }}
                      />
                      <div
                        className="w-full rounded-t bg-[#FFA502]/40 transition-all duration-300 hover:bg-[#FFA502]/60 min-h-[4px]"
                        style={{ height: `${Math.max((d.scans / Math.max(...trendData.map(x => x.scans), 1)) * 80, 4)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#3A4058] mt-1">{d.date}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#5A6380]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#00D4AA]/60" />
                <span>Vulnerabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#FFA502]/40" />
                <span>Scans</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Vulnerability Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-end justify-between gap-3 pt-4">
            {monthlyData.map((d) => {
              const cH = (d.critical / maxMonthly) * 160
              const hH = (d.high / maxMonthly) * 160
              const mH = (d.medium / maxMonthly) * 160
              const lH = (d.low / maxMonthly) * 160
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full space-y-[2px]">
                    <div className="w-full rounded-t bg-[#FF4757]/60 transition-all duration-300 hover:bg-[#FF4757]/80" style={{ height: `${Math.max(cH, 2)}px` }} />
                    <div className="w-full bg-[#FFA502]/60 transition-all duration-300 hover:bg-[#FFA502]/80" style={{ height: `${Math.max(hH, 2)}px` }} />
                    <div className="w-full bg-[#4DA6FF]/60 transition-all duration-300 hover:bg-[#4DA6FF]/80" style={{ height: `${Math.max(mH, 2)}px` }} />
                    <div className="w-full rounded-b bg-[#5A6380]/40 transition-all duration-300 hover:bg-[#5A6380]/60" style={{ height: `${Math.max(lH, 2)}px` }} />
                  </div>
                  <span className="text-[10px] text-[#3A4058] mt-1">{d.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#5A6380]">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#FF4757]/60" /><span>Critical</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#FFA502]/60" /><span>High</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#4DA6FF]/60" /><span>Medium</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#5A6380]/40" /><span>Low</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          {scansLoading ? (
            <CardContent><Spinner /></CardContent>
          ) : (
            <div className="divide-y divide-[#1C2150]/50">
              {(scansData?.data ?? []).slice(0, 5).map(scan => (
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
            <CardContent><Spinner /></CardContent>
          ) : (
            <div className="divide-y divide-[#1C2150]/50">
              {(imagesData?.data ?? [])
                .filter(img => img.status === 'vulnerable')
                .slice(0, 5)
                .map(img => (
                  <div key={img.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#131736]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusDot status="vulnerable" />
                      <div>
                        <p className="text-sm font-medium text-[#EEF0F7]">{img.name}:{img.tag}</p>
                        <p className="text-xs text-[#5A6380]">{img.vulnerabilities.critical + img.vulnerabilities.high} critical/high</p>
                      </div>
                    </div>
                    <Badge variant="danger">{img.vulnerabilities.critical}C / {img.vulnerabilities.high}H</Badge>
                  </div>
                ))}
              {(imagesData?.data ?? []).filter(img => img.status === 'vulnerable').length === 0 && (
                <div className="px-6 py-8 text-center text-[#5A6380] text-sm">No vulnerable images</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
