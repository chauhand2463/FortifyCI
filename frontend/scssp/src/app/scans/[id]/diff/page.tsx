'use client'

import { useParams } from 'next/navigation'
import { useScanDiff, useScan } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton, ErrorState } from '@/components/ui/shared'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, AlertTriangle, ShieldCheck } from 'lucide-react'

function severityVariant(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical': return 'danger' as const
    case 'high': return 'warning' as const
    case 'medium': return 'info' as const
    case 'low': return 'default' as const
    default: return 'default' as const
  }
}

const severityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-[#FF4757]'
    case 'high': return 'text-[#FFA502]'
    case 'medium': return 'text-[#4DA6FF]'
    case 'low': return 'text-[#5A6380]'
    default: return 'text-[#9098B8]'
  }
}

export default function ScanDiffPage() {
  const { id } = useParams() as { id: string }
  const { data: diff, isLoading, error, refetch } = useScanDiff(id)
  const { data: scan } = useScan(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-10 w-full" /></CardContent></Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (error || !diff) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Scan Diff</h1>
          <p className="text-sm text-[#5A6380] mt-1">Scan {id}</p>
        </div>
        <Card>
          <CardContent>
            <ErrorState message="Failed to load scan diff" onRetry={() => refetch()} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scan Diff</h1>
        <p className="text-sm text-[#5A6380] mt-1">
          Scan <span className="font-mono text-[#9098B8]">{id}</span>
          {scan?.imageName && <span className="text-[#5A6380]"> &mdash; {scan.imageName}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5A6380]">Vulnerabilities Added</p>
                  <p className="text-3xl font-bold text-white mt-1">{diff.vulnerabilitiesAdded}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF4757]/10">
                  <ArrowUp className="h-6 w-6 text-[#FF4757]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5A6380]">Vulnerabilities Removed</p>
                  <p className="text-3xl font-bold text-white mt-1">{diff.vulnerabilitiesRemoved}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D4AA]/10">
                  <ArrowDown className="h-6 w-6 text-[#00D4AA]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5A6380] mb-2">Regression</p>
                  {diff.regressionDetected ? (
                    <Badge variant="danger" className="gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Detected
                    </Badge>
                  ) : (
                    <Badge variant="success" className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      None
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Severity Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(diff.severityShift).map(([level, delta]) => (
                <Badge
                  key={level}
                  variant={severityVariant(level)}
                  className="gap-1.5 text-sm px-3 py-1"
                >
                  <span className={severityColor(level)}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                  <span className="capitalize">{level}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>New CVEs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {diff.newCves.length === 0 ? (
                <div className="text-center py-12 text-[#5A6380] text-sm">No new CVEs</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1C2150]">
                        <th className="text-left text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">CVE ID</th>
                        <th className="text-left text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">Package</th>
                        <th className="text-right text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diff.newCves.map((cve, i) => (
                        <tr key={i} className="border-b border-[#1C2150]/50 last:border-0 hover:bg-[#0D1022]/50 transition-colors">
                          <td className="px-6 py-3 text-sm font-mono text-[#EEF0F7]">{cve.cveId}</td>
                          <td className="px-6 py-3 text-sm text-[#9098B8]">{cve.package}</td>
                          <td className="px-6 py-3 text-right">
                            <Badge variant={severityVariant(cve.severity)}>{cve.severity}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Fixed CVEs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {diff.fixedCves.length === 0 ? (
                <div className="text-center py-12 text-[#5A6380] text-sm">No fixed CVEs</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1C2150]">
                        <th className="text-left text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">CVE ID</th>
                        <th className="text-left text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">Package</th>
                        <th className="text-right text-xs font-medium text-[#5A6380] uppercase tracking-wider px-6 py-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diff.fixedCves.map((cve, i) => (
                        <tr key={i} className="border-b border-[#1C2150]/50 last:border-0 hover:bg-[#0D1022]/50 transition-colors">
                          <td className="px-6 py-3 text-sm font-mono text-[#EEF0F7]">{cve.cveId}</td>
                          <td className="px-6 py-3 text-sm text-[#9098B8]">{cve.package}</td>
                          <td className="px-6 py-3 text-right">
                            <Badge variant={severityVariant(cve.severity)}>{cve.severity}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
