'use client'

import { useState } from 'react'
import { useReports, useGenerateReport, useScans } from '@/hooks/use-queries'
import { services } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { StatusDot } from '@/components/ui/status-dot'
import { Spinner, ErrorState } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { FileText, Download, Plus } from 'lucide-react'
import { toast } from 'sonner'

const reportTypes = [
  { value: 'vulnerability', label: 'Vulnerability Report' },
  { value: 'compliance', label: 'Compliance Report' },
  { value: 'audit', label: 'Audit Report' },
  { value: 'custom', label: 'Custom Report' },
]

const reportFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

export default function ReportsPage() {
  const [type, setType] = useState('vulnerability')
  const [format, setFormat] = useState('pdf')
  const [scanId, setScanId] = useState('')
  const { data: reports, isLoading, error, refetch } = useReports()
  const { data: scansData } = useScans()
  const scans = scansData?.items || []
  const generateMutation = useGenerateReport()

  const handleDownload = async (reportId: string, title: string, format: string) => {
    try {
      await services.downloadReportFile(reportId, `${title}.${format}`)
      toast.success('Download started')
    } catch {
      toast.error('Download failed')
    }
  }

  const handleGenerate = () => {
    generateMutation.mutate(
      { type, format, scanId: scanId || undefined },
      {
        onSuccess: () => toast.success('Report generation started'),
        onError: () => toast.error('Failed to generate report'),
      }
    )
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'ready': return 'success' as const
      case 'generating': return 'warning' as const
      case 'failed': return 'danger' as const
      default: return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-[#5A6380] mt-1">Generate and download security reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Report Type</label>
              <Select options={reportTypes} value={type} onChange={e => setType(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Scan (optional)</label>
              <select
                value={scanId}
                onChange={e => setScanId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#2A2F3E] bg-[#1A1D2E] px-3 text-sm text-white focus:border-[#FFA502] focus:outline-none"
              >
                <option value="">Latest scan</option>
                {scans.map(s => (
                  <option key={s.id} value={s.id}>{s.imageName || s.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-sm font-medium text-[#5A6380] mb-1.5">Format</label>
              <Select options={reportFormats} value={format} onChange={e => setFormat(e.target.value)} />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="gap-2 w-full sm:w-auto transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              {generateMutation.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12"><Spinner size="lg" /></CardContent>
        ) : error ? (
          <CardContent><ErrorState message="Failed to load reports" onRetry={() => refetch()} /></CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#5A6380]">No reports generated yet</TableCell>
                  </TableRow>
                ) : (
                  (reports?.items ?? []).map(rpt => (
                    <TableRow key={rpt.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFA502]/10 group-hover:bg-[#FFA502]/20 transition-colors">
                            <FileText className="h-4 w-4 text-[#FFA502]" />
                          </div>
                          <span className="font-medium text-white">{rpt.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{rpt.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-[#5A6380] uppercase font-mono">{rpt.format}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusDot status={rpt.status} />
                          <Badge variant={statusVariant(rpt.status)}>{rpt.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380] text-xs">{formatDate(rpt.createdAt)}</TableCell>
                      <TableCell className="text-[#5A6380] text-xs tabular-nums">{rpt.size || '-'}</TableCell>
                      <TableCell>
                        {rpt.status === 'ready' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDownload(rpt.id, rpt.title, rpt.format)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        ) : rpt.status === 'generating' ? (
                          <span className="text-xs text-[#FFA502]">Generating...</span>
                        ) : rpt.status === 'failed' ? (
                          <span className="text-xs text-[#FF4757]">Failed</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
