import { services } from '@/services/api'
import type { ContainerImage, Scan, Vulnerability, Report, Notification, ScanStatistics, SBOMEntry } from '@/types'
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
    queryFn: () => services.getScanById(id),
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
  return useQuery<SBOMEntry>({
    queryKey: ['sbom', imageId],
    queryFn: () => services.getSBOM(imageId),
    enabled: !!imageId,
  })
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => services.getReports(),
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, format }: { type: string; format: string }) =>
      services.generateReport(type, format),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
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
    mutationFn: ({ name, tag, registry, repository }: { name: string; tag: string; registry: string; repository: string }) =>
      services.registerImage(name, tag, registry, repository),
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
      const hasActive = data?.data?.some(
        s => s.status === 'running' || s.status === 'queued'
      )
      return hasActive ? 5000 : false
    },
  })
}
