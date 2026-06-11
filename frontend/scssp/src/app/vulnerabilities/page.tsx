'use client'

import { useState } from 'react'
import { useVulnerabilities, useCreateAssignment, useCreateException } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, Spinner, ErrorState, Pagination } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { severityBgClass, formatDate, cn } from '@/lib/utils'
import { Search, Bug, UserPlus, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'

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

  const [assignModal, setAssignModal] = useState<{ open: boolean; vulnId: string; cveId: string }>({ open: false, vulnId: '', cveId: '' })
  const [exceptionModal, setExceptionModal] = useState<{ open: boolean; cveId: string }>({ open: false, cveId: '' })
  const [assigneeId, setAssigneeId] = useState('')
  const [assignNotes, setAssignNotes] = useState('')
  const [exceptionReason, setExceptionReason] = useState('')
  const [exceptionExpiry, setExceptionExpiry] = useState('')
  const createAssignment = useCreateAssignment()
  const createException = useCreateException()

  const handleAssign = async () => {
    try {
      await createAssignment.mutateAsync({ vulnerabilityId: assignModal.vulnId, assignedToId: assigneeId, notes: assignNotes })
      toast.success('Assignment created')
      setAssignModal({ open: false, vulnId: '', cveId: '' })
      setAssigneeId('')
      setAssignNotes('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create assignment')
    }
  }

  const handleException = async () => {
    try {
      await createException.mutateAsync({ cveId: exceptionModal.cveId, reason: exceptionReason, expiresAt: exceptionExpiry })
      toast.success('Exception request submitted')
      setExceptionModal({ open: false, cveId: '' })
      setExceptionReason('')
      setExceptionExpiry('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create exception')
    }
  }

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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-[#5A6380]">No vulnerabilities found</TableCell>
                  </TableRow>
                ) : (
                  (data?.items ?? []).map(vuln => (
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
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setAssignModal({ open: true, vulnId: vuln.id, cveId: vuln.cveId })}
                            className="p-1.5 rounded-md text-[#4DA6FF] hover:bg-[#4DA6FF]/10 transition-colors"
                            title="Assign"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setExceptionModal({ open: true, cveId: vuln.cveId })}
                            className="p-1.5 rounded-md text-[#FFA502] hover:bg-[#FFA502]/10 transition-colors"
                            title="Request Exception"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

      <Modal open={assignModal.open} onClose={() => setAssignModal({ open: false, vulnId: '', cveId: '' })} title="Assign Vulnerability">
        <div className="space-y-4 p-6">
          <p className="text-sm text-[#5A6380]">Assign {assignModal.cveId} to a team member</p>
          <div>
            <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Assignee ID</label>
            <Input value={assigneeId} onChange={e => setAssigneeId(e.target.value)} placeholder="User ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Notes</label>
            <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAssignModal({ open: false, vulnId: '', cveId: '' })}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assigneeId || createAssignment.isPending}>
              {createAssignment.isPending ? 'Creating...' : 'Assign'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={exceptionModal.open} onClose={() => setExceptionModal({ open: false, cveId: '' })} title="Request Exception">
        <div className="space-y-4 p-6">
          <p className="text-sm text-[#5A6380]">Request an exception for {exceptionModal.cveId}</p>
          <div>
            <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Reason</label>
            <Textarea value={exceptionReason} onChange={e => setExceptionReason(e.target.value)} placeholder="Detailed justification (min 50 characters)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Expires At</label>
            <Input type="date" value={exceptionExpiry} onChange={e => setExceptionExpiry(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setExceptionModal({ open: false, cveId: '' })}>Cancel</Button>
            <Button onClick={handleException} disabled={exceptionReason.length < 10 || !exceptionExpiry || createException.isPending}>
              {createException.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
