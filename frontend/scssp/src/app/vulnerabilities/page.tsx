'use client'

import { useState } from 'react'
import { useVulnerabilities } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, Spinner, ErrorState, Pagination } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { severityBgClass, formatDate, cn } from '@/lib/utils'
import { Search, Bug } from 'lucide-react'

const severityTabs = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export default function VulnerabilitiesPage() {
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState('all')
  const [search, setSearch] = useState('')
  const { data, isLoading, error, refetch } = useVulnerabilities(page, 10, severity, search)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vulnerabilities</h1>
        <p className="text-sm text-[#5A6380] mt-1">Security vulnerabilities found across your container images</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs tabs={severityTabs} activeTab={severity} onTabChange={t => { setSeverity(t); setPage(1) }} />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
          <Input
            placeholder="Search by CVE or package..."
            className="pl-9 transition-all duration-200 focus:border-[#00D4AA]/50"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load vulnerabilities" onRetry={() => refetch()} /></CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>CVSS</TableHead>
                  <TableHead>Fix Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-[#5A6380]">No vulnerabilities found</TableCell>
                  </TableRow>
                ) : (
                  (data?.data ?? []).map(vuln => (
                    <TableRow key={vuln.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4757]/10 group-hover:bg-[#FF4757]/20 transition-colors">
                            <Bug className="h-4 w-4 text-[#FF4757]" />
                          </div>
                          <code className="text-sm font-medium text-white group-hover:text-[#FF4757] transition-colors">{vuln.cveId}</code>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-[#EEF0F7]">{vuln.package}</TableCell>
                      <TableCell className="text-[#5A6380]">{vuln.version}</TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', severityBgClass(vuln.severity))}>
                          {vuln.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-mono font-medium tabular-nums',
                          vuln.cvss >= 9 ? 'text-[#FF4757]' : vuln.cvss >= 7 ? 'text-[#FFA502]' : vuln.cvss >= 4 ? 'text-[#4DA6FF]' : 'text-[#5A6380]'
                        )}>
                          {vuln.cvss.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vuln.fixVersion ? (
                          <code className="text-xs text-[#00D4AA]">{vuln.fixVersion}</code>
                        ) : (
                          <span className="text-xs text-[#3A4058]">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vuln.isFixed ? 'success' : vuln.exploitAvailable ? 'danger' : 'warning'}>
                          {vuln.isFixed ? 'Fixed' : vuln.exploitAvailable ? 'Exploit Available' : 'Unfixed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{formatDate(vuln.publishedAt)}</TableCell>
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
