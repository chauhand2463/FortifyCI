'use client'

import { useState } from 'react'
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook } from '@/hooks/use-queries'
import type { Webhook } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState, Spinner, ErrorState, Skeleton } from '@/components/ui/shared'
import { cn, formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { WebhookIcon, Plus, Copy, Check, Eye, EyeOff, Trash2, Play, Pencil, Activity } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_EVENTS = [
  { id: 'scan.completed', label: 'Scan Completed' },
  { id: 'scan.regression_detected', label: 'Regression Detected' },
  { id: 'assignment.created', label: 'Assignment Created' },
  { id: 'exception.created', label: 'Exception Created' },
  { id: 'exception.approved', label: 'Exception Approved' },
  { id: 'nvd.critical_cve', label: 'Critical CVE Published' },
]

interface WebhookFormData {
  name: string
  url: string
  secret: string
  events: string[]
}

const emptyForm: WebhookFormData = { name: '', url: '', secret: '', events: [] }

function WebhookSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="shrink-0 text-[#5A6380] hover:text-[#00D4AA] transition-colors"
      title="Copy URL"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-block h-2 w-2 rounded-full shrink-0',
      active ? 'bg-[#00D4AA] shadow-[0_0_6px_rgba(0,212,170,0.5)]' : 'bg-[#FF4757] shadow-[0_0_6px_rgba(255,71,87,0.5)]'
    )} />
  )
}

export default function WebhooksPage() {
  const { data: webhooks, isLoading, error, refetch } = useWebhooks()
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()
  const testWebhook = useTestWebhook()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null)
  const [form, setForm] = useState<WebhookFormData>(emptyForm)
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = !!editingWebhook

  function openAddModal() {
    setForm(emptyForm)
    setEditingWebhook(null)
    setShowSecret(false)
    setShowAddModal(true)
  }

  function openEditModal(w: Webhook) {
    setForm({ name: w.name, url: w.url, secret: '', events: [...w.events] })
    setEditingWebhook(w)
    setShowSecret(false)
    setShowAddModal(true)
  }

  function closeModal() {
    setShowAddModal(false)
    setEditingWebhook(null)
    setForm(emptyForm)
  }

  function toggleEvent(eventId: string) {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Name and URL are required')
      return
    }
    setSaving(true)
    try {
      if (isEditing && editingWebhook) {
        await updateWebhook.mutateAsync({
          id: editingWebhook.id,
          data: { name: form.name, url: form.url, events: form.events },
        })
        toast.success('Webhook updated')
      } else {
        await createWebhook.mutateAsync(form)
        toast.success('Webhook created')
      }
      closeModal()
    } catch {
      toast.error(isEditing ? 'Failed to update webhook' : 'Failed to create webhook')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingWebhook) return
    try {
      await deleteWebhook.mutateAsync(deletingWebhook.id)
      toast.success('Webhook deleted')
      setDeletingWebhook(null)
    } catch {
      toast.error('Failed to delete webhook')
    }
  }

  async function handleTest(id: string) {
    try {
      await testWebhook.mutateAsync(id)
      toast.success('Test ping sent successfully')
    } catch {
      toast.error('Test ping failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-sm text-[#5A6380] mt-1">Send real-time events to your external services</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {isLoading ? (
        <WebhookSkeleton />
      ) : error ? (
        <Card>
          <CardContent>
            <ErrorState message="Failed to load webhooks" onRetry={() => refetch()} />
          </CardContent>
        </Card>
      ) : !webhooks || webhooks.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<WebhookIcon className="h-12 w-12" />}
              title="No webhooks configured"
              description="Add a webhook to receive real-time security events on your external services."
              action={{ label: 'Add Webhook', onClick: openAddModal }}
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {webhooks.map((wh, i) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors',
                          wh.isActive ? 'bg-[#00D4AA]/10' : 'bg-[#FF4757]/10'
                        )}>
                          <Activity className={cn(
                            'h-4 w-4',
                            wh.isActive ? 'text-[#00D4AA]' : 'text-[#FF4757]'
                          )} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            {wh.name}
                            <StatusDot active={wh.isActive} />
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#5A6380]">
                        <span className="truncate max-w-[320px]">{wh.url}</span>
                        <CopyButton text={wh.url} />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {wh.events.map(event => (
                          <Badge key={event} variant="outline" className="text-[11px]">
                            {event}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3A4058]">
                        {wh.lastTriggeredAt && (
                          <span>Last triggered: {formatDate(wh.lastTriggeredAt)}</span>
                        )}
                        {wh.lastSuccessAt && (
                          <span className="text-[#00D4AA]/60">Last success: {formatDate(wh.lastSuccessAt)}</span>
                        )}
                        {wh.lastFailureAt && (
                          <span className="text-[#FF4757]/60">Last failure: {formatDate(wh.lastFailureAt)}</span>
                        )}
                        {!wh.lastTriggeredAt && <span>Never triggered</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEditModal(wh)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleTest(wh.id)}
                        disabled={testWebhook.isPending}
                        title="Test"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#FF4757]/60 hover:text-[#FF4757] opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeletingWebhook(wh)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={showAddModal} onClose={closeModal} title={isEditing ? 'Edit Webhook' : 'Add Webhook'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-1.5">Name</label>
            <Input
              placeholder="My Webhook"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-1.5">URL</label>
            <Input
              placeholder="https://example.com/webhook"
              value={form.url}
              onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-1.5">
              Secret {isEditing && <span className="text-[#5A6380] text-xs">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                placeholder={isEditing ? 'Enter new secret' : 'Signing secret'}
                value={form.secret}
                onChange={e => setForm(prev => ({ ...prev, secret: e.target.value }))}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowSecret(prev => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6380] hover:text-[#9098B8] transition-colors"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9098B8] mb-2">Events</label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map(event => (
                <label
                  key={event.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
                    form.events.includes(event.id)
                      ? 'border-[#00D4AA]/30 bg-[#00D4AA]/5'
                      : 'border-[#1C2150] bg-[#080A14]/50 hover:border-[#252A5A]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.events.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="h-4 w-4 rounded border-[#1C2150] bg-[#080A14] text-[#00D4AA] accent-[#00D4AA] focus:ring-[#00D4AA]/20"
                  />
                  <span className="text-sm text-[#EEF0F7]">{event.label}</span>
                  <span className="text-xs text-[#5A6380] ml-auto">{event.id}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deletingWebhook} onClose={() => setDeletingWebhook(null)} title="Delete Webhook">
        <div className="space-y-4">
          <p className="text-sm text-[#9098B8]">
            Are you sure you want to delete <span className="text-white font-semibold">{deletingWebhook?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingWebhook(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteWebhook.isPending}>
              {deleteWebhook.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
