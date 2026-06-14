export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'none'

export interface Vulnerability {
  id: string
  cveId: string
  package: string
  version: string
  severity: string
  cvss: number
  title?: string
  description?: string
  fixVersion?: string
  publishedAt?: string
  source: string
  exploitAvailable?: boolean
  epssScore?: number
  isFixed: boolean
  scanId: string
}

export interface ContainerImage {
  id: string
  name: string
  tag: string
  digest: string
  size: string
  status: 'scanning' | 'clean' | 'vulnerable' | 'error'
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  lastScanned: string
  createdAt: string
  updatedAt: string
  registry: string
  repository: string
  architecture: string | null
  os: string | null
  mediaType: string | null
  isSigned: boolean
  labels: Record<string, string> | null
}

export interface ImageDetail {
  id: string
  name: string
  tag: string
  digest: string | null
  registry: string
  repository: string
  architecture: string | null
  os: string | null
  size: string | null
  mediaType: string | null
  isSigned: boolean
  lastScanStatus: string
  lastScanId?: string
  vulnerabilitySummary: { critical: number; high: number; medium: number; low: number; unknown: number }
  createdAt: string
  updatedAt: string
}

export interface Scan {
  id: string
  imageId: string
  imageName: string
  scanType: string
  status: string
  progress: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  retryCount: number
  maxRetries: number
  vulnerabilitiesCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  createdAt: string
  updatedAt: string
}

export interface SbomPackage {
  id: string
  name: string
  version: string
  ecosystem: string
  purl?: string
  scanId: string
  createdAt: string
}

export interface Report {
  id: string
  title: string
  type?: string
  format: string
  status: string
  filePath?: string
  fileSize?: number
  size?: string
  generatedAt?: string
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  channel: string
  subject: string
  body: string
  title?: string
  message?: string
  severity?: string
  isRead: boolean
  sentAt?: string
  createdAt: string
}

export interface ScanStatistics {
  totalImages: number
  scannedImages: number
  totalVulnerabilities: number
  criticalVulnerabilities: number
  highVulnerabilities: number
  mediumVulnerabilities: number
  lowVulnerabilities: number
  fixesAvailable: number
  imagesAtRisk: number
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  avatar: string | null
}

export interface VulnerabilitySeverity {
  name: string
  value: number
  color: string
}

export interface ScanTrend {
  date: string
  scans: number
  vulnerabilities: number
}

export interface MonthlySecurity {
  month: string
  critical: number
  high: number
  medium: number
  low: number
}

export interface SbomPackageItem {
  name: string
  version: string
  type: string
  license?: string
  purl?: string
  dependencies: string[]
  vulnerabilities?: { id?: string; cveId: string; severity: string }[]
}

export interface SbomLicense {
  spdxId: string
  name: string
  packages: number
  risk: string
}

export interface SbomDependency {
  packageName: string
  version: string
  dependencies: string[]
}

export interface SBOMEntry {
  id: string
  imageId: string
  bomFormat: string
  specVersion: string
  packages: SbomPackageItem[]
  licenses: SbomLicense[]
  dependencies: SbomDependency[]
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
  permissions: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Breadcrumb {
  label: string
  href?: string
}

// ========== V2.0 TYPES ==========

export interface VulnerabilityAssignment {
  id: string
  vulnerabilityId: string
  vulnerability?: Vulnerability
  assignedTo: { id: string; name: string; email: string }
  assignedBy: { id: string; name: string }
  notes?: string
  status: string
  slaBreachedAt?: string
  slaDeadline?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface VulnerabilityException {
  id: string
  cveId: string
  vulnerability?: Vulnerability
  reason: string
  status: string
  createdBy: { id: string; name: string }
  approvedBy?: { id: string; name: string }
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ScanPolicy {
  id: string
  name: string
  description?: string
  rules: {
    severityThreshold: 'critical' | 'high' | 'medium' | 'low'
    maxCount: number
    action: 'block' | 'warn'
  }[]
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt?: string
  lastSuccessAt?: string
  lastFailureAt?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: string
  status: string
  statusCode?: number
  responseBody?: string
  duration?: number
  attempt: number
  createdAt: string
}

export interface CveWatchEntry {
  id: string
  cveId: string
  cvssScore?: number
  severity?: string
  description?: string
  affectedPackages?: string[]
  isProcessed: boolean
  relatedScans?: string[]
  createdAt: string
  processedAt?: string
}

export interface PostureSnapshot {
  id: string
  imageId: string
  imageName: string
  score: number
  vulnerabilitiesCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  fixesAvailable: number
  scannedAt: string
}

export interface ScanDiff {
  id: string
  scanId: string
  baselineScanId?: string
  vulnerabilitiesAdded: number
  vulnerabilitiesRemoved: number
  severityShift: { critical: number; high: number; medium: number; low: number }
  newCves: { cveId: string; severity: string; package: string }[]
  fixedCves: { cveId: string; severity: string; package: string }[]
  regressionDetected: boolean
  createdAt: string
}

export interface LiveScan {
  id: string
  imageRef: string
  status: string
  policyId?: string
  policyResult?: { action: 'pass' | 'block' | 'warn'; blockingCves: string[] }
  downloadUrl?: string
  errorMessage?: string
  progress: number
  createdAt: string
  completedAt?: string
}

export interface PostureTrend {
  date: string
  score: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface LeaderboardEntry {
  imageId: string
  imageName: string
  score: number
  trend: 'up' | 'down' | 'stable'
}

export interface ComplianceReport {
  totalAssignments: number
  resolvedAssignments: number
  overdueAssignments: number
  slaComplianceRate: number
  averageResolutionTime: number
  assigneeBreakdown: { name: string; assigned: number; resolved: number; overdue: number }[]
}
