import type { ContainerImage, Scan, Vulnerability, Report, Notification, ScanStatistics, SBOMEntry, PaginatedResponse, User } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth-store')
    if (!raw) return null
    return JSON.parse(raw)?.state?.token || null
  } catch {
    return null
  }
}

function setToken(token: string): void {
  try {
    const raw = localStorage.getItem('auth-store')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) {
        parsed.state.token = token
        localStorage.setItem('auth-store', JSON.stringify(parsed))
      }
    }
  } catch {}
}

async function apiRequest<T = any>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getToken()
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
    if (res.status === 401 && retry) {
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (refreshRes.ok) {
          const refreshBody = await refreshRes.json()
          if (refreshBody.success && refreshBody.data?.accessToken) {
            setToken(refreshBody.data.accessToken)
            return apiRequest<T>(path, options, false)
          }
        }
      } catch {}
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    const message = body?.error?.message || (res.status === 403 ? 'You do not have permission to perform this action. Contact your admin.' : `Request failed: ${res.status}`)
    throw new Error(message)
  }

  if (body.success !== undefined && !body.success) {
    throw new Error(body?.error?.message || 'Request failed')
  }

  return body as T
}

function toLowerSeverity(s: string): string {
  if (s === 'NONE') return 'none'
  return s.toLowerCase()
}

function toLowerStatus(s: string): string {
  return s.toLowerCase()
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

function computeDuration(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt || !completedAt) return null
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (diffMs < 0) return null
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return `${mins}m ${secs}s`
}

interface BackendScan {
  id: string
  imageId: string
  imageName: string
  scanType: string
  status: string
  progress: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  retryCount: number
  maxRetries: number
  metadata: Record<string, unknown> | null
  vulnerabilitiesCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  createdAt: string
  updatedAt: string
}

interface BackendImage {
  id: string
  name: string
  tag: string
  digest: string | null
  registry: string
  repository: string
  architecture: string | null
  os: string | null
  size: number | null
  mediaType: string | null
  isSigned: boolean
  labels: Record<string, unknown> | null
  userId: string
  createdAt: string
  updatedAt: string
}

function transformImage(img: BackendImage, scans: BackendScan[]): ContainerImage {
  const imageScans = scans.filter(s => s.imageId === img.id)
  const latestScan = imageScans.length > 0
    ? imageScans.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
    : null

  let status: ContainerImage['status'] = 'clean'
  if (latestScan) {
    const s = latestScan.status.toUpperCase()
    if (s === 'COMPLETED') {
      status = latestScan.vulnerabilitiesCount > 0 ? 'vulnerable' : 'clean'
    } else if (['RUNNING', 'QUEUED', 'PENDING'].includes(s)) {
      status = 'scanning'
    } else if (['FAILED', 'CANCELLED', 'TIMEOUT'].includes(s)) {
      status = 'error'
    }
  }

  return {
    id: img.id,
    name: img.name,
    tag: img.tag,
    digest: img.digest || '',
    size: formatBytes(img.size),
    status,
    vulnerabilities: {
      critical: latestScan?.criticalCount ?? 0,
      high: latestScan?.highCount ?? 0,
      medium: latestScan?.mediumCount ?? 0,
      low: latestScan?.lowCount ?? 0,
    },
    lastScanned: latestScan?.completedAt || latestScan?.createdAt || '',
    createdAt: img.createdAt,
    registry: img.registry,
  }
}

function transformScan(s: BackendScan): Scan {
  return {
    id: s.id,
    imageId: s.imageId,
    imageName: s.imageName,
    status: toLowerStatus(s.status) as Scan['status'],
    progress: s.progress,
    totalVulnerabilities: s.vulnerabilitiesCount,
    criticalCount: s.criticalCount ?? 0,
    highCount: s.highCount ?? 0,
    mediumCount: s.mediumCount ?? 0,
    lowCount: s.lowCount ?? 0,
    startedAt: s.startedAt || '',
    completedAt: s.completedAt,
    duration: computeDuration(s.startedAt, s.completedAt),
    scanner: `${s.scanType} v${(s.metadata as any)?.version || ''}`.trim() || s.scanType,
  }
}

function transformVulnerability(v: any): Vulnerability {
  return {
    id: v.id,
    cveId: v.vulnerabilityId || v.cveId || '',
    package: v.packageName || v.package || '',
    version: v.packageVersion || v.version || '',
    severity: toLowerSeverity(v.severity) as Vulnerability['severity'],
    cvss: v.cvssScore ?? v.cvss ?? 0,
    description: v.description || v.title || '',
    fixVersion: v.fixedVersion || null,
    publishedAt: v.publishedDate || v.publishedAt || v.createdAt || '',
    isFixed: v.fixedVersion != null,
    exploitAvailable: v.exploitAvailable ?? false,
  }
}

function transformNotification(n: any): Notification {
  return {
    id: n.id,
    type: (n.type?.toLowerCase() === 'scan_completed' ? 'scan_complete' : n.type?.toLowerCase()) as Notification['type'],
    title: n.subject || n.title || '',
    message: n.body || n.message || '',
    severity: (n.metadata?.severity || 'low').toLowerCase() as Notification['severity'],
    read: n.isRead ?? n.read ?? false,
    createdAt: n.createdAt || n.sentAt || '',
    link: n.metadata?.link || null,
  }
}

function transformReport(r: any): Report {
  return {
    id: r.id,
    title: r.title,
    type: (r.parameters?.type || (r.format === 'pdf' ? 'vulnerability' : 'custom')) as Report['type'],
    format: r.format?.toLowerCase() as Report['format'],
    status: r.status?.toLowerCase() as Report['status'],
    createdAt: r.createdAt,
    generatedAt: r.generatedAt || null,
    size: r.fileSize ? formatBytes(r.fileSize) : null,
    downloadUrl: r.filePath ? `/api/v1/reports/${r.id}/download` : null,
  }
}

function transformUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.username || u.name || '',
    role: (u.role?.name?.toLowerCase() === 'super_admin' || u.role?.name?.toLowerCase() === 'admin'
      ? 'admin'
      : u.role?.name?.toLowerCase() === 'developer'
        ? 'developer'
        : 'viewer') as User['role'],
    permissions: u.permissions || [],
    avatar: null,
  }
}

let scansCache: BackendScan[] = []

export const services = {
  async logout() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' }, false)
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-store')
    }
  },

  async registerImage(name: string, tag: string, registry: string, repository: string) {
    const body = await apiRequest<{ success: boolean; data: { id: string } }>('/api/v1/images', {
      method: 'POST',
      body: JSON.stringify({ name, tag, registry, repository }),
    })
    return body.data
  },

  async createScan(imageId: string, scanType = 'trivy') {
    const body = await apiRequest<{ success: boolean; data: { id: string; status: string } }>('/api/v1/scans', {
      method: 'POST',
      body: JSON.stringify({ imageId, scanType }),
    })
    return body.data
  },

  async login(email: string, password: string) {
    const body = await apiRequest<{ success: boolean; data: { accessToken: string; expiresIn: number; user: any } }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false)
    const user = transformUser(body.data.user)
    return { token: body.data.accessToken, user }
  },

  async register(email: string, name: string, password: string) {
    const body = await apiRequest<{ success: boolean; data: { accessToken: string; expiresIn: number; user: any } }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username: name, password }),
    }, false)
    const user = transformUser(body.data.user)
    return { token: body.data.accessToken, user }
  },

  async forgotPassword(email: string) {
    const body = await apiRequest<{ success: boolean; message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false)
    return { message: body.message || 'Password reset link sent to your email' }
  },

  async resetPassword(token: string, password: string) {
    const body = await apiRequest<{ success: boolean; message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }, false)
    return { message: body.message || 'Password reset successfully' }
  },

  async getStatistics() {
    // Check if we have a dashboard endpoint
    try {
      const body = await apiRequest<{ success: boolean; data: { stats: ScanStatistics } }>('/api/v1/dashboard')
      return body.data.stats
    } catch {
      // Fallback: aggregate from images and scans
      const [imgBody, scansBody] = await Promise.all([
        apiRequest<{ success: boolean; items: any[]; total: number }>('/api/v1/images?limit=10000'),
        apiRequest<{ success: boolean; items: BackendScan[] }>('/api/v1/scans?limit=10000').catch(() => ({ success: false, items: [] })),
      ])

      const scans = (scansBody as any)?.items || []
      const images = imgBody.items || []
      const totalVulns = scans.reduce((sum: number, s: BackendScan) => sum + (s.vulnerabilitiesCount || 0), 0)
      const criticalVulns = scans.reduce((sum: number, s: BackendScan) => sum + (s.criticalCount || 0), 0)
      const highVulns = scans.reduce((sum: number, s: BackendScan) => sum + (s.highCount || 0), 0)
      const mediumVulns = scans.reduce((sum: number, s: BackendScan) => sum + (s.mediumCount || 0), 0)
      const lowVulns = scans.reduce((sum: number, s: BackendScan) => sum + (s.lowCount || 0), 0)
      const scannedImages = scans.filter((s: BackendScan) => s.status === 'COMPLETED').length
        ? [...new Set(scans.filter((s: BackendScan) => s.status === 'COMPLETED').map((s: BackendScan) => s.imageId))].length
        : 0
      const imagesAtRisk = scans.filter((s: BackendScan) => s.criticalCount > 0 || s.highCount > 0).length
        ? [...new Set(scans.filter((s: BackendScan) => s.criticalCount > 0 || s.highCount > 0).map((s: BackendScan) => s.imageId))].length
        : 0

      return {
        totalImages: images.length,
        scannedImages,
        totalVulnerabilities: totalVulns,
        criticalVulnerabilities: criticalVulns,
        highVulnerabilities: highVulns,
        mediumVulnerabilities: mediumVulns,
        lowVulnerabilities: lowVulns,
        fixesAvailable: totalVulns,
        imagesAtRisk,
      }
    }
  },

  async getImages(page = 1, pageSize = 10, search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (search) params.set('search', search)

    const [imgBody, scansBody] = await Promise.all([
      apiRequest<{ success: boolean; items: BackendImage[]; total: number; page: number; limit: number; totalPages: number }>(`/api/v1/images?${params}`),
      apiRequest<{ success: boolean; items: BackendScan[] }>(`/api/v1/scans?limit=10000`).catch(() => ({ success: false, items: [] })),
    ])

    scansCache = (scansBody as any)?.items || scansCache

    const data = imgBody.items.map(img => transformImage(img, scansCache))

    return {
      data,
      total: imgBody.total || 0,
      page: imgBody.page || page,
      pageSize: imgBody.limit || pageSize,
      totalPages: imgBody.totalPages || Math.ceil((imgBody.total || 0) / pageSize),
    }
  },

  async getScans(page = 1, pageSize = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    const body = await apiRequest<{ success: boolean; items: BackendScan[]; total: number; page: number; limit: number; totalPages: number }>(`/api/v1/scans?${params}`)

    scansCache = body.items

    const data = body.items.map(transformScan)

    return {
      data,
      total: body.total || 0,
      page: body.page || page,
      pageSize: body.limit || pageSize,
      totalPages: body.totalPages || Math.ceil((body.total || 0) / pageSize),
    }
  },

  async getImageById(id: string) {
    const body = await apiRequest<{ success: boolean; data: BackendImage }>(`/api/v1/images/${id}`)
    const scansBody = await apiRequest<{ success: boolean; items: BackendScan[] }>(`/api/v1/scans?limit=10000`).catch(() => ({ success: true, items: [] }))
    return transformImage(body.data, scansBody.items || [])
  },

  async getScansByImageId(imageId: string) {
    const body = await apiRequest<{ success: boolean; items: BackendScan[] }>(`/api/v1/scans?limit=100`)
    const filtered = (body.items || []).filter(s => s.imageId === imageId)
    return filtered.map(transformScan)
  },

  async getScanById(id: string) {
    const body = await apiRequest<{ success: boolean; data: BackendScan }>(`/api/v1/scans/${id}`)
    return transformScan(body.data)
  },

  async getVulnerabilities(page = 1, pageSize = 10, severity?: string, search = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (severity && severity !== 'all') params.set('severity', severity.toUpperCase())
    if (search) params.set('search', search)

    const body = await apiRequest<any>(`/api/v1/vulnerabilities?${params}`)

    const items: any[] = body.items || []
    const data = items.map(transformVulnerability)

    return {
      data,
      total: body.total || 0,
      page: body.page || page,
      pageSize: body.limit || pageSize,
      totalPages: body.totalPages || Math.ceil((body.total || 0) / pageSize),
    }
  },

  async getVulnerabilityById(id: string) {
    const body = await apiRequest<{ success: boolean; data: any }>(`/api/v1/vulnerabilities/${id}`)
    return transformVulnerability(body.data)
  },

  async getSBOM(imageId: string) {
    try {
      const body = await apiRequest<{ success: boolean; items: any[] }>(`/api/v1/sboms?limit=1&imageId=${encodeURIComponent(imageId)}`)
      const sbom = (body.items || [])[0]
      if (!sbom) {
        return {
          id: '',
          imageId,
          bomFormat: 'CycloneDX',
          specVersion: '1.5',
          createdAt: new Date().toISOString(),
          packages: [],
          licenses: [],
          dependencies: [],
        } as SBOMEntry
      }
      return {
        id: sbom.id,
        imageId: sbom.imageId,
        bomFormat: sbom.format || sbom.bomFormat || 'CycloneDX',
        specVersion: sbom.specVersion || '1.5',
        createdAt: sbom.createdAt,
        packages: (sbom.content?.packages || sbom.packages || []).map((p: any) => ({
          name: p.name || p.packageName || '',
          version: p.version || '',
          type: p.type || p.packageType || 'deb',
          license: p.license || 'Unknown',
          dependencies: p.dependencies?.length || 0,
          vulnerabilities: (p.vulnerabilities || []).map(transformVulnerability),
        })),
        licenses: (sbom.content?.licenses || sbom.licenses || []).map((l: any) => ({
          name: l.name || '',
          spdxId: l.spdxId || 'Unknown',
          packages: l.packages || l.packageCount || 0,
          risk: l.risk || 'unknown',
        })),
        dependencies: (sbom.content?.dependencies || sbom.dependencies || []).map((d: any) => ({
          packageName: d.packageName || d.name || '',
          version: d.version || '',
          dependencies: d.dependencies || [],
        })),
      } as SBOMEntry
    } catch {
      return {
        id: '',
        imageId,
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        createdAt: new Date().toISOString(),
        packages: [],
        licenses: [],
        dependencies: [],
      } as SBOMEntry
    }
  },

  async getReports() {
    const body = await apiRequest<{ success: boolean; items: any[] }>('/api/v1/reports?limit=100')
    return (body.items || []).map(transformReport)
  },

  async generateReport(type: string, format: string) {
    const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: `Custom ${type} Report`,
        format: format.toUpperCase(),
        parameters: { type },
      }),
    })
    return transformReport(body.data)
  },

  async getNotifications() {
    const body = await apiRequest<{ success: boolean; items: any[] }>('/api/v1/notifications?limit=100')
    return (body.items || []).map(transformNotification)
  },

  async markNotificationRead(id: string) {
    await apiRequest(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
    return true
  },

  async createApiKey(name: string, permissions: string[] = []) {
    const body = await apiRequest<{ success: boolean; data: { id: string; name: string; keyPrefix: string; key: string; permissions: string[]; createdAt: string } }>('/api/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    })
    return body.data
  },

  async getApiKeys() {
    const body = await apiRequest<{ success: boolean; items: Array<{ id: string; name: string; keyPrefix: string; permissions: string[]; lastUsedAt: string | null; createdAt: string }> }>('/api/v1/api-keys?limit=100')
    return body.items || []
  },

  async deleteApiKey(id: string) {
    await apiRequest(`/api/v1/api-keys/${id}`, { method: 'DELETE' })
    return true
  },

  async updateProfile(name: string, email: string) {
    const body = await apiRequest<{ success: boolean; data: any }>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: name, email }),
    })
    return body.data
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const body = await apiRequest<{ success: boolean; message: string }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return body.message
  },

  async getChartData(): Promise<{ vulnerabilitySeverity: Array<{ name: string; value: number; color: string }>; scanTrend: Array<{ date: string; scans: number; vulnerabilities: number }>; monthlySecurity: Array<{ month: string; critical: number; high: number; medium: number; low: number }> }> {
    try {
      const body = await apiRequest<{ success: boolean; data: { stats: any; chartData: { vulnerabilitySeverity: Array<{ name: string; value: number; color: string }>; scanTrend: Array<{ date: string; scans: number; vulnerabilities: number }>; monthlySecurity: Array<{ month: string; critical: number; high: number; medium: number; low: number }> } } }>('/api/v1/dashboard')
      return body.data.chartData
    } catch {
      return {
        vulnerabilitySeverity: [],
        scanTrend: [],
        monthlySecurity: [],
      }
    }
  },
}
