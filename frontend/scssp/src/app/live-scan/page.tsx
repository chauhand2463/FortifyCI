'use client'

import { useState } from 'react'
import { useCreateLiveScan, usePolicies } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/shared'
import { cn, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { services } from '@/services/api'
import { ScanSearch, Loader2, AlertTriangle, CheckCircle, Shield, ExternalLink, Clock, Hash, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { LiveScan } from '@/types'

export default function LiveScanPage() {
  const [imageRef, setImageRef] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [scanId, setScanId] = useState<string | null>(null)

  const createScan = useCreateLiveScan()
  const { data: policies, isLoading: policiesLoading } = usePolicies()

  const { data: liveScan, isFetching: pollLoading } = useQuery<LiveScan>({
    queryKey: ['liveScan', scanId],
    queryFn: () => services.liveScans.getById(scanId!),
    enabled: !!scanId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'running' || data?.status === 'queued') return 2000
      return false
    },
  })

  const isScanning = liveScan?.status === 'running' || liveScan?.status === 'queued'
  const isDone = liveScan?.status === 'completed' || liveScan?.status === 'failed'

  const handleScan = async () => {
    if (!imageRef.trim()) {
      toast.error('Please enter an image reference')
      return
    }
    setScanId(null)
    try {
      const result = await createScan.mutateAsync({
        imageRef: imageRef.trim(),
        policyId: policyId || undefined,
      })
      setScanId(result.id)
      toast.success('Live scan started')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start scan')
    }
  }

  const handleReset = () => {
    setScanId(null)
    createScan.reset()
  }

  const policyOptions = [
    { value: '', label: 'No Policy (Default)' },
    ...(policies?.map(p => ({ value: p.id, label: p.name })) ?? []),
  ]

  const actionColor = (action?: string) => {
    switch (action) {
      case 'pass': return 'text-[#00D4AA]'
      case 'block': return 'text-[#FF4757]'
      case 'warn': return 'text-[#FFA502]'
      default: return 'text-[#5A6380]'
    }
  }

  const actionBg = (action?: string) => {
    switch (action) {
      case 'pass': return 'bg-[#00D4AA]/10'
      case 'block': return 'bg-[#FF4757]/10'
      case 'warn': return 'bg-[#FFA502]/10'
      default: return 'bg-[#5A6380]/10'
    }
  }

  const actionIcon = (action?: string) => {
    switch (action) {
      case 'pass': return CheckCircle
      case 'block': return Shield
      case 'warn': return AlertTriangle
      default: return AlertTriangle
    }
  }

  const duration = liveScan?.createdAt && liveScan?.completedAt
    ? `${Math.round(
        (new Date(liveScan.completedAt).getTime() - new Date(liveScan.createdAt).getTime()) / 1000
      )}s`
    : '-'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Scan</h1>
        <p className="text-sm text-[#5A6380] mt-1">Scan container images on-demand before deployment</p>
      </div>

      {!scanId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-[#00D4AA]" />
              New Live Scan
            </CardTitle>
            <CardDescription>Enter an image reference to scan on-demand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9098B8]">Image Reference</label>
              <Input
                placeholder="e.g. nginx:latest or registry.example.com/app:v1.2"
                value={imageRef}
                onChange={e => setImageRef(e.target.value)}
                disabled={createScan.isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9098B8]">Policy (Optional)</label>
              <Select
                options={policyOptions}
                value={policyId}
                onChange={e => setPolicyId(e.target.value)}
                disabled={createScan.isPending || policiesLoading}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={createScan.isPending || !imageRef.trim()}
              className="gap-2 w-full sm:w-auto"
            >
              {createScan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              {createScan.isPending ? 'Starting Scan...' : 'Scan Now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {createScan.isPending && !scanId && (
        <Card className="border-[#00D4AA]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Spinner size="md" />
              <span className="text-[#9098B8]">Starting scan...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Card className="border-[#00D4AA]/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#00D4AA] animate-pulse" />
                <span className="text-[#00D4AA] font-medium">Scanning {liveScan?.imageRef}</span>
                <span className="text-sm text-[#5A6380] ml-auto tabular-nums">{liveScan?.progress ?? 0}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#1C2150] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00D4AA] to-[#059669] transition-all duration-500 ease-out"
                  style={{ width: `${liveScan?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pollLoading && isScanning && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#5A6380]">
          <Spinner size="sm" />
          Updating scan status...
        </div>
      )}

      {isDone && liveScan && (
        <div className="space-y-6 animate-fade-up">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                {liveScan.status === 'failed' ? (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF4757]/10 mb-4">
                      <AlertTriangle className="h-8 w-8 text-[#FF4757]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#FF4757]">Scan Failed</h2>
                    <p className="text-[#FF4757]/80 mt-1">
                      {liveScan.errorMessage || 'An unexpected error occurred during the scan'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className={cn('flex h-16 w-16 items-center justify-center rounded-full mb-4', actionBg(liveScan.policyResult?.action))}>
                      {(() => {
                        const Icon = actionIcon(liveScan.policyResult?.action)
                        return <Icon className={cn('h-8 w-8', actionColor(liveScan.policyResult?.action))} />
                      })()}
                    </div>
                    <h2 className={cn('text-xl font-bold capitalize', actionColor(liveScan.policyResult?.action))}>
                      {liveScan.policyResult?.action ?? 'Unknown'}
                    </h2>
                    {liveScan.policyResult?.action === 'pass' && (
                      <p className="text-[#00D4AA]/80 mt-1">Image is safe to deploy</p>
                    )}
                    {liveScan.policyResult?.action === 'block' && (
                      <p className="text-[#FF4757]/80 mt-1">Image blocked by security policy</p>
                    )}
                    {liveScan.policyResult?.action === 'warn' && (
                      <p className="text-[#FFA502]/80 mt-1">Image passed with warnings</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {liveScan.policyResult?.action === 'pass' && (
            <Card className="border-[#00D4AA]/20 bg-[#00D4AA]/5">
              <CardContent className="p-6 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[#00D4AA] shrink-0" />
                <span className="text-[#00D4AA] font-medium">
                  This image passed all policy checks and is safe to deploy
                </span>
              </CardContent>
            </Card>
          )}

          {liveScan.policyResult?.action === 'block' &&
            liveScan.policyResult.blockingCves &&
            liveScan.policyResult.blockingCves.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#FF4757]">
                    <AlertTriangle className="h-4 w-4" />
                    Blocking CVEs ({liveScan.policyResult.blockingCves.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {liveScan.policyResult.blockingCves.map((cve, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1022] border border-[#1C2150]"
                      >
                        <span className="text-sm font-mono text-[#EEF0F7]">{cve}</span>
                        <Badge variant="danger">Blocking</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          <Card>
            <CardHeader>
              <CardTitle>Scan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <Hash className="h-4 w-4 text-[#4DA6FF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#5A6380]">Image Reference</p>
                    <p className="text-sm font-medium text-white font-mono truncate">{liveScan.imageRef}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <FileText className="h-4 w-4 text-[#4DA6FF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#5A6380]">Policy Used</p>
                    <p className="text-sm font-medium text-white truncate">
                      {liveScan.policyId
                        ? policies?.find(p => p.id === liveScan.policyId)?.name ?? liveScan.policyId
                        : 'Default Policy'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <Clock className="h-4 w-4 text-[#4DA6FF] shrink-0" />
                  <div>
                    <p className="text-xs text-[#5A6380]">Duration</p>
                    <p className="text-sm font-medium text-white tabular-nums">{duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <Clock className="h-4 w-4 text-[#4DA6FF] shrink-0" />
                  <div>
                    <p className="text-xs text-[#5A6380]">Completed At</p>
                    <p className="text-sm font-medium text-white">{formatDate(liveScan.completedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {liveScan.downloadUrl && (
            <Card>
              <CardContent className="p-4">
                <a
                  href={liveScan.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#00D4AA] hover:text-[#05C091] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Download Scan Report
                </a>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <ScanSearch className="h-4 w-4" />
              New Scan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
