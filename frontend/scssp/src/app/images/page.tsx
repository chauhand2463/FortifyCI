'use client'

import { useState } from 'react'
import { useImages, useCreateScan, useRegisterImage } from '@/hooks/use-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Spinner, ErrorState, Pagination } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import { RegisterImageModal } from '@/components/images/register-image-modal'
import { Search, Container, Plus, ScanSearch, RefreshCw, Loader2, ScanLine } from 'lucide-react'
import { toast } from 'sonner'

export default function ImagesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [quickScanInput, setQuickScanInput] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [registryFilter, setRegistryFilter] = useState('')
  const { data, isLoading, error, refetch } = useImages(page, 10, search)
  const createScan = useCreateScan()
  const registerImage = useRegisterImage()

  const statusVariant = (status: string) => {
    switch (status) {
      case 'clean': return 'success' as const
      case 'vulnerable': return 'danger' as const
      case 'scanning': return 'warning' as const
      case 'error': return 'danger' as const
      default: return 'default' as const
    }
  }

  const handleScan = async (imageId: string, imageName: string) => {
    try {
      await createScan.mutateAsync({ imageId })
      toast.success(`Scan started for ${imageName}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start scan')
    }
  }

  const handleQuickScan = async () => {
    const input = quickScanInput.trim()
    if (!input) {
      toast.error('Enter a container image name (e.g. nginx:latest)')
      return
    }
    let name = input
    let tag = 'latest'
    if (input.includes(':')) {
      name = input.split(':')[0]
      tag = input.split(':')[1]
    }

    let registry = 'docker.io'
    let repository = ''
    if (name.includes('/')) {
      const parts = name.split('/')
      if (parts.length >= 3) {
        registry = parts.slice(0, -2).join('/')
        repository = parts.slice(-2).join('/')
        name = parts[parts.length - 1]
      } else {
        repository = name
        name = parts[parts.length - 1]
      }
    } else {
      repository = `library/${name}`
    }

    try {
      const img = await registerImage.mutateAsync({
        name,
        tag,
        registry,
        repository,
      })
      await createScan.mutateAsync({ imageId: img.id })
      toast.success(`Scan started for ${input}`)
      setQuickScanInput('')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to scan image')
    }
  }

  return (
    <div className="space-y-6">
      <RegisterImageModal open={registerOpen} onClose={() => { setRegisterOpen(false); refetch() }} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Container Images</h1>
          <p className="text-sm text-[#5A6380] mt-1">Monitor, register, and scan your container images</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
            <Input
              placeholder="Search images..."
              className="pl-9 transition-all duration-200 focus:border-[#00D4AA]/50"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 shrink-0">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => setRegisterOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Register</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5A6380] uppercase tracking-wider">Severity</span>
          <div className="flex gap-1">
            {['', 'critical', 'high', 'medium', 'low'].map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-200',
                  severityFilter === s
                    ? 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20'
                    : 'text-[#5A6380] border-[#1C2150] hover:border-[#2A2F5A] hover:text-[#9098B8]'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5A6380] uppercase tracking-wider">Registry</span>
          <input
            placeholder="Filter registry..."
            className={cn(
              'h-7 w-36 rounded-md border border-[#1C2150] bg-[#0D1022] px-2 text-xs text-[#EEF0F7]',
              'placeholder:text-[#3A4058] focus:outline-none focus:border-[#00D4AA]/50 transition-colors'
            )}
            value={registryFilter}
            onChange={e => setRegistryFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <ScanLine className="h-5 w-5 text-[#00D4AA]" />
              <span className="text-sm font-medium text-white">Quick Scan</span>
            </div>
            <div className="flex-1 relative">
              <Container className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
              <Input
                placeholder="Enter image name (e.g. nginx:latest, node:22-alpine)..."
                className="pl-9 transition-all duration-200 focus:border-[#00D4AA]/50"
                value={quickScanInput}
                onChange={e => setQuickScanInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleQuickScan() }}
              />
            </div>
            <Button
              size="sm"
              onClick={handleQuickScan}
              disabled={registerImage.isPending || createScan.isPending}
              className="gap-1.5 shrink-0 whitespace-nowrap"
            >
              {(registerImage.isPending || createScan.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              Scan Now
            </Button>
          </div>
          <p className="text-xs text-[#5A6380] mt-2">Registers and scans the image in one step. Uses Docker Hub as the default registry.</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load images" onRetry={() => refetch()} /></CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Registry</TableHead>
                  <TableHead>Last Scanned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-[#5A6380]">
                      <div className="flex flex-col items-center gap-2">
                        <Container className="h-8 w-8 text-[#5A6380]/50" />
                        <p>No images found</p>
                        <p className="text-xs">Use the Quick Scan box above or register an image to get started</p>
                        <Button variant="outline" size="sm" onClick={() => setRegisterOpen(true)} className="mt-2">
                          <Plus className="h-4 w-4 mr-1" /> Register your first image
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.items ?? []).map(img => (
                    <TableRow key={img.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4AA]/10 group-hover:bg-[#00D4AA]/20 transition-colors">
                            <Container className="h-4 w-4 text-[#00D4AA]" />
                          </div>
                          <Link href={`/images/${img.id}`} className="font-medium text-white hover:text-[#00D4AA] transition-colors">{img.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs text-[#5A6380]">{img.tag}</code></TableCell>
                      <TableCell className="text-[#5A6380] tabular-nums">{img.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusDot status={img.lastScanStatus} />
                          <Badge variant={statusVariant(img.lastScanStatus)}>{img.lastScanStatus}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          {img.vulnerabilitySummary.critical > 0 && (
                            <span className="text-[#FF4757] font-medium">{img.vulnerabilitySummary.critical}C</span>
                          )}
                          {img.vulnerabilitySummary.high > 0 && (
                            <span className="text-[#FFA502] font-medium">{img.vulnerabilitySummary.high}H</span>
                          )}
                          {img.vulnerabilitySummary.medium > 0 && (
                            <span className="text-[#4DA6FF]">{img.vulnerabilitySummary.medium}M</span>
                          )}
                          {img.vulnerabilitySummary.low > 0 && (
                            <span className="text-[#5A6380]">{img.vulnerabilitySummary.low}L</span>
                          )}
                          {img.vulnerabilitySummary.critical + img.vulnerabilitySummary.high + img.vulnerabilitySummary.medium + img.vulnerabilitySummary.low === 0 && (
                            <span className="text-[#00D4AA]">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{img.registry}</TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{formatDate(img.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScan(img.id, img.name)}
                          disabled={createScan.isPending}
                          className="gap-1.5"
                        >
                          {createScan.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ScanSearch className="h-3.5 w-3.5" />
                          )}
                          Scan
                        </Button>
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
    </div>
  )
}
