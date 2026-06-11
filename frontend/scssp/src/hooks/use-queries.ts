import { services } from '@/services/api'
import type { ContainerImage, Scan, Vulnerability, Report, Notification, ScanStatistics, SBOMEntry } from '@/types'
import type { ScanDiff, VulnerabilityAssignment, VulnerabilityException, ScanPolicy, Webhook, WebhookDelivery, CveWatchEntry, PostureSnapshot, LiveScan, PostureTrend, LeaderboardEntry, ComplianceReport } from '@/types'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'

export function useStatistics() {
  return useQuery<ScanStatistics>({
    queryKey: ['statistics'],
    queryFn: () => services.getStatistics(),
  })
}

export function useImages(page = 1, pageSize = 10, search = '') {
  return useQuery({
    queryKey: ['images', page, pageSize, search],
    queryFn: () => services.getImages(page, pageSize, search),
  })
}

export function useScans(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['scans', page, pageSize],
    queryFn: () => services.getScans(page, pageSize),
  })
}

export function useScan(id: string) {
  return useQuery<Scan>({
    queryKey: ['scan', id],
    queryFn: () => services.getScan(id),
    enabled: !!id,
  })
}

export function useVulnerabilities(page = 1, pageSize = 10, severity?: string, search = '') {
  return useQuery({
    queryKey: ['vulnerabilities', page, pageSize, severity, search],
    queryFn: () => services.getVulnerabilities(page, pageSize, severity, search),
  })
}

export function useSBOM(imageId: string) {
  return useQuery<SBOMEntry | undefined>({
    queryKey: ['sbom', imageId],
    queryFn: () => services.getSBOM(imageId) as Promise<SBOMEntry | undefined>,
    enabled: !!imageId,
  })
}

export function useReports() {
  return useQuery<{ items: Report[]; total: number }>({
    queryKey: ['reports'],
    queryFn: () => services.getReports(),
    refetchInterval: (query) => {
      const data = query.state.data
      const hasGenerating = (data?.items ?? []).some(r => r.status === 'generating')
      return hasGenerating ? 3000 : false
    },
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, format, scanId }: { type: string; format: string; scanId?: string }) =>
      services.createReport(type, format, scanId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useGenerateSBOM() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ imageId, format }: { imageId: string; format?: string }) =>
      services.createSBOM(imageId, format),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sbom'] })
    },
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => services.getNotifications(),
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useChartData() {
  return useQuery({
    queryKey: ['chartData'],
    queryFn: () => services.getChartData(),
  })
}

export function useRegisterImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, tag, registry, repository, registryCredentials }: {
      name: string; tag: string; registry: string; repository: string
      registryCredentials?: { username: string; password: string; serverAddress?: string }
    }) =>
      services.registerImage(name, tag, registry, repository, registryCredentials),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images'] })
      qc.invalidateQueries({ queryKey: ['statistics'] })
    },
  })
}

export function useCreateScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ imageId, scanType }: { imageId: string; scanType?: string }) =>
      services.createScan(imageId, scanType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scans'] })
      qc.invalidateQueries({ queryKey: ['images'] })
      qc.invalidateQueries({ queryKey: ['statistics'] })
    },
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => services.getApiKeys(),
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, permissions }: { name: string; permissions?: string[] }) =>
      services.createApiKey(name, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apiKeys'] }),
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.deleteApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apiKeys'] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) =>
      services.updateProfile(name, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useActiveScans() {
  return useQuery({
    queryKey: ['scans', 'active'],
    queryFn: () => services.getScans(1, 100),
    refetchInterval: (query) => {
      const data = query.state.data
      const hasActive = data?.items?.some(
        (s: { status: string }) => s.status === 'running' || s.status === 'queued'
      )
      return hasActive ? 5000 : false
    },
  })
}

// ========== V2.0 HOOKS ==========

// Blast Radius
export function useBlastRadius(cveId: string) {
  return useQuery({
    queryKey: ['blastRadius', cveId],
    queryFn: () => services.blastRadius.findByCve(cveId),
    enabled: !!cveId,
  })
}

export function useBulkRescan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cveId: string) => services.blastRadius.bulkRescan(cveId),
    onSuccess: (_data, cveId) => {
      qc.invalidateQueries({ queryKey: ['blastRadius', cveId] })
      qc.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

// Scan Diff
export function useScanDiff(scanId: string) {
  return useQuery<ScanDiff>({
    queryKey: ['scanDiff', scanId],
    queryFn: () => services.scanDiff.getDiff(scanId),
    enabled: !!scanId,
  })
}

// Posture
export function usePostureTrend(dateFrom?: string, dateTo?: string) {
  return useQuery<PostureTrend[]>({
    queryKey: ['postureTrend', dateFrom, dateTo],
    queryFn: () => services.posture.orgTrend(dateFrom, dateTo),
  })
}

export function useImagePosture(imageId: string) {
  return useQuery<PostureSnapshot[]>({
    queryKey: ['imagePosture', imageId],
    queryFn: () => services.posture.imageHistory(imageId),
    enabled: !!imageId,
  })
}

export function useLeaderboard() {
  return useQuery<{ best: LeaderboardEntry[]; worst: LeaderboardEntry[]; mostImproved: LeaderboardEntry[] }>({
    queryKey: ['leaderboard'],
    queryFn: () => services.posture.leaderboard(),
  })
}

// Assignments
export function useAssignments(params?: { status?: string; assigneeId?: string; breached?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => services.assignments.list(params),
  })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { vulnerabilityId: string; assignedToId: string; notes?: string }) =>
      services.assignments.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUpdateAssignmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      services.assignments.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

// Exceptions
export function useExceptions(params?: { isActive?: boolean; cveId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['exceptions', params],
    queryFn: () => services.exceptions.list(params),
  })
}

export function useCreateException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { cveId: string; reason: string; expiresAt: string; imageId?: string }) =>
      services.exceptions.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exceptions'] }),
  })
}

export function useApproveException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.exceptions.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exceptions'] }),
  })
}

export function useRevokeException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.exceptions.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exceptions'] }),
  })
}

// Policies
export function usePolicies() {
  return useQuery<ScanPolicy[]>({
    queryKey: ['policies'],
    queryFn: () => services.policies.list(),
  })
}

export function useCreatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => services.policies.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  })
}

export function useUpdatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => services.policies.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  })
}

export function useDeletePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.policies.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  })
}

// Webhooks
export function useWebhooks() {
  return useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => services.webhooks.list(),
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; url: string; secret: string; events: string[] }) =>
      services.webhooks.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useUpdateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => services.webhooks.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.webhooks.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

export function useTestWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => services.webhooks.test(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })
}

// Live Scan
export function useCreateLiveScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { imageRef: string; policyId?: string }) =>
      services.liveScans.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liveScans'] }),
  })
}

// NVD Watch
export function useNvdStatus() {
  return useQuery({
    queryKey: ['nvdStatus'],
    queryFn: () => services.nvdWatch.status(),
  })
}
