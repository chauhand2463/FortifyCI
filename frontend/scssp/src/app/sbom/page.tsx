'use client'

import { useState } from 'react'
import { useSBOM, useImages } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, Spinner, ErrorState } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { severityBgClass, formatDate, cn } from '@/lib/utils'
import { Package, Scale, GitBranch } from 'lucide-react'

const sbomTabs = [
  { id: 'packages', label: 'Packages' },
  { id: 'licenses', label: 'Licenses' },
  { id: 'dependencies', label: 'Dependencies' },
]

export default function SBOMPage() {
  const { data: imagesData } = useImages(1, 100)
  const images = imagesData?.data || []
  const imageOptions = images.map(img => ({ value: img.id, label: `${img.name}:${img.tag}` }))

  const [imageId, setImageId] = useState('')
  const [tab, setTab] = useState('packages')
  const { data: sbom, isLoading, error, refetch } = useSBOM(imageId)

  const selectedLabel = imageOptions.find(o => o.value === imageId)?.label || ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">SBOM Explorer</h1>
          <p className="text-sm text-[#5A6380] mt-1">Software Bill of Materials analysis</p>
        </div>
        <div className="w-full sm:w-64">
          <Select
            options={imageOptions.length > 0 ? imageOptions : [{ value: '', label: 'No images available' }]}
            value={imageId}
            onChange={e => setImageId(e.target.value)}
          />
        </div>
      </div>

      {sbom && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>SBOM - {selectedLabel}</CardTitle>
              <CardDescription>
                {sbom.bomFormat} v{sbom.specVersion}  Generated {formatDate(sbom.createdAt)}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <Tabs tabs={sbomTabs} activeTab={tab} onTabChange={setTab} />

      {!imageId ? (
        <div className="flex items-center justify-center py-12 text-[#5A6380]">Select an image to view its SBOM</div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorState message="Failed to load SBOM data" onRetry={() => refetch()} />
      ) : !sbom || sbom.packages.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-[#5A6380]">No SBOM data available for this image. Run a scan first.</div>
      ) : (
        <>
          {tab === 'packages' && (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Dependencies</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sbom.packages.map(pkg => (
                    <TableRow key={pkg.name} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D4AA]/10 group-hover:bg-[#00D4AA]/20 transition-colors">
                            <Package className="h-4 w-4 text-[#00D4AA]" />
                          </div>
                          <span className="font-medium text-white">{pkg.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380]">{pkg.version}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.type}</Badge>
                      </TableCell>
                      <TableCell className="text-[#5A6380]">{pkg.license}</TableCell>
                      <TableCell className="text-[#5A6380] tabular-nums">{pkg.dependencies}</TableCell>
                      <TableCell>
                        {pkg.vulnerabilities.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {pkg.vulnerabilities.map(v => (
                              <span key={v.id} className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', severityBgClass(v.severity))}>
                                {v.cveId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#00D4AA] text-sm">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {tab === 'licenses' && (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License</TableHead>
                    <TableHead>SPDX ID</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sbom.licenses.map(lic => (
                    <TableRow key={lic.spdxId} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <Scale className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="font-medium text-white">{lic.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs text-[#5A6380]">{lic.spdxId}</code></TableCell>
                      <TableCell className="text-[#5A6380] tabular-nums">{lic.packages}</TableCell>
                      <TableCell>
                        <Badge variant={lic.risk === 'high' ? 'danger' : lic.risk === 'medium' ? 'warning' : 'success'}>
                          {lic.risk}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {tab === 'dependencies' && (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Depends On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sbom.dependencies.map(dep => (
                    <TableRow key={dep.packageName} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                            <GitBranch className="h-4 w-4 text-cyan-400" />
                          </div>
                          <span className="font-medium text-white">{dep.packageName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5A6380]">{dep.version}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {dep.dependencies.map(d => (
                            <Badge key={d} variant="outline" className="transition-colors hover:border-[#252A5A]">{d}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
