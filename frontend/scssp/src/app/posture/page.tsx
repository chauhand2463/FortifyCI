'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { usePostureTrend, useLeaderboard } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

export default function PosturePage() {
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D')

  const dateFrom = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - (range === '7D' ? 7 : range === '90D' ? 90 : 30))
    return d.toISOString()
  }, [range])

  const { data: trend, isLoading: trendLoading, error: trendError, refetch: refetchTrend } = usePostureTrend(dateFrom)
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard()

  const currentScore = useMemo(() => {
    if (!trend || trend.length === 0) return 0
    return trend[trend.length - 1].score
  }, [trend])

  const scoreColor = currentScore >= 80 ? '#00D4AA' : currentScore >= 50 ? '#FFA502' : '#FF4757'
  const scoreLabel = currentScore >= 80 ? 'Good' : currentScore >= 50 ? 'Fair' : 'Poor'

  const gaugeRadius = 75
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeOffset = gaugeCircumference * (1 - currentScore / 100)

  const maxVulns = useMemo(() => {
    if (!trend || trend.length === 0) return 1
    return Math.max(...trend.map(d => d.critical + d.high + d.medium + d.low), 1)
  }, [trend])

  const isLoading = trendLoading || leaderboardLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (trendError) {
    return <ErrorState message="Failed to load posture data" onRetry={() => refetchTrend()} />
  }

  const ranges = ['7D', '30D', '90D'] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#1C2150] bg-gradient-to-br from-[#0D1022] via-[#0D1022]/80 to-[#00D4AA]/5 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4AA]">
              <Shield className="h-4 w-4 text-[#080A14]" />
            </div>
            <span className="text-sm font-medium text-[#00D4AA]">Security Posture</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">Security Posture Dashboard</h1>
          <p className="text-[#5A6380] mt-2 max-w-xl">
            Track your organization&apos;s security posture over time
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-[#080A14] p-1 border border-[#1C2150] w-fit">
        {ranges.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
              range === r
                ? 'bg-[#00D4AA]/10 text-[#00D4AA] shadow-sm border border-[#00D4AA]/20'
                : 'text-[#5A6380] hover:text-[#9098B8]'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Posture Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={gaugeRadius}
                    fill="none"
                    stroke="#1C2150"
                    strokeWidth="12"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={gaugeRadius}
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeOffset}
                    transform="rotate(-90 100 100)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white tabular-nums">{currentScore}</span>
                  <span className="text-sm font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-xs text-[#5A6380]">
                <span>0 Poor</span>
                <span>50 Fair</span>
                <span>100 Good</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score & Vulnerability Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {!trend || trend.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[#5A6380] text-sm">
                No trend data available for this period
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <div className="relative h-48 min-w-[400px] pt-4">
                  <svg
                    width={Math.max(trend.length * 60, 400)}
                    height={180}
                    className="overflow-visible"
                  >
                    {[0, 25, 50, 75, 100].map(v => (
                      <line
                        key={v}
                        x1="0"
                        y1={180 - (v / 100) * 160}
                        x2={Math.max(trend.length * 60, 400)}
                        y2={180 - (v / 100) * 160}
                        stroke="#1C2150"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}
                    {trend.map((d, i) => {
                      const x = i * 60 + 10
                      const barWidth = 40
                      const levels = [
                        { key: 'critical', color: '#FF4757', value: d.critical },
                        { key: 'high', color: '#FFA502', value: d.high },
                        { key: 'medium', color: '#4DA6FF', value: d.medium },
                        { key: 'low', color: '#5A6380', value: d.low },
                      ]
                      let cumulativeHeight = 0
                      return (
                        <g key={i}>
                          {levels.map(l => {
                            const h = (l.value / maxVulns) * 140
                            const y = 180 - cumulativeHeight - h
                            cumulativeHeight += h
                            return h > 0 ? (
                              <rect
                                key={l.key}
                                x={x}
                                y={y}
                                width={barWidth}
                                height={h}
                                fill={l.color}
                                opacity="0.7"
                                rx="1"
                              />
                            ) : null
                          })}
                        </g>
                      )
                    })}
                    <polyline
                      points={trend.map((d, i) => {
                        const x = i * 60 + 30
                        const y = 180 - (d.score / 100) * 160
                        return `${x},${y}`
                      }).join(' ')}
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {trend.map((d, i) => {
                      const x = i * 60 + 30
                      const y = 180 - (d.score / 100) * 160
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill={scoreColor}
                        />
                      )
                    })}
                    {trend.map((d, i) => (
                      <text
                        key={i}
                        x={i * 60 + 30}
                        y="176"
                        textAnchor="middle"
                        fill="#3A4058"
                        fontSize="10"
                      >
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#5A6380]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#FF4757]/60" />
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#FFA502]/60" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#4DA6FF]/60" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-[#5A6380]/40" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: scoreColor }} />
                <span>Score</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Image Leaderboard</CardTitle>
        </CardHeader>
        {!leaderboard || (!leaderboard.best?.length && !leaderboard.worst?.length && !leaderboard.mostImproved?.length) ? (
          <CardContent>
            <EmptyState
              title="No leaderboard data"
              description="No images have been scanned yet"
              icon={<AlertTriangle className="h-8 w-8" />}
            />
          </CardContent>
        ) : (
          <div className="space-y-6">
            {[
              { title: 'Best Performing', key: 'best', color: '#00D4AA' },
              { title: 'Worst Performing', key: 'worst', color: '#FF4757' },
              { title: 'Most Improved', key: 'mostImproved', color: '#4DA6FF' },
            ].map(section => {
              const items = (leaderboard as any)[section.key] || []
              if (!items.length) return null
              return (
                <div key={section.key}>
                  <h3 className="text-sm font-semibold text-[#5A6380] uppercase tracking-wider mb-2 px-6" style={{ color: section.color }}>{section.title}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead className="w-24">Score</TableHead>
                        <TableHead className="w-20">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((entry: any, i: number) => {
                        const s = entry.averageScore ?? entry.score ?? 0
                        const scoreBadgeVariant = s >= 80 ? 'success' : s >= 50 ? 'warning' : 'danger'
                        const trend = entry.trend === 'improving' ? 'up' : entry.trend === 'declining' ? 'down' : 'stable'
                        const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
                        const trendColor = trend === 'up' ? '#00D4AA' : trend === 'down' ? '#FF4757' : '#5A6380'
                        return (
                          <TableRow key={entry.imageId || entry.imageRef || i}>
                            <TableCell className="text-[#5A6380] font-medium tabular-nums">{i + 1}</TableCell>
                            <TableCell>
                              <Link
                                href={entry.imageId ? `/images/${entry.imageId}` : '#'}
                                className="font-medium text-white hover:text-[#00D4AA] transition-colors"
                              >
                                {entry.imageName || entry.imageRef || 'Unknown'}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={scoreBadgeVariant}>{s}</Badge>
                            </TableCell>
                            <TableCell>
                              <TrendIcon className="h-4 w-4" style={{ color: trendColor }} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
