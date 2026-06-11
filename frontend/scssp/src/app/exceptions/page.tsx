'use client'

import { useState } from 'react'
import { useExceptions, useCreateException, useApproveException, useRevokeException } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Tabs, Spinner, ErrorState, EmptyState } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, cn } from '@/lib/utils'
import { ShieldPlus, ShieldCheck, ShieldX, AlertTriangle, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { VulnerabilityException } from '@/types'

const filterTabs = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
]

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  revoked: { label: 'Revoked', variant: 'danger' },
}

function isExpiringSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now()
}

export default function ExceptionsPage() {
  const [filter, setFilter] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [cveId, setCveId] = useState('')
  const [reason, setReason] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [imageId, setImageId] = useState('')

  const { data, isLoading, error, refetch } = useExceptions(
    filter === 'active' ? { isActive: true } : undefined
  )
  const createException = useCreateException()
  const approveException = useApproveException()
  const revokeException = useRevokeException()

  const exceptions: VulnerabilityException[] = data?.items ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cveId || !reason || !expiresAt) {
      toast.error('CVE ID, reason, and expiry date are required')
      return
    }
    try {
      await createException.mutateAsync({
        cveId,
        reason,
        expiresAt: new Date(expiresAt).toISOString(),
        imageId: imageId || undefined,
      })
      toast.success('Exception request created')
      setModalOpen(false)
      setCveId('')
      setReason('')
      setExpiresAt('')
      setImageId('')
    } catch {
      toast.error('Failed to create exception')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveException.mutateAsync(id)
      toast.success('Exception approved')
    } catch {
      toast.error('Failed to approve exception')
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeException.mutateAsync(id)
      toast.success('Exception revoked')
    } catch {
      toast.error('Failed to revoke exception')
    }
  }

  const pendingActions = (exc: VulnerabilityException) => (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="success"
        onClick={() => handleApprove(exc.id)}
        disabled={approveException.isPending}
        className="gap-1.5"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleRevoke(exc.id)}
        disabled={revokeException.isPending}
        className="gap-1.5"
      >
        <ShieldX className="h-3.5 w-3.5" />
        Revoke
      </Button>
    </div>
  )

  const approvedActions = (exc: VulnerabilityException) => (
    <Button
      size="sm"
      variant="destructive"
      onClick={() => handleRevoke(exc.id)}
      disabled={revokeException.isPending}
      className="gap-1.5"
    >
      <ShieldX className="h-3.5 w-3.5" />
      Revoke
    </Button>
  )

  const renderActions = (exc: VulnerabilityException) => {
    if (exc.status === 'pending') return pendingActions(exc)
    if (exc.status === 'approved') return approvedActions(exc)
    return <span className="text-xs text-[#3A4058]">—</span>
  }

  const renderExpiryCell = (exc: VulnerabilityException) => {
    const expiring = isExpiringSoon(exc.expiresAt)
    const expired = isExpired(exc.expiresAt)
    return (
      <div className="flex items-center gap-2">
        {expiring && <AlertTriangle className="h-4 w-4 text-[#FFA502]" />}
        <span className={cn(
          'text-xs tabular-nums',
          expired ? 'text-[#FF4757]' : expiring ? 'text-[#FFA502]' : 'text-[#5A6380]'
        )}>
          {formatDate(exc.expiresAt)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vulnerability Exceptions</h1>
          <p className="text-sm text-[#5A6380] mt-1">Manage CVE exception requests and approvals</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs tabs={filterTabs} activeTab={filter} onTabChange={setFilter} />
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <ShieldPlus className="h-4 w-4" />
            Request Exception
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load exceptions" onRetry={() => refetch()} /></CardContent>
        ) : exceptions.length === 0 ? (
          <CardContent>
            <EmptyState
              title="No exceptions found"
              description={filter === 'active' ? 'No active exception requests' : 'No exception requests have been created yet'}
              icon={<ShieldPlus className="h-12 w-12" />}
              action={{ label: 'Request Exception', onClick: () => setModalOpen(true) }}
            />
          </CardContent>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((exc) => (
                  <TableRow key={exc.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFA502]/10 group-hover:bg-[#FFA502]/20 transition-colors">
                          <ShieldCheck className="h-4 w-4 text-[#FFA502]" />
                        </div>
                        <code className="text-sm font-medium text-white group-hover:text-[#FFA502] transition-colors">{exc.cveId}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[exc.status]?.variant ?? 'default'}>
                        {statusConfig[exc.status]?.label ?? exc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5A6380] text-sm max-w-[200px] truncate" title={exc.reason}>
                      {exc.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-[#EEF0F7]">
                        <User className="h-3.5 w-3.5 text-[#5A6380]" />
                        {exc.createdBy.name}
                      </div>
                    </TableCell>
                    <TableCell>{renderExpiryCell(exc)}</TableCell>
                    <TableCell className="text-right">{renderActions(exc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Exception">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">CVE ID</label>
            <Input
              placeholder="e.g. CVE-2024-12345"
              value={cveId}
              onChange={(e) => setCveId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Reason</label>
            <Textarea
              placeholder="Why should this vulnerability be excepted?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Expires At</label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#9098B8]">Image ID (optional)</label>
            <Input
              placeholder="sha256:..."
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createException.isPending} className="gap-2">
              {createException.isPending ? <Spinner size="sm" /> : <ShieldPlus className="h-4 w-4" />}
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
