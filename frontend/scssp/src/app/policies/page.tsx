'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePolicies, useCreatePolicy, useUpdatePolicy, useDeletePolicy } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Spinner, ErrorState, EmptyState, Skeleton } from '@/components/ui/shared'
import { cn } from '@/lib/utils'
import { Plus, Shield, Trash2, Edit, Star, StarOff, ToggleLeft, ToggleRight, GripVertical, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { ScanPolicy } from '@/types'

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const actionOptions = [
  { value: 'block', label: 'Block' },
  { value: 'warn', label: 'Warn' },
]

interface RuleForm {
  severityThreshold: string
  maxCount: string
  action: string
}

const emptyRule = (): RuleForm => ({
  severityThreshold: 'high',
  maxCount: '0',
  action: 'block',
})

function severityVariant(severity: string) {
  switch (severity) {
    case 'critical': return 'danger' as const
    case 'high': return 'warning' as const
    case 'medium': return 'info' as const
    case 'low': return 'default' as const
    default: return 'default' as const
  }
}

function PolicyForm({
  initial,
  onSave,
  saving,
}: {
  initial?: ScanPolicy
  onSave: (data: { name: string; description: string; rules: RuleForm[] }) => void
  saving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [rules, setRules] = useState<RuleForm[]>(
    initial?.rules?.map(r => ({
      severityThreshold: r.severityThreshold,
      maxCount: String(r.maxCount),
      action: r.action,
    })) ?? [emptyRule()]
  )

  const addRule = () => setRules(prev => [...prev, emptyRule()])
  const removeRule = (idx: number) => setRules(prev => prev.filter((_, i) => i !== idx))
  const updateRule = (idx: number, field: keyof RuleForm, value: string) =>
    setRules(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Policy name is required')
      return
    }
    if (rules.length === 0) {
      toast.error('At least one rule is required')
      return
    }
    for (const r of rules) {
      if (!r.maxCount || parseInt(r.maxCount) < 0) {
        toast.error('Max count must be a non-negative number')
        return
      }
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      rules: rules.map(r => ({
        ...r,
        maxCount: String(parseInt(r.maxCount) || 0),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Policy Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Gate" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Description</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the policy purpose" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#5A6380]">Rules</label>
          <Button type="button" variant="outline" size="sm" onClick={addRule} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Rule
          </Button>
        </div>
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-lg border border-[#1C2150] bg-[#080A14] p-3">
              <div className="flex flex-1 flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-[10px] font-medium text-[#5A6380] mb-1 uppercase tracking-wider">Severity</label>
                  <Select
                    options={severityOptions}
                    value={rule.severityThreshold}
                    onChange={e => updateRule(idx, 'severityThreshold', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-medium text-[#5A6380] mb-1 uppercase tracking-wider">Max Count</label>
                  <Input
                    type="number"
                    min="0"
                    value={rule.maxCount}
                    onChange={e => updateRule(idx, 'maxCount', e.target.value)}
                    className="text-center"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] font-medium text-[#5A6380] mb-1 uppercase tracking-wider">Action</label>
                  <Select
                    options={actionOptions}
                    value={rule.action}
                    onChange={e => updateRule(idx, 'action', e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 h-9 w-9 shrink-0 text-[#FF4757] hover:text-[#FF6B7A] hover:bg-[#FF4757]/10"
                onClick={() => removeRule(idx)}
                disabled={rules.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update Policy' : 'Create Policy'}
        </Button>
      </div>
    </form>
  )
}

function PolicyCard({
  policy,
  onSetDefault,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  policy: ScanPolicy
  onSetDefault: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:border-[#252A5A] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{policy.name}</CardTitle>
                {policy.isDefault && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">
                    <Star className="h-3 w-3 mr-0.5 inline" />
                    Default
                  </Badge>
                )}
              </div>
              {policy.description && (
                <CardDescription className="mt-1">{policy.description}</CardDescription>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={policy.isActive}
                onChange={onToggleActive}
                className="sr-only peer"
              />
              <div className={cn(
                'w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all',
                policy.isActive ? 'peer-checked:bg-[#00D4AA]' : 'peer-checked:bg-[#00D4AA]',
                policy.isActive ? 'bg-[#3A4058]' : 'bg-[#3A4058]'
              )} />
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {policy.rules.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#5A6380] uppercase tracking-wider">Rules</p>
              <div className="space-y-1.5">
                {policy.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Badge variant={severityVariant(rule.severityThreshold)} className="text-[10px] px-1.5 py-0">
                      {rule.severityThreshold}
                    </Badge>
                    <span className="text-[#9098B8]">
                      {'>='} <span className="text-white font-mono tabular-nums">{rule.maxCount}</span> {'→'}
                    </span>
                    <Badge variant={rule.action === 'block' ? 'danger' : 'warning'} className="text-[10px] px-1.5 py-0 uppercase">
                      {rule.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#3A4058]">No rules defined</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-[#1C2150]/50">
            {!policy.isDefault && (
              <Button variant="ghost" size="sm" onClick={onSetDefault} className="gap-1.5 text-xs">
                <Star className="h-3.5 w-3.5" />
                Set as Default
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 text-xs">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="gap-1.5 text-xs text-[#FF4757] hover:text-[#FF6B7A] hover:bg-[#FF4757]/10">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function PoliciesPage() {
  const { data: policies, isLoading, error, refetch } = usePolicies()
  const createPolicy = useCreatePolicy()
  const updatePolicy = useUpdatePolicy()
  const deletePolicy = useDeletePolicy()

  const [createOpen, setCreateOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<ScanPolicy | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScanPolicy | null>(null)

  function rulesToBackend(rules: RuleForm[]) {
    const out: Record<string, any> = { blockOnlyFixable: true }
    let blockOnCritical = true
    let blockOnHigh = false
    let maxHighCount = 0
    let maxMediumCount = -1
    for (const r of rules) {
      const maxC = parseInt(r.maxCount) || 0
      if (r.severityThreshold === 'critical') {
        blockOnCritical = r.action === 'block'
      } else if (r.severityThreshold === 'high') {
        blockOnHigh = r.action === 'block'
        maxHighCount = r.action === 'block' ? maxC : -1
      } else if (r.severityThreshold === 'medium') {
        maxMediumCount = r.action === 'block' ? maxC : -1
      }
    }
    return { ...out, blockOnCritical, blockOnHigh, maxHighCount, maxMediumCount }
  }

  const handleCreate = async (data: { name: string; description: string; rules: RuleForm[] }) => {
    try {
      await createPolicy.mutateAsync({
        name: data.name,
        description: data.description,
        ...rulesToBackend(data.rules),
      })
      toast.success('Policy created')
      setCreateOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create policy')
    }
  }

  const handleUpdate = async (data: { name: string; description: string; rules: RuleForm[] }) => {
    if (!editPolicy) return
    try {
      await updatePolicy.mutateAsync({
        id: editPolicy.id,
        data: {
          name: data.name,
          description: data.description,
          ...rulesToBackend(data.rules),
        },
      })
      toast.success('Policy updated')
      setEditPolicy(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update policy')
    }
  }

  const handleSetDefault = async (policy: ScanPolicy) => {
    try {
      await updatePolicy.mutateAsync({
        id: policy.id,
        data: { isDefault: true },
      })
      toast.success(`${policy.name} is now the default policy`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set default policy')
    }
  }

  const handleToggleActive = async (policy: ScanPolicy) => {
    try {
      await updatePolicy.mutateAsync({
        id: policy.id,
        data: { isActive: !policy.isActive },
      })
      toast.success(policy.isActive ? 'Policy deactivated' : 'Policy activated')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle policy')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deletePolicy.mutateAsync(deleteTarget.id)
      toast.success('Policy deleted')
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete policy')
    }
  }

  const saving = createPolicy.isPending || updatePolicy.isPending || deletePolicy.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scan Policies</h1>
          <p className="text-sm text-[#5A6380] mt-1">Define rules that govern image scanning and deployment gates</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message="Failed to load policies" onRetry={() => refetch()} />
      ) : !policies || policies.length === 0 ? (
        <Card>
          <EmptyState
            title="No policies yet"
            description="Create your first scan policy to define rules for image scanning and deployment gates."
            icon={<Shield className="h-12 w-12 text-[#3A4058]" />}
            action={{ label: 'Create Policy', onClick: () => setCreateOpen(true) }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {policies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onSetDefault={() => handleSetDefault(policy)}
                onEdit={() => setEditPolicy(policy)}
                onDelete={() => setDeleteTarget(policy)}
                onToggleActive={() => handleToggleActive(policy)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Create Policy">
        <PolicyForm onSave={handleCreate} saving={createPolicy.isPending} />
      </Modal>

      <Modal open={!!editPolicy} onClose={() => !saving && setEditPolicy(null)} title="Edit Policy">
        {editPolicy && (
          <PolicyForm initial={editPolicy} onSave={handleUpdate} saving={updatePolicy.isPending} />
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} title="Delete Policy">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF4757]/10">
              <AlertTriangle className="h-5 w-5 text-[#FF4757]" />
            </div>
            <div>
              <p className="text-sm text-[#9098B8]">
                Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>?
              </p>
              <p className="text-xs text-[#5A6380] mt-1">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
              {deletePolicy.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
