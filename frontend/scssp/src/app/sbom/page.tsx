'use client'

import { useState, useDeferredValue } from 'react'
import { useSBOM, useImages, useGenerateSBOM, useSBOMPackageSearch } from '@/hooks/use-queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, Spinner, ErrorState, Skeleton } from '@/components/ui/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { severityBgClass, formatDate, cn } from '@/lib/utils'
import { Package, Scale, GitBranch, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

const sbomTabs = [
  { id: 'packages', label: 'Packages' },
  { id: 'licenses', label: 'Licenses' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'search', label: 'Search' },
]

export default function SBOMPage() {
  const { data: imagesData } = useImages(1, 100)
  const images = imagesData?.items || []
  const imageOptions = images.map(img => ({ value: img.id, label: `${img.name}:${img.tag}` }))

  const [imageId, setImageId] = useState('')
  const [tab, setTab] = useState('packages')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const { data: sbom, isLoading, error, refetch } = useSBOM(imageId)
  const { data: searchResults, isLoading: searchLoading } = useSBOMPackageSearch(deferredSearch)
  const generateMutation = useGenerateSBOM()

  const selectedLabel = imageOptions.find(o => o.value === imageId)?.label || ''

  const handleGenerateSBOM = () => {
    generateMutation.mutate(
      { imageId, format: 'CYCLONEDX' },
      {
        onSuccess: () => {
          toast.success('SBOM generation started')
          setTimeout(() => refetch(), 2000)
        },
        onError: () => toast.error('Failed to generate SBOM'),
      }
    )
  }

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
        <div className="flex flex-col items-center justify-center py-12 text-[#5A6380]">
          <p className="mb-4">No SBOM data available for this image</p>
          <Button onClick={handleGenerateSBOM} disabled={generateMutation.isPending} className="gap-2">
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {generateMutation.isPending ? 'Generating...' : 'Generate SBOM'}
          </Button>
        </div>
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
                      <TableCell className="text-[#5A6380] tabular-nums">{pkg.dependencies.length}</TableCell>
                      <TableCell>
                        {pkg.vulnerabilities && pkg.vulnerabilities.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {pkg.vulnerabilities.map(v => (
                              <span key={v.cveId} className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', severityBgClass(v.severity))}>
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

          {tab === 'search' && (
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6380]" />
                  <Input
                    placeholder="Search across all images... e.g. log4j, openssl, express"
                    className="pl-9 transition-all duration-200 focus:border-[#00D4AA]/50"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <CardDescription className="mt-2">
                  {searchQuery.length < 2
                    ? 'Type at least 2 characters to search packages across all images'
                    : searchResults?.total !== undefined
                      ? `Found ${searchResults.total} package(s) matching "${searchQuery}"`
                      : 'Searching...'}
                </CardDescription>
              </CardHeader>
              {searchQuery.length >= 2 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Ecosystem</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (searchResults?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-[#5A6380]">
                          No packages found matching "{searchQuery}"
                        </TableCell>
                      </TableRow>
                    ) : (
                      (searchResults?.items ?? []).map((pkg, idx) => (
                        <TableRow key={`${pkg.scanId}-${pkg.name}-${idx}`} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4DA6FF]/10 group-hover:bg-[#4DA6FF]/20 transition-colors">
                                <Package className="h-4 w-4 text-[#4DA6FF]" />
                              </div>
                              <span className="font-medium text-white">{pkg.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#5A6380]">{pkg.version}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{pkg.ecosystem}</Badge>
                          </TableCell>
                          <TableCell className="text-[#5A6380] text-xs font-mono">{pkg.imageName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
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
