export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'none'

export interface Vulnerability {
  id: string
  cveId: string
  package: string
  version: string
  severity: Severity
  cvss: number
  description: string
  fixVersion: string | null
  publishedAt: string
  isFixed: boolean
  exploitAvailable: boolean
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
  labels: Record<string, unknown> | null
  manifest: Record<string, unknown> | null
  config: Record<string, unknown> | null
  signatureInfo: Record<string, unknown> | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Scan {
  id: string
  imageId: string
  imageName: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  totalVulnerabilities: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  startedAt: string
  completedAt: string | null
  duration: string | null
  scanner: string
}

export interface Package {
  name: string
  version: string
  type: 'npm' | 'pip' | 'maven' | 'go' | 'deb' | 'apk' | 'rpm'
  license: string
  dependencies: number
  vulnerabilities: Vulnerability[]
}

export interface License {
  name: string
  spdxId: string
  packages: number
  risk: 'high' | 'medium' | 'low' | 'unknown'
}

export interface SBOMEntry {
  id: string
  imageId: string
  bomFormat: string
  specVersion: string
  createdAt: string
  packages: Package[]
  licenses: License[]
  dependencies: Dependency[]
}

export interface Dependency {
  packageName: string
  version: string
  dependencies: string[]
}

export interface Report {
  id: string
  title: string
  type: 'vulnerability' | 'compliance' | 'audit' | 'custom'
  format: 'pdf' | 'csv' | 'json'
  status: 'generating' | 'ready' | 'failed'
  createdAt: string
  generatedAt: string | null
  size: string | null
  downloadUrl: string | null
}

export interface Notification {
  id: string
  type: 'scan_complete' | 'critical_cve' | 'policy_breach' | 'system'
  title: string
  message: string
  severity: Severity
  read: boolean
  createdAt: string
  link: string | null
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
  role: 'admin' | 'viewer' | 'developer'
  permissions: string[]
  avatar: string | null
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
