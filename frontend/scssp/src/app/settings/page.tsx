'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/store'
import { formatDate } from '@/lib/utils'
import { User, Copy, Plus, Key, Bell, Shield } from 'lucide-react'
import { toast } from 'sonner'

const settingsTabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'keys', label: 'API Keys', adminOnly: true },
  { id: 'preferences', label: 'Preferences' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')
  const { user } = useAuthStore()
  const visibleTabs = settingsTabs.filter(t => !t.adminOnly || user?.role === 'admin')

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
                    <Input defaultValue={user?.name ?? ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Email</label>
                    <Input defaultValue={user?.email ?? ''} type="email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Role</label>
                <Input defaultValue={user?.role ?? ''} disabled />
              </div>
              <div className="pt-2">
                <Button className="transition-all duration-200">Save Changes</Button>
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
                  <Button variant="outline" size="sm" className="transition-all duration-200">Upload</Button>
                  <Button variant="ghost" size="sm">Remove</Button>
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
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">New Password</label>
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Confirm New Password</label>
              <Input type="password" />
            </div>
            <div className="pt-2">
              <Button className="transition-all duration-200">Update Password</Button>
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
              <Button size="sm" className="gap-2 transition-all duration-200">
                <Plus className="h-4 w-4" />
                New Key
              </Button>
            </div>
          </CardHeader>
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
              {([] as Array<{id: string; name: string; key: string; permissions: string[]; createdAt: string; lastUsed: string | null}>).map(ak => (
                <TableRow key={ak.id} className="group">
                  <TableCell className="font-medium text-white">{ak.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[#5A6380] font-mono">{ak.key}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(ak.key); toast.success('Copied to clipboard') }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ak.permissions.map(p => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#5A6380] text-xs">{formatDate(ak.createdAt)}</TableCell>
                  <TableCell className="text-[#5A6380] text-xs">{ak.lastUsed ? formatDate(ak.lastUsed) : 'Never'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-[#FF4757] hover:text-[#FF6B7A] hover:bg-[#FF4757]/10 transition-all duration-200">Revoke</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
