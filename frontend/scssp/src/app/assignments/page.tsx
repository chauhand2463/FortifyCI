'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAssignments, useCreateAssignment, useUpdateAssignmentStatus } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner, ErrorState, TableSkeleton, EmptyState, Pagination } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, cn } from '@/lib/utils'
import { Plus, CircleUser, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VulnerabilityAssignment } from '@/types'

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'sla_breached', label: 'SLA Breached' },
]

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'open': return 'warning'
    case 'in_progress': return 'info'
    case 'resolved': return 'success'
    default: return 'default'
  }
}

function daysOverdue(deadline: string): number {
  const diff = Date.now() - new Date(deadline).getTime()
  return Math.max(1, Math.floor(diff / 86400000))
}

export default function AssignmentsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [vulnerabilityId, setVulnerabilityId] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [notes, setNotes] = useState('')

  const params: Record<string, unknown> = { page, limit: 10 }
  if (filter === 'sla_breached') {
    params.breached = true
  } else if (filter !== 'all') {
    params.status = filter
  }

  const { data, isLoading, error, refetch } = useAssignments(params)
  const createAssignment = useCreateAssignment()
  const updateStatus = useUpdateAssignmentStatus()

  const assignments: VulnerabilityAssignment[] = (data as any)?.items ?? []
  const totalPages: number = (data as any)?.totalPages ?? 1

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAssignment.mutateAsync({ vulnerabilityId, assignedToId, notes: notes || undefined })
      toast.success('Assignment created successfully')
      setModalOpen(false)
      setVulnerabilityId('')
      setAssignedToId('')
      setNotes('')
    } catch {
      toast.error('Failed to create assignment')
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'resolved' })
      toast.success('Assignment marked as resolved')
    } catch {
      toast.error('Failed to update assignment status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vulnerability Assignments</h1>
          <p className="text-sm text-[#5A6380] mt-1">Assign and track vulnerability remediation across your team</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Assignment
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg bg-[#080A14] p-1 border border-[#1C2150] w-fit">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setFilter(tab.id); setPage(1) }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5',
              filter === tab.id
                ? 'bg-[#00D4AA]/10 text-[#00D4AA] shadow-sm border border-[#00D4AA]/20'
                : 'text-[#5A6380] hover:text-[#9098B8]'
            )}
          >
            {tab.id === 'sla_breached' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4757]" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="py-8">
            <TableSkeleton rows={5} />
          </CardContent>
        ) : error ? (
          <CardContent>
            <ErrorState message="Failed to load assignments" onRetry={() => refetch()} />
          </CardContent>
        ) : assignments.length === 0 ? (
          <CardContent>
            <EmptyState
              title="No assignments found"
              description={filter !== 'all' ? 'No assignments match the selected filter.' : 'Create a new assignment to start tracking vulnerability remediation.'}
              icon={<CircleUser className="h-8 w-8" />}
              action={filter === 'all' ? { label: 'New Assignment', onClick: () => setModalOpen(true) } : undefined}
            />
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA Deadline</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => {
                  const isBreached = a.status !== 'resolved' && !!a.slaDeadline && new Date(a.slaDeadline).getTime() < Date.now()
                  return (
                    <TableRow key={a.id} className="group">
                      <TableCell>
                        <Link
                          href={`/vulnerabilities${a.vulnerabilityId ? `?id=${a.vulnerabilityId}` : ''}`}
                          className="text-sm font-medium text-white hover:text-[#FF4757] transition-colors"
                        >
                          {a.vulnerability?.cveId ?? a.vulnerabilityId ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4DA6FF]/10">
                            <CircleUser className="h-3.5 w-3.5 text-[#4DA6FF]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#EEF0F7]">{a.assignedTo.name}</span>
                            <span className="text-xs text-[#5A6380]">{a.assignedTo.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadgeVariant(a.status)}>
                            {a.status === 'in_progress' ? 'In Progress' : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </Badge>
                          {(a.status === 'sla_breached' || isBreached) && (
                            <Badge variant="danger" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              SLA Breached
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.slaDeadline ? (
                          <span className={cn(
                            'text-sm tabular-nums',
                            isBreached ? 'text-[#FF4757] font-medium' : 'text-[#5A6380]'
                          )}>
                            {formatDate(a.slaDeadline)}
                            {isBreached && (
                              <span className="ml-2 text-xs text-[#FF4757]">
                                (Overdue {daysOverdue(a.slaDeadline)}d)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-[#3A4058]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#5A6380]">{formatDate(a.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {a.status !== 'resolved' ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleResolve(a.id)}
                            disabled={updateStatus.isPending}
                            className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Resolved
                          </Button>
                        ) : (
                          <span className="text-xs text-[#00D4AA] font-medium">
                            Resolved {a.resolvedAt ? formatDate(a.resolvedAt) : ''}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Vulnerability ID</label>
            <Input
              placeholder="e.g. vuln-abc123"
              value={vulnerabilityId}
              onChange={e => setVulnerabilityId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Assigned To</label>
            <Input
              placeholder="User ID"
              value={assignedToId}
              onChange={e => setAssignedToId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Notes</label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createAssignment.isPending} className="gap-2">
              {createAssignment.isPending ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
              Create Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
