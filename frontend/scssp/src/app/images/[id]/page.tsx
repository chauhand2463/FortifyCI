'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { services } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Spinner, ErrorState } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Container, ScanSearch, ArrowLeft, Loader2, Tag, Cpu, Monitor, FileJson, BookmarkCheck, BookmarkX } from 'lucide-react'
import { toast } from 'sonner'
import type { Scan, ImageDetail } from '@/types'

function useImageDetail(id: string) {
  return useQuery({
    queryKey: ['imageDetail', id],
    queryFn: async () => {
      const [detail, _raw] = await Promise.all([
        services.getImage(id),
        services.getImageDetail(id).catch(() => null),
      ])
      return { detail: detail as ImageDetail, raw: _raw as Record<string, any> }
    },
    enabled: !!id,
  })
}

function useImageScans(imageId: string) {
  return useQuery({
    queryKey: ['scans', 'image', imageId],
    queryFn: async () => {
      const body = await services.getScansByImageId(imageId)
      return body
    },
    enabled: !!imageId,
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some(
        s => s.status === 'running' || s.status === 'queued'
      )
      return hasActive ? 3000 : false
    },
  })
}

export default function ImageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [scanning, setScanning] = useState(false)

  const { data: imageData, isLoading, error } = useImageDetail(id)
  const { data: scans, isLoading: scansLoading } = useImageScans(id)

  const image = imageData?.detail ?? null
  const rawDetail = imageData?.raw ?? null

  const handleScan = async () => {
    if (!image) return
    setScanning(true)
    try {
      await services.createScan(id, 'trivy')
      toast.success(`Scan started for ${image.name}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start scan')
    } finally {
      setScanning(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  if (error || !image) {
    return <ErrorState message="Image not found" onRetry={() => router.push('/images')} />
  }

  const latestScan = scans && scans.length > 0 ? scans[0] : null
  const activeScan = scans?.find(s => s.status === 'running' || s.status === 'queued')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/images')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D4AA]/10">
            <Container className="h-6 w-6 text-[#00D4AA]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {image.name}<span className="text-[#5A6380] font-normal">:{image.tag}</span>
            </h1>
            <p className="text-sm text-[#5A6380] mt-0.5">{image.registry}/{image.repository}</p>
            <p className="text-xs text-[#3D4470] font-mono mt-0.5 break-all">{image.digest || 'No digest'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeScan && (
            <div className="flex items-center gap-1.5 text-sm text-[#00D4AA]">
              <span className="h-2 w-2 rounded-full bg-[#00D4AA] animate-pulse" />
              Scanning... {activeScan.progress}%
            </div>
          )}
          <Button
            size="sm"
            onClick={handleScan}
            disabled={scanning || !!activeScan}
            className="gap-1.5"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4" />
            )}
            {activeScan ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StatusDot status={image.lastScanStatus || 'unknown'} />
              <span className="text-white font-medium capitalize">{image.lastScanStatus || 'unknown'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Vulnerabilities</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-xs">
              {image.vulnerabilitySummary.critical > 0 && <span className="text-[#FF4757] font-medium">{image.vulnerabilitySummary.critical} Critical</span>}
              {image.vulnerabilitySummary.high > 0 && <span className="text-[#FFA502] font-medium">{image.vulnerabilitySummary.high} High</span>}
              {image.vulnerabilitySummary.medium > 0 && <span className="text-[#4DA6FF]">{image.vulnerabilitySummary.medium} Medium</span>}
              {image.vulnerabilitySummary.low > 0 && <span className="text-[#5A6380]">{image.vulnerabilitySummary.low} Low</span>}
              {image.vulnerabilitySummary.critical + image.vulnerabilitySummary.high + image.vulnerabilitySummary.medium + image.vulnerabilitySummary.low === 0 && (
                <span className="text-[#00D4AA]">Clean - No vulnerabilities</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Size</CardTitle></CardHeader>
          <CardContent><span className="text-white font-medium">{image.size}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Architecture</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#4DA6FF]" />
              <span className="text-white font-medium">{image.architecture || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">OS</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#4DA6FF]" />
              <span className="text-white font-medium">{image.os || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Media Type</CardTitle></CardHeader>
          <CardContent>
            <span className="text-white font-medium text-sm">{image.mediaType || 'N/A'}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#5A6380]">Signed</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {image.isSigned ? (
                <><BookmarkCheck className="h-4 w-4 text-[#00D4AA]" /><span className="text-[#00D4AA] font-medium">Signed</span></>
              ) : (
                <><BookmarkX className="h-4 w-4 text-[#5A6380]" /><span className="text-[#5A6380]">Not signed</span></>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeScan && (
        <Card className="border-[#00D4AA]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#00D4AA]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00D4AA] animate-pulse" />
              Live Scan: {activeScan.scanType}
            </CardTitle>
            <CardDescription>Started {formatDate(activeScan.startedAt)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#5A6380]">Progress</span>
                <span className="text-white font-medium">{activeScan.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C2150] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00D4AA] to-[#059669] transition-all duration-500"
                  style={{ width: `${activeScan.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {rawDetail?.labels && Object.keys(rawDetail.labels).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4" /> Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(rawDetail.labels).map(([key, value]) => (
                <div key={key} className="p-2 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <p className="text-xs text-[#5A6380] font-mono">{key}</p>
                  <p className="text-sm text-white font-medium break-all">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {rawDetail?.manifest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson className="h-4 w-4" /> Manifest</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-[#5A6380] font-mono overflow-auto max-h-60 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
              {JSON.stringify(rawDetail.manifest, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {rawDetail?.config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson className="h-4 w-4" /> Config</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-[#5A6380] font-mono overflow-auto max-h-60 p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
              {JSON.stringify(rawDetail.config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>All scans for this image</CardDescription>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !scans || scans.length === 0 ? (
            <div className="text-center py-8 text-[#5A6380]">
              <ScanSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No scans yet</p>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning} className="mt-3">
                Run first scan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan: Scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0D1022] border border-[#1C2150]">
                  <div className="flex items-center gap-3">
                    <StatusDot status={scan.status === 'completed' ? 'clean' : scan.status === 'failed' ? 'error' : 'scanning'} />
                    <div>
                      <p className="text-sm text-white font-medium capitalize">{scan.status}</p>
                      <p className="text-xs text-[#5A6380]">
                        {formatDate(scan.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.status === 'running' && (
                      <div className="flex items-center gap-1 text-xs text-[#00D4AA]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
                        {scan.progress}%
                      </div>
                    )}
                    <span className="text-xs text-[#5A6380]">{scan.scanType}</span>
                    <Badge variant={scan.vulnerabilitiesCount > 0 ? 'danger' : 'success'} className="text-[10px]">
                      {scan.vulnerabilitiesCount} vulns
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
