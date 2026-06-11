'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, Spinner } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/store'
import { useApiKeys, useCreateApiKey, useDeleteApiKey, useNvdStatus } from '@/hooks/use-queries'
import { services } from '@/services/api'
import { getAccessToken } from '@/store'
import { formatDate, cn } from '@/lib/utils'
import { User, Copy, Plus, Key, Bell, Shield, Trash2, Database, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const settingsTabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'keys', label: 'API Keys', adminOnly: true },
  { id: 'nvd', label: 'NVD Watch', adminOnly: true },
  { id: 'preferences', label: 'Preferences' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const { user, login } = useAuthStore()
  const visibleTabs = settingsTabs.filter(t => !t.adminOnly || user?.role === 'admin')

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await services.updateProfile(name, email)
      if (user) login({ ...user, name, email }, getAccessToken() || '')
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters')
      return
    }
    setChangingPassword(true)
    try {
      await services.changePassword(currentPassword, newPassword)
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const { data: apiKeys, isLoading: keysLoading } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const deleteApiKey = useDeleteApiKey()

  const handleCreateKey = async () => {
    const name = prompt('Enter a name for the new API key:')
    if (!name) return
    try {
      const result = await createApiKey.mutateAsync({ name })
      toast.success(`API key created! Copy it now: ${result.key}`, { duration: 15000 })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create API key')
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return
    try {
      await deleteApiKey.mutateAsync(id)
      toast.success('API key revoked')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to revoke API key')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#5A6380] mt-1">Manage your account and preferences</p>
      </div>

      <Tabs tabs={visibleTabs} activeTab={tab} onTabChange={setTab} />

      {tab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Full Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Email</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Role</label>
                <Input defaultValue={user?.role ?? ''} disabled />
              </div>
              <div className="pt-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="transition-all duration-200">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Upload a profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00D4AA]/20 border-2 border-[#00D4AA]/30">
                  <User className="h-7 w-7 text-[#00D4AA]" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="transition-all duration-200" disabled>Upload</Button>
                  <Button variant="ghost" size="sm" disabled>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Current Password</label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">New Password</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Confirm New Password</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <div className="pt-2">
              <Button onClick={handleChangePassword} disabled={changingPassword} className="transition-all duration-200">
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'keys' && user?.role === 'admin' && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for programmatic access</CardDescription>
              </div>
              <Button size="sm" onClick={handleCreateKey} disabled={createApiKey.isPending} className="gap-2 transition-all duration-200">
                <Plus className="h-4 w-4" />
                {createApiKey.isPending ? 'Creating...' : 'New Key'}
              </Button>
            </div>
          </CardHeader>
          {keysLoading ? (
            <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!apiKeys || apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-[#5A6380]">No API keys created yet</TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map(ak => (
                    <TableRow key={ak.id} className="group">
                      <TableCell className="font-medium text-white">{ak.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-[#5A6380] font-mono">{ak.keyPrefix}...</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(ak.keyPrefix); toast.success('Copied to clipboard') }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(ak.permissions || []).length === 0 ? (
                            <span className="text-xs text-[#5A6380]">All permissions</span>
                          ) : (
                            (ak.permissions || []).map((p: string) => (
                              <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{formatDate(ak.createdAt)}</TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{ak.lastUsedAt ? formatDate(ak.lastUsedAt) : 'Never'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(ak.id)} disabled={deleteApiKey.isPending} className="text-[#FF4757] hover:text-[#FF6B7A] hover:bg-[#FF4757]/10 transition-all duration-200">
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'nvd' && user?.role === 'admin' && (
        <NvdWatchSection />
      )}

      {tab === 'preferences' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Critical CVE Alerts', desc: 'Get notified when critical CVEs are detected', defaultChecked: true },
                { label: 'Scan Completions', desc: 'Receive notifications when scans finish', defaultChecked: true },
                { label: 'Policy Breaches', desc: 'Alerts for security policy violations', defaultChecked: true },
                { label: 'System Updates', desc: 'Scanner and platform update notifications', defaultChecked: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-[#9098B8] group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-xs text-[#5A6380]">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-[#3A4058] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00D4AA]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D4AA]" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Defaults</CardTitle>
              <CardDescription>Default settings for new scans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Auto-scan on push', desc: 'Automatically scan images when pushed to registry', defaultChecked: true },
                { label: 'Fail on critical', desc: 'Mark scans as failed if critical CVEs found', defaultChecked: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-[#9098B8] group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-xs text-[#5A6380]">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-[#3A4058] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00D4AA]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D4AA]" />
                  </label>
                </div>
              ))}
              <div className="pt-2">
                <Button className="transition-all duration-200">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function NvdWatchSection() {
  const { data: status, isLoading, error, refetch } = useNvdStatus()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>NVD Watch</CardTitle>
              <CardDescription>National Vulnerability Database auto-sync and monitoring</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner size="lg" /></div>
          ) : error ? (
            <div className="text-center py-8 text-[#FF4757]">Failed to load NVD status</div>
          ) : status ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-[#0D1022]/60 border border-[#1C2150] p-4">
                  <p className="text-xs text-[#5A6380] mb-1">Last Sync</p>
                  <p className="text-sm font-medium text-white">{status.lastSyncAt ? formatDate(status.lastSyncAt) : 'Never'}</p>
                </div>
                <div className="rounded-lg bg-[#0D1022]/60 border border-[#1C2150] p-4">
                  <p className="text-xs text-[#5A6380] mb-1">CVEs Tracked</p>
                  <p className="text-sm font-medium text-white">{status.totalTracked ?? 0}</p>
                </div>
                <div className="rounded-lg bg-[#0D1022]/60 border border-[#1C2150] p-4">
                  <p className="text-xs text-[#5A6380] mb-1">Auto-Triggered Rescans</p>
                  <p className="text-sm font-medium text-white">{status.totalRescans ?? 0}</p>
                </div>
              </div>

              <div className="rounded-lg bg-[#0D1022]/60 border border-[#1C2150] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-[#4DA6FF]" />
                  <span className="text-sm font-medium text-white">Recent CVEs</span>
                </div>
                {(status.recentCves ?? []).length === 0 ? (
                  <p className="text-sm text-[#5A6380]">No recent CVEs tracked</p>
                ) : (
                  <div className="space-y-2">
                    {status.recentCves.map((cve: any) => (
                      <div key={cve.id} className="flex items-center justify-between py-1.5 border-b border-[#1C2150] last:border-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-white">{cve.cveId}</code>
                          {cve.severity && (
                            <Badge variant={cve.severity === 'CRITICAL' ? 'danger' : cve.severity === 'HIGH' ? 'warning' : 'info'}>
                              {cve.severity}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {cve.cvssScore && <span className="text-xs text-[#5A6380]">CVSS {cve.cvssScore}</span>}
                          {cve.isProcessed ? (
                            <Badge variant="success">Processed</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-[#5A6380] flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Data sourced from NVD API v2.0
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#3A4058]">No NVD status available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
