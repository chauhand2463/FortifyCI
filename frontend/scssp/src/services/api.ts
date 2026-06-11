import type { ContainerImage, Scan, Vulnerability, Report, Notification, ScanStatistics, SBOMEntry, PaginatedResponse, User, ImageDetail } from '@/types'
import { getAccessToken, refreshAccessToken } from '@/store'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })

  if (res.status === 204) return undefined as T

  const body = await res.json()

  if (!res.ok) {
    if (res.status === 401 && token) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(url, { ...options, headers })
        if (retryRes.status === 204) return undefined as T
        if (retryRes.ok) {
          const retryBody = await retryRes.json()
          if (retryBody.success !== undefined && !retryBody.success) {
            throw new Error(retryBody?.error?.message || 'Request failed')
          }
          return retryBody as T
        }
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    const message = body?.error?.message || (res.status === 403 ? 'You do not have permission to perform this action.' : `Request failed: ${res.status}`)
    throw new Error(message)
  }

  if (body.success !== undefined && !body.success) {
    throw new Error(body?.error?.message || 'Request failed')
  }

  return body as T
}

function toLowerSeverity(s: string): string {
  const map: Record<string, string> = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', UNKNOWN: 'unknown' }
  return map[s] || s.toLowerCase()
}

function toLowerStatus(s: string): string {
  const map: Record<string, string> = { PENDING: 'pending', QUEUED: 'queued', RUNNING: 'running', COMPLETED: 'completed', FAILED: 'failed', CANCELLED: 'cancelled', TIMEOUT: 'timeout' }
  return map[s] || s.toLowerCase()
}

function formatBytes(b: number): string {
  if (b === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

function computeDuration(start: string | Date, end: string | Date): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
}

interface BackendScan {
  id: string; imageId: string; imageName: string; scanType: string
  status: string; progress: number; errorMessage: string | null
  startedAt: string | null; completedAt: string | null
  retryCount: number; maxRetries: number
  vulnerabilitiesCount: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number
  createdAt: string; updatedAt: string
}

interface BackendImage {
  id: string; name: string; tag: string; registry: string; repository: string
  digest: string | null; architecture: string | null; os: string | null
  size: number | null; mediaType: string | null
  createdAt: string; updatedAt: string
  lastScanStatus: string | null; lastScanId: string | null
  vulnerabilitySummary: { critical: number; high: number; medium: number; low: number; unknown: number }
}

function transformImage(b: any): ImageDetail {
  const summary = b.vulnerabilitySummary || { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }
  return {
    id: b.id, name: b.name, tag: b.tag, registry: b.registry, repository: b.repository,
    isSigned: b.isSigned ?? false,
    digest: b.digest || null, architecture: b.architecture || null, os: b.os || null,
    size: b.size ? formatBytes(Number(b.size)) : null,
    mediaType: b.mediaType || null,
    createdAt: b.createdAt, updatedAt: b.updatedAt,
    lastScanStatus: toLowerStatus(b.lastScanStatus || ''),
    lastScanId: b.lastScanId || undefined,
    vulnerabilitySummary: summary,
  }
}

function transformScan(b: any): Scan {
  return {
    id: b.id, imageId: b.imageId, imageName: b.imageName, scanType: b.scanType,
    status: toLowerStatus(b.status),
    progress: b.progress, errorMessage: b.errorMessage || undefined,
    startedAt: b.startedAt || undefined, completedAt: b.completedAt || undefined,
    retryCount: b.retryCount, maxRetries: b.maxRetries,
    vulnerabilitiesCount: b.vulnerabilitiesCount,
    criticalCount: b.criticalCount, highCount: b.highCount, mediumCount: b.mediumCount, lowCount: b.lowCount,
    createdAt: b.createdAt, updatedAt: b.updatedAt,
  }
}

function transformVulnerability(b: any): Vulnerability {
  return {
    id: b.id, cveId: b.vulnerabilityId || b.cveId,
    package: b.packageName || b.package, version: b.packageVersion || b.version,
    severity: toLowerSeverity(b.severity), cvss: b.cvssScore ?? b.cvss ?? 0,
    title: b.title || undefined, description: b.description || undefined,
    fixVersion: b.fixedVersion || b.fixVersion || undefined,
    publishedAt: b.publishedDate || b.publishedAt || undefined,
    source: b.source || 'trivy',
    exploitAvailable: b.exploitAvailable ?? undefined,
    isFixed: !!(b.fixedVersion || b.fixVersion),
    scanId: b.scanId,
  }
}

function transformNotification(b: any): Notification {
  return {
    id: b.id, type: b.type, channel: b.channel,
    subject: b.subject, body: b.body,
    isRead: b.isRead, sentAt: b.sentAt || undefined,
    createdAt: b.createdAt,
  }
}

function transformReport(b: any): Report {
  return {
    id: b.id, title: b.title, type: b.type,
    format: b.format.toLowerCase(),
    status: b.status.toLowerCase(), filePath: b.filePath || undefined,
    fileSize: b.fileSize ?? undefined, generatedAt: b.generatedAt || undefined,
    createdAt: b.createdAt,
  }
}

function transformUser(b: any): User {
  return { id: b.id, email: b.email, name: b.username, role: b.role.toLowerCase(), permissions: b.permissions || [], avatar: b.avatar || null }
}

export const services = {
  async logout() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' }, )
    } catch {}
  },

  async login(email: string, password: string) {
    const body = await apiRequest<{ success: boolean; data: { accessToken: string; expiresIn: number; user: any } }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const user = transformUser(body.data.user)
    return { token: body.data.accessToken, user }
  },

  async register(email: string, name: string, password: string) {
    const body = await apiRequest<{ success: boolean; data: { accessToken: string; expiresIn: number; user: any } }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username: name, password }),
    })
    const user = transformUser(body.data.user)
    return { token: body.data.accessToken, user }
  },

  async forgotPassword(email: string) {
    await apiRequest('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async resetPassword(token: string, password: string) {
    await apiRequest('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  },

  async getStatistics() {
    const body = await apiRequest<{ success: boolean; data: ScanStatistics }>('/api/v1/dashboard/stats')
    return body.data
  },

  async getChartData() {
    const body = await apiRequest<{ success: boolean; data: { vulnerabilitySeverity: { name: string; value: number; color: string }[]; scanTrend: { date: string; scans: number; vulnerabilities: number }[]; monthlySecurity: { month: string; critical: number; high: number; medium: number; low: number }[] } }>('/api/v1/dashboard/chart')
    return body.data
  },

  async getImages(page = 1, limit = 100, search = '') {
    const query = `page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    const body = await apiRequest<{ success: boolean; items: any[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/v1/images?${query}`,
    )
    return { items: body.items.map(transformImage), total: body.total, page: body.page, limit: body.limit, totalPages: body.totalPages }
  },

  async getImage(id: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/images/${id}`)
    return transformImage(body.data)
  },

  async getImageDetail(id: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/images/${id}`)
    return body.data
  },

  async registerImage(name: string, tag: string, registry: string, repository: string, registryCredentials?: { username: string; password: string; serverAddress?: string }) {
    const body = await apiRequest<{ success: boolean; data: { id: string } }>('/api/v1/images', {
      method: 'POST',
      body: JSON.stringify({ name, tag, registry, repository, registryCredentials }),
    })
    return body.data
  },

  async deleteImage(id: string) {
    await apiRequest(`/api/v1/images/${id}`, { method: 'DELETE' })
  },

  async getScans(page = 1, limit = 100, status?: string) {
    const qs = `page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`
    const body = await apiRequest<{ success: boolean; items: any[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/v1/scans?${qs}`,
    )
    return { items: body.items.map(transformScan), total: body.total, page: body.page, limit: body.limit, totalPages: body.totalPages }
  },

  async getScansByImageId(imageId: string) {
    const body = await apiRequest<{ success: boolean; items: any[]; total: number }>(
      `/api/v1/scans?imageId=${imageId}&limit=100`,
    )
    return body.items.map(transformScan)
  },

  async getScan(id: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/scans/${id}`)
    return transformScan(body.data)
  },

  async createScan(imageId: string, scanType = 'trivy') {
    const body = await apiRequest<{ success: boolean; data: { id: string; status: string } }>('/api/v1/scans', {
      method: 'POST',
      body: JSON.stringify({ imageId, scanType }),
    })
    return body.data
  },

  async cancelScan(id: string) {
    await apiRequest(`/api/v1/scans/${id}/cancel`, { method: 'POST' })
  },

  async getVulnerabilities(page = 1, limit = 20, severity?: string, search?: string) {
    const qs = `page=${page}&limit=${limit}${severity && severity !== 'all' ? `&severity=${severity.toUpperCase()}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    const body = await apiRequest<{ success: boolean; items: any[]; total: number; page: number; limit: number; totalPages: number }>(`/api/v1/vulnerabilities?${qs}`)
    return { items: body.items.map(transformVulnerability), total: body.total, page: body.page, limit: body.limit, totalPages: body.totalPages }
  },

  async getVulnerability(id: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/vulnerabilities/${id}`)
    return transformVulnerability(body.data)
  },

  async getVulnerabilityByCve(cveId: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/vulnerabilities/cve/${cveId}`)
    return transformVulnerability(body.data)
  },

  async getScanVulnerabilities(scanId: string) {
    const body = await apiRequest<{ success: boolean; data: { items: any[]; summary: any } }>(`/api/v1/vulnerabilities/scan/${scanId}`)
    return { items: body.data.items.map(transformVulnerability), summary: body.data.summary }
  },

  async getScanSbom(scanId: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/scans/${scanId}/sbom`)
    return body.data
  },

  async downloadScanSbom(scanId: string, format: string) {
    const res = await fetch(`${API_BASE}/api/v1/scans/${scanId}/sbom/download?format=${format}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbom-${scanId}.${format.toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async getScanPackages(scanId: string) {
    const body = await apiRequest<{ success: boolean; data: any[] }>(`/api/v1/scans/${scanId}/packages`)
    return body.data
  },

  async getSBOM(imageId?: string) {
    const body = await apiRequest<{ success: boolean; items: any[] }>(`/api/v1/sboms${imageId ? `?imageId=${imageId}` : ''}`)
    if (imageId) return body.items[0] as SBOMEntry
    return body.items as SBOMEntry[]
  },

  async createSBOM(imageId: string, format = 'CYCLONEDX') {
    const body = await apiRequest<{ success: boolean; data: { id: string } }>('/api/v1/sboms', {
      method: 'POST',
      body: JSON.stringify({ imageId, format }),
    })
    return body.data
  },

  async deleteSBOM(id: string) {
    await apiRequest(`/api/v1/sboms/${id}`, { method: 'DELETE' })
  },

  async getReports(page = 1, limit = 100) {
    const body = await apiRequest<{ success: boolean; items: any[]; total: number }>(`/api/v1/reports?page=${page}&limit=${limit}`)
    return { items: body.items.map(transformReport), total: body.total }
  },

  async createReport(title: string, format: string, scanId?: string, imageId?: string) {
    const body = await apiRequest<{ success: boolean; data: { id: string } }>('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({ title, format, scanId, imageId }),
    })
    return body.data
  },

  async downloadReportFile(reportId: string, filename: string) {
    const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  async getNotifications() {
    const body = await apiRequest<{ success: boolean; items: any[] }>('/api/v1/notifications')
    return body.items.map(transformNotification)
  },

  async markNotificationRead(id: string) {
    await apiRequest(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
  },

  async getUsers() {
    const body = await apiRequest<{ success: boolean; data: any[] }>('/api/v1/users')
    return body.data.map(transformUser)
  },

  async getCurrentUser() {
    const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/users/me')
    return transformUser(body.data)
  },

  async updateUser(id: string, data: Partial<User>) {
    await apiRequest(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteUser(id: string) {
    await apiRequest(`/api/v1/users/${id}`, { method: 'DELETE' })
  },

  async getApiKeys() {
    const body = await apiRequest<{ success: boolean; data: any[] }>('/api/v1/api-keys')
    return body.data
  },

  async createApiKey(name: string, permissions?: string[]) {
    const body = await apiRequest<{ success: boolean; data: { id: string; key: string } }>('/api/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    })
    return body.data
  },

  async deleteApiKey(id: string) {
    await apiRequest(`/api/v1/api-keys/${id}`, { method: 'DELETE' })
  },

  async updateProfile(name: string, email: string) {
    await apiRequest('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, email }),
    })
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiRequest('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  async getAuditLogs(page = 1, limit = 50) {
    const body = await apiRequest<{ success: boolean; items: any[]; total: number }>(`/api/v1/audit-logs?page=${page}&limit=${limit}`)
    return body
  },

  // ========== BLAST RADIUS ==========
  blastRadius: {
    findByCve: async (cveId: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/blast-radius/cve/${cveId}`);
      return body.data;
    },
    findByPackage: async (packageName: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/blast-radius/package/${encodeURIComponent(packageName)}`);
      return body.data;
    },
    bulkRescan: async (cveId: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/blast-radius/cve/${cveId}/rescan`, { method: 'POST' });
      return body.data;
    },
  },

  // ========== SCAN DIFF ==========
  scanDiff: {
    getDiff: async (scanId: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/scans/${scanId}/diff`);
      return body.data;
    },
    compareScans: async (scanA: string, scanB: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/scans/diff?scanA=${scanA}&scanB=${scanB}`);
      return body.data;
    },
  },

  // ========== ASSIGNMENTS ==========
  assignments: {
    create: async (data: { vulnerabilityId: string; assignedToId: string; notes?: string }) => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/assignments', { method: 'POST', body: JSON.stringify(data) });
      return body.data;
    },
    list: async (params?: { status?: string; assigneeId?: string; breached?: boolean; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.assigneeId) searchParams.set('assigneeId', params.assigneeId);
      if (params?.breached) searchParams.set('breached', 'true');
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const body = await apiRequest<{ success: boolean; data: any[]; total: number }>(`/api/v1/assignments${qs ? `?${qs}` : ''}`);
      return { items: body.data || [], total: body.total || 0 };
    },
    getById: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/assignments/${id}`);
      return body.data;
    },
    updateStatus: async (id: string, status: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/assignments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      return body.data;
    },
    complianceReport: async (dateFrom?: string, dateTo?: string) => {
      const searchParams = new URLSearchParams();
      if (dateFrom) searchParams.set('dateFrom', dateFrom);
      if (dateTo) searchParams.set('dateTo', dateTo);
      const qs = searchParams.toString();
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/assignments/compliance-report${qs ? `?${qs}` : ''}`);
      return body.data;
    },
  },

  // ========== EXCEPTIONS ==========
  exceptions: {
    create: async (data: { cveId: string; reason: string; expiresAt: string; imageId?: string; approvedById?: string }) => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/exceptions', { method: 'POST', body: JSON.stringify(data) });
      return body.data;
    },
    list: async (params?: { isActive?: boolean; cveId?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
      if (params?.cveId) searchParams.set('cveId', params.cveId);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const body = await apiRequest<{ success: boolean; data: any[]; total: number }>(`/api/v1/exceptions${qs ? `?${qs}` : ''}`);
      return { items: body.data || [], total: body.total || 0 };
    },
    getById: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/exceptions/${id}`);
      return body.data;
    },
    approve: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/exceptions/${id}/approve`, { method: 'POST' });
      return body.data;
    },
    revoke: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/exceptions/${id}/revoke`, { method: 'POST' });
      return body.data;
    },
  },

  // ========== POSTURE ==========
  posture: {
    orgTrend: async (dateFrom?: string, dateTo?: string) => {
      const searchParams = new URLSearchParams();
      if (dateFrom) searchParams.set('dateFrom', dateFrom);
      if (dateTo) searchParams.set('dateTo', dateTo);
      const qs = searchParams.toString();
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/posture/org${qs ? `?${qs}` : ''}`);
      return body.data;
    },
    imageHistory: async (imageId: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/posture/image/${imageId}`);
      return body.data;
    },
    leaderboard: async () => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/posture/leaderboard');
      return body.data;
    },
    weeklyDigest: async () => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/posture/weekly-digest');
      return body.data;
    },
  },

  // ========== POLICIES ==========
  policies: {
    create: async (data: any) => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/policies', { method: 'POST', body: JSON.stringify(data) });
      return body.data;
    },
    list: async () => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/policies');
      return body.data;
    },
    getById: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/policies/${id}`);
      return body.data;
    },
    update: async (id: string, data: any) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      return body.data;
    },
    delete: async (id: string) => {
      await apiRequest(`/api/v1/policies/${id}`, { method: 'DELETE' });
    },
    setDefault: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/policies/${id}/set-default`, { method: 'POST' });
      return body.data;
    },
    evaluate: async (imageId: string, policyId?: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(policyId ? `/api/v1/policies/${policyId}/evaluate/${imageId}` : `/api/v1/policies/evaluate/${imageId}`);
      return body.data;
    },
  },

  // ========== WEBHOOKS ==========
  webhooks: {
    create: async (data: { name: string; url: string; secret: string; events: string[] }) => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/webhooks', { method: 'POST', body: JSON.stringify(data) });
      return body.data;
    },
    list: async () => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/webhooks');
      return body.data;
    },
    getById: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/webhooks/${id}`);
      return body.data;
    },
    update: async (id: string, data: any) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      return body.data;
    },
    delete: async (id: string) => {
      await apiRequest(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
    },
    test: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      return body.data;
    },
  },

  // ========== LIVE SCANS ==========
  liveScans: {
    create: async (data: { imageRef: string; policyId?: string }) => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/live-scan', { method: 'POST', body: JSON.stringify(data) });
      return body.data;
    },
    getById: async (id: string) => {
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/live-scan/${id}`);
      return body.data;
    },
  },

  // ========== NVD WATCH ==========
  nvdWatch: {
    status: async () => {
      const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/nvd-watch/status');
      return body.data;
    },
    recent: async (params?: { processed?: boolean; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.processed !== undefined) searchParams.set('processed', String(params.processed));
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/nvd-watch/recent${qs ? `?${qs}` : ''}`);
      return body.data;
    },
  },
}
