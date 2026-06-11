'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useBlastRadius, useBulkRescan } from '@/hooks/use-queries'
import { services } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, Spinner, ErrorState, EmptyState } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, severityBgClass } from '@/lib/utils'
import { Search, Shield, AlertTriangle, Container, Activity, RotateCw, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const searchModes = [
  { id: 'cve', label: 'CVE Search' },
  { id: 'package', label: 'Package Search' },
]

const severityColors = [
  { key: 'critical' as const, color: '#FF4757', bg: 'bg-[#FF4757]' },
  { key: 'high' as const, color: '#FFA502', bg: 'bg-[#FFA502]' },
  { key: 'medium' as const, color: '#4DA6FF', bg: 'bg-[#4DA6FF]' },
  { key: 'low' as const, color: '#5A6380', bg: 'bg-[#5A6380]' },
]

export default function BlastRadiusPage() {
  const router = useRouter()
  const [mode, setMode] = useState('cve')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const { data, isLoading, error, refetch } = useBlastRadius(mode === 'cve' ? submittedQuery : '')

  const { data: packageData, isLoading: pkgLoading, error: pkgError, refetch: refetchPkg } = useQuery({
    queryKey: ['blastRadiusPackage', submittedQuery],
    queryFn: () => services.blastRadius.findByPackage(submittedQuery),
    enabled: mode === 'package' && !!submittedQuery,
  })

  const bulkRescan = useBulkRescan()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSubmittedQuery(query.trim())
  }

  const handleRescan = async () => {
    try {
      await bulkRescan.mutateAsync(submittedQuery)
      toast.success('Bulk rescan initiated for all affected images')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start bulk rescan')
    }
  }

  const activeData = mode === 'cve' ? data : packageData
  const activeLoading = mode === 'cve' ? isLoading : pkgLoading
  const activeError = mode === 'cve' ? error : pkgError

  const metricCards = useMemo(() => {
    if (!activeData) return []
    return [
      { label: 'Total Affected Images', value: activeData.totalAffected ?? 0, icon: Target, color: 'text-[#FF4757]', bg: 'bg-[#FF4757]/10' },
      { label: 'Fleet Percentage', value: `${activeData.fleetPercentage ?? 0}%`, icon: Activity, color: 'text-[#4DA6FF]', bg: 'bg-[#4DA6FF]/10', showProgress: true, progress: activeData.fleetPercentage ?? 0 },
      { label: 'Fleet Size', value: activeData.fleetSize ?? 0, icon: Container, color: 'text-[#00D4AA]', bg: 'bg-[#00D4AA]/10' },
    ]
  }, [activeData])

  const breakdown = activeData?.breakdown ?? { critical: 0, high: 0, medium: 0, low: 0 }
  const breakdownTotal = breakdown.critical + breakdown.high + breakdown.medium + breakdown.low
  const affectedImages: any[] = activeData?.affectedImages ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Blast Radius Analysis</h1>
        <p className="text-sm text-[#5A6380] mt-1">Assess CVE impact across your fleet</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs tabs={searchModes} activeTab={mode} onTabChange={t => { setMode(t); setSubmittedQuery(''); setQuery('') }} />
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
          <Input
            placeholder={mode === 'cve' ? 'Enter CVE ID (e.g. CVE-2024-XXXXX)' : 'Enter package name (e.g. libssl)'}
            className="pl-9 pr-20 transition-all duration-200 focus:border-[#00D4AA]/50"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 gap-1"
            disabled={!query.trim()}
          >
            <Search className="h-3.5 w-3.5" />
            Analyze
          </Button>
        </form>
      </div>

      {!submittedQuery ? (
        <EmptyState
          title={mode === 'cve' ? 'Enter a CVE ID' : 'Enter a package name'}
          description={mode === 'cve' ? 'Search for a CVE to see its blast radius across your fleet' : 'Search for a package to see which images are affected'}
          icon={<Shield className="h-12 w-12" />}
        />
      ) : activeLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : activeError ? (
        <ErrorState message={`Failed to analyze ${submittedQuery}`} onRetry={() => (mode === 'cve' ? refetch() : refetchPkg())} />
      ) : activeData ? (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {metricCards.map((card) => (
              <motion.div
                key={card.label}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#5A6380]">{card.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                      </div>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.bg)}>
                        <card.icon className={cn('h-5 w-5', card.color)} />
                      </div>
                    </div>
                    {'showProgress' in card && card.showProgress && (
                      <div className="mt-3">
                        <div className="w-full h-2 rounded-full bg-[#1C2150] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#4DA6FF] to-[#00D4AA] transition-all duration-500"
                            style={{ width: `${card.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#FFA502]" />
                  Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex h-3 rounded-full bg-[#1C2150] overflow-hidden">
                    {severityColors.map(sev => {
                      const count = breakdown[sev.key] ?? 0
                      const pct = breakdownTotal > 0 ? (count / breakdownTotal) * 100 : 0
                      return pct > 0 ? (
                        <div
                          key={sev.key}
                          className={cn(sev.bg, 'transition-all duration-500')}
                          style={{ width: `${pct}%` }}
                          title={`${sev.key}: ${count}`}
                        />
                      ) : null
                    })}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {severityColors.map(sev => {
                      const count = breakdown[sev.key] ?? 0
                      return (
                        <div key={sev.key} className="flex items-center gap-2">
                          <span className={cn('h-3 w-3 rounded-full', sev.bg)} />
                          <span className="text-sm text-[#5A6380] capitalize">{sev.key}</span>
                          <span className="text-sm font-semibold text-white ml-auto">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#00D4AA]" />
                  Remediation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="text-4xl font-bold text-[#00D4AA]">{activeData.fixableImages ?? 0}</div>
                <p className="text-sm text-[#5A6380] mt-1">Fixable Images</p>
                {mode === 'cve' && (
                  <Button
                    className="mt-4 gap-2 w-full"
                    size="sm"
                    onClick={handleRescan}
                    disabled={bulkRescan.isPending || (activeData.fixableImages ?? 0) === 0}
                  >
                    <RotateCw className={cn('h-4 w-4', bulkRescan.isPending && 'animate-spin')} />
                    {bulkRescan.isPending ? 'Rescanning...' : 'Rescan All Affected'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Affected Images</CardTitle>
              <CardDescription>{activeData.totalAffected ?? 0} images affected by {submittedQuery}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>Fix Version</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affectedImages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-[#5A6380]">No affected images found</TableCell>
                    </TableRow>
                  ) : (
                    affectedImages.map((img: any, idx: number) => {
                      const imageId = img.id || img.imageId
                      const imageName = img.name || img.imageName || 'Unknown'
                      const severity = img.severity || img.highestSeverity || 'unknown'
                      const vulnCount = img.vulnerabilityCount ?? img.vulnerabilities ?? img.vulnerabilityCount ?? 0
                      return (
                        <TableRow key={imageId || idx} className="group">
                          <TableCell>
                            <button
                              onClick={() => router.push(`/images/${imageId}`)}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4757]/10 group-hover:bg-[#FF4757]/20 transition-colors">
                                <Container className="h-4 w-4 text-[#FF4757]" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-white group-hover:text-[#FF4757] transition-colors">
                                  {imageName}
                                </span>
                                {img.tag && (
                                  <span className="text-xs text-[#5A6380] ml-1">:{img.tag}</span>
                                )}
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', severityBgClass(severity))}>
                              {severity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[#EEF0F7] font-medium">{vulnCount}</span>
                          </TableCell>
                          <TableCell>
                            {img.fixVersion ? (
                              <code className="text-xs text-[#00D4AA]">{img.fixVersion}</code>
                            ) : (
                              <span className="text-xs text-[#3A4058]">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/images/${imageId}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
