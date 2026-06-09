import type {
  ContainerImage,
  Vulnerability,
  Scan,
  Package,
  License,
  Dependency,
  Report,
  Notification,
  ScanStatistics,
  User,
  ApiKey,
  SBOMEntry,
} from './index'

export const mockUser: User = {
  id: 'u-1',
  email: 'admin@scssp.io',
  name: 'Alex Chen',
  role: 'admin',
  permissions: [],
  avatar: null,
}

export const mockImages: ContainerImage[] = [
  { id: 'img-1', name: 'nginx', tag: '1.25-alpine', digest: 'sha256:a1b2c3d4...', size: '42.3 MB', status: 'vulnerable', vulnerabilities: { critical: 2, high: 5, medium: 12, low: 34 }, lastScanned: '2026-06-07T10:30:00Z', createdAt: '2026-05-01T08:00:00Z', registry: 'docker.io' },
  { id: 'img-2', name: 'node', tag: '20-slim', digest: 'sha256:e5f6g7h8...', size: '187.1 MB', status: 'vulnerable', vulnerabilities: { critical: 1, high: 8, medium: 23, low: 67 }, lastScanned: '2026-06-07T09:15:00Z', createdAt: '2026-04-15T12:00:00Z', registry: 'docker.io' },
  { id: 'img-3', name: 'python', tag: '3.12-slim', digest: 'sha256:i9j0k1l2...', size: '145.6 MB', status: 'scanning', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 }, lastScanned: '2026-06-08T06:00:00Z', createdAt: '2026-05-20T10:00:00Z', registry: 'docker.io' },
  { id: 'img-4', name: 'redis', tag: '7.2-alpine', digest: 'sha256:m3n4o5p6...', size: '12.8 MB', status: 'clean', vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3 }, lastScanned: '2026-06-06T14:00:00Z', createdAt: '2026-03-10T09:00:00Z', registry: 'docker.io' },
  { id: 'img-5', name: 'postgres', tag: '16', digest: 'sha256:q7r8s9t0...', size: '412.5 MB', status: 'vulnerable', vulnerabilities: { critical: 3, high: 12, medium: 28, low: 89 }, lastScanned: '2026-06-05T16:45:00Z', createdAt: '2026-04-01T11:00:00Z', registry: 'docker.io' },
  { id: 'img-6', name: 'alpine', tag: '3.19', digest: 'sha256:u1v2w3x4...', size: '7.8 MB', status: 'clean', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 1 }, lastScanned: '2026-06-08T05:00:00Z', createdAt: '2026-06-01T08:00:00Z', registry: 'docker.io' },
  { id: 'img-7', name: 'golang', tag: '1.22', digest: 'sha256:y5z6a7b8...', size: '825.3 MB', status: 'error', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 }, lastScanned: '2026-06-07T22:00:00Z', createdAt: '2026-05-10T07:00:00Z', registry: 'docker.io' },
  { id: 'img-8', name: 'ubuntu', tag: '24.04', digest: 'sha256:c9d0e1f2...', size: '78.9 MB', status: 'vulnerable', vulnerabilities: { critical: 4, high: 15, medium: 42, low: 156 }, lastScanned: '2026-06-06T08:30:00Z', createdAt: '2026-02-20T14:00:00Z', registry: 'docker.io' },
]

export const mockVulnerabilities: Vulnerability[] = [
  { id: 'vul-1', cveId: 'CVE-2026-12345', package: 'openssl', version: '1.1.1t', severity: 'critical', cvss: 9.8, description: 'Remote code execution in OpenSSL via crafted TLS handshake', fixVersion: '1.1.1u', publishedAt: '2026-05-15T00:00:00Z', isFixed: false, exploitAvailable: true },
  { id: 'vul-2', cveId: 'CVE-2026-23456', package: 'libcurl', version: '7.88.1', severity: 'critical', cvss: 9.1, description: 'Heap buffer overflow in HTTP/2 handling', fixVersion: '7.88.2', publishedAt: '2026-05-20T00:00:00Z', isFixed: false, exploitAvailable: true },
  { id: 'vul-3', cveId: 'CVE-2026-34567', package: 'zlib', version: '1.2.13', severity: 'high', cvss: 7.5, description: 'Denial of service via memory corruption in decompression', fixVersion: '1.3', publishedAt: '2026-04-10T00:00:00Z', isFixed: true, exploitAvailable: false },
  { id: 'vul-4', cveId: 'CVE-2026-45678', package: 'libxml2', version: '2.10.3', severity: 'high', cvss: 7.8, description: 'Use-after-free in XML document parsing', fixVersion: '2.10.4', publishedAt: '2026-05-01T00:00:00Z', isFixed: false, exploitAvailable: false },
  { id: 'vul-5', cveId: 'CVE-2026-56789', package: 'sqlite', version: '3.40.1', severity: 'medium', cvss: 6.5, description: 'Out-of-bounds read in SQL query processing', fixVersion: '3.41.0', publishedAt: '2026-03-22T00:00:00Z', isFixed: false, exploitAvailable: false },
  { id: 'vul-6', cveId: 'CVE-2026-67890', package: 'bash', version: '5.2.15', severity: 'high', cvss: 7.2, description: 'Command injection via specially crafted environment variables', fixVersion: '5.2.16', publishedAt: '2026-06-01T00:00:00Z', isFixed: false, exploitAvailable: true },
  { id: 'vul-7', cveId: 'CVE-2026-78901', package: 'python3', version: '3.11.5', severity: 'low', cvss: 3.4, description: 'Minor information disclosure in HTTP client', fixVersion: '3.11.6', publishedAt: '2026-02-14T00:00:00Z', isFixed: true, exploitAvailable: false },
  { id: 'vul-8', cveId: 'CVE-2026-89012', package: 'glibc', version: '2.37', severity: 'critical', cvss: 9.3, description: 'Buffer overflow in LD_PRELOAD handling', fixVersion: '2.38', publishedAt: '2026-05-28T00:00:00Z', isFixed: false, exploitAvailable: true },
  { id: 'vul-9', cveId: 'CVE-2026-90123', package: 'systemd', version: '252', severity: 'medium', cvss: 5.5, description: 'Local privilege escalation via timedated D-Bus interface', fixVersion: '253', publishedAt: '2026-04-05T00:00:00Z', isFixed: false, exploitAvailable: false },
  { id: 'vul-10', cveId: 'CVE-2026-01234', package: 'log4j', version: '2.20.0', severity: 'critical', cvss: 10.0, description: 'Remote code execution via JNDI lookup injection', fixVersion: '2.21.0', publishedAt: '2026-01-15T00:00:00Z', isFixed: true, exploitAvailable: true },
]

export const mockScans: Scan[] = [
  { id: 'scan-1', imageId: 'img-1', imageName: 'nginx:1.25-alpine', status: 'completed', progress: 100, totalVulnerabilities: 53, criticalCount: 2, highCount: 5, mediumCount: 12, lowCount: 34, startedAt: '2026-06-07T10:00:00Z', completedAt: '2026-06-07T10:30:00Z', duration: '30m 12s', scanner: 'Trivy v0.58.0' },
  { id: 'scan-2', imageId: 'img-2', imageName: 'node:20-slim', status: 'completed', progress: 100, totalVulnerabilities: 99, criticalCount: 1, highCount: 8, mediumCount: 23, lowCount: 67, startedAt: '2026-06-07T08:45:00Z', completedAt: '2026-06-07T09:15:00Z', duration: '30m 5s', scanner: 'Trivy v0.58.0' },
  { id: 'scan-3', imageId: 'img-3', imageName: 'python:3.12-slim', status: 'running', progress: 65, totalVulnerabilities: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, startedAt: '2026-06-08T06:00:00Z', completedAt: null, duration: null, scanner: 'Grype v0.82.0' },
  { id: 'scan-4', imageId: 'img-5', imageName: 'postgres:16', status: 'completed', progress: 100, totalVulnerabilities: 132, criticalCount: 3, highCount: 12, mediumCount: 28, lowCount: 89, startedAt: '2026-06-05T16:00:00Z', completedAt: '2026-06-05T16:45:00Z', duration: '45m 20s', scanner: 'Trivy v0.58.0' },
  { id: 'scan-5', imageId: 'img-4', imageName: 'redis:7.2-alpine', status: 'completed', progress: 100, totalVulnerabilities: 4, criticalCount: 0, highCount: 0, mediumCount: 1, lowCount: 3, startedAt: '2026-06-06T13:30:00Z', completedAt: '2026-06-06T14:00:00Z', duration: '30m 2s', scanner: 'Trivy v0.58.0' },
  { id: 'scan-6', imageId: 'img-8', imageName: 'ubuntu:24.04', status: 'completed', progress: 100, totalVulnerabilities: 217, criticalCount: 4, highCount: 15, mediumCount: 42, lowCount: 156, startedAt: '2026-06-06T07:45:00Z', completedAt: '2026-06-06T08:30:00Z', duration: '45m 15s', scanner: 'Grype v0.82.0' },
  { id: 'scan-7', imageId: 'img-7', imageName: 'golang:1.22', status: 'failed', progress: 23, totalVulnerabilities: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, startedAt: '2026-06-07T21:45:00Z', completedAt: '2026-06-07T22:00:00Z', duration: null, scanner: 'Trivy v0.58.0' },
]

export const mockSBOM: SBOMEntry = {
  id: 'sbom-1',
  imageId: 'img-1',
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  createdAt: '2026-06-07T10:31:00Z',
  packages: [
    { name: 'openssl', version: '1.1.1t', type: 'deb', license: 'OpenSSL', dependencies: 0, vulnerabilities: [mockVulnerabilities[0]] },
    { name: 'zlib', version: '1.2.13', type: 'deb', license: 'Zlib', dependencies: 0, vulnerabilities: [mockVulnerabilities[2]] },
    { name: 'libcurl', version: '7.88.1', type: 'deb', license: 'MIT', dependencies: 3, vulnerabilities: [mockVulnerabilities[1]] },
    { name: 'libxml2', version: '2.10.3', type: 'deb', license: 'MIT', dependencies: 1, vulnerabilities: [mockVulnerabilities[3]] },
    { name: 'bash', version: '5.2.15', type: 'deb', license: 'GPL-3.0', dependencies: 0, vulnerabilities: [mockVulnerabilities[5]] },
    { name: 'sqlite', version: '3.40.1', type: 'deb', license: 'Public Domain', dependencies: 0, vulnerabilities: [mockVulnerabilities[4]] },
    { name: 'nginx-core', version: '1.25.3', type: 'deb', license: 'BSD-2-Clause', dependencies: 12, vulnerabilities: [] },
    { name: 'libpcre3', version: '2:8.39-15', type: 'deb', license: 'BSD-3-Clause', dependencies: 0, vulnerabilities: [] },
    { name: 'libssl3', version: '3.0.12', type: 'deb', license: 'OpenSSL', dependencies: 1, vulnerabilities: [] },
    { name: 'ca-certificates', version: '20240203', type: 'deb', license: 'GPL-2.0', dependencies: 0, vulnerabilities: [] },
  ],
  licenses: [
    { name: 'MIT License', spdxId: 'MIT', packages: 2, risk: 'low' },
    { name: 'GNU General Public License v3.0', spdxId: 'GPL-3.0', packages: 1, risk: 'medium' },
    { name: 'GNU General Public License v2.0', spdxId: 'GPL-2.0', packages: 1, risk: 'medium' },
    { name: 'BSD 2-Clause License', spdxId: 'BSD-2-Clause', packages: 1, risk: 'low' },
    { name: 'BSD 3-Clause License', spdxId: 'BSD-3-Clause', packages: 1, risk: 'low' },
    { name: 'OpenSSL License', spdxId: 'OpenSSL', packages: 2, risk: 'low' },
    { name: 'Zlib License', spdxId: 'Zlib', packages: 1, risk: 'low' },
    { name: 'Public Domain', spdxId: 'Public-Domain', packages: 1, risk: 'low' },
  ],
  dependencies: [
    { packageName: 'nginx-core', version: '1.25.3', dependencies: ['libpcre3', 'libssl3', 'zlib'] },
    { packageName: 'libcurl', version: '7.88.1', dependencies: ['libssl3', 'zlib'] },
    { packageName: 'libssl3', version: '3.0.12', dependencies: ['openssl'] },
    { packageName: 'libxml2', version: '2.10.3', dependencies: ['zlib'] },
  ],
}

export const mockReports: Report[] = [
  { id: 'rpt-1', title: 'Weekly Vulnerability Summary', type: 'vulnerability', format: 'pdf', status: 'ready', createdAt: '2026-06-07T00:00:00Z', generatedAt: '2026-06-07T00:05:00Z', size: '2.4 MB', downloadUrl: '#' },
  { id: 'rpt-2', title: 'Compliance Audit — SOC 2', type: 'compliance', format: 'pdf', status: 'ready', createdAt: '2026-06-01T00:00:00Z', generatedAt: '2026-06-01T00:10:00Z', size: '4.8 MB', downloadUrl: '#' },
  { id: 'rpt-3', title: 'Container Security Posture Report', type: 'audit', format: 'json', status: 'generating', createdAt: '2026-06-08T00:00:00Z', generatedAt: null, size: null, downloadUrl: null },
  { id: 'rpt-4', title: 'Critical CVE Report — Q2 2026', type: 'vulnerability', format: 'csv', status: 'ready', createdAt: '2026-05-30T00:00:00Z', generatedAt: '2026-05-30T00:03:00Z', size: '856 KB', downloadUrl: '#' },
  { id: 'rpt-5', title: 'Image Inventory & License Compliance', type: 'custom', format: 'pdf', status: 'ready', createdAt: '2026-05-25T00:00:00Z', generatedAt: '2026-05-25T00:08:00Z', size: '3.1 MB', downloadUrl: '#' },
]

export const mockNotifications: Notification[] = [
  { id: 'not-1', type: 'critical_cve', title: 'Critical CVE Detected — CVE-2026-12345', message: 'OpenSSL remote code execution vulnerability found in 3 images', severity: 'critical', read: false, createdAt: '2026-06-08T06:15:00Z', link: '/vulnerabilities' },
  { id: 'not-2', type: 'scan_complete', title: 'Scan Complete — python:3.12-slim', message: 'Trivy scan finished with 0 critical, 0 high, 0 medium findings', severity: 'low', read: false, createdAt: '2026-06-08T06:00:00Z', link: '/scans/scan-3' },
  { id: 'not-3', type: 'scan_complete', title: 'Scan Complete — nginx:1.25-alpine', message: 'Trivy scan finished: 2 critical, 5 high, 12 medium findings', severity: 'high', read: true, createdAt: '2026-06-07T10:30:00Z', link: '/scans/scan-1' },
  { id: 'not-4', type: 'critical_cve', title: 'Critical CVE — CVE-2026-89012', message: 'glibc buffer overflow vulnerability affects 4 images', severity: 'critical', read: true, createdAt: '2026-06-07T09:00:00Z', link: '/vulnerabilities' },
  { id: 'not-5', type: 'policy_breach', title: 'Policy Breach — Unapproved Base Image', message: 'Image golang:1.22 uses base image not in allowed list', severity: 'medium', read: true, createdAt: '2026-06-07T08:00:00Z', link: '/images' },
  { id: 'not-6', type: 'system', title: 'Scanner Update Available', message: 'Grype v0.83.0 is available for upgrade', severity: 'low', read: true, createdAt: '2026-06-06T12:00:00Z', link: '/settings' },
]

export const mockApiKeys: ApiKey[] = [
  { id: 'ak-1', name: 'CI/CD Pipeline', key: 'sk-scssp-a1b2c3d4e5f6...', createdAt: '2026-05-01T00:00:00Z', lastUsed: '2026-06-08T05:30:00Z', permissions: ['scan:read', 'scan:write', 'images:read'] },
  { id: 'ak-2', name: 'Development', key: 'sk-scssp-g7h8i9j0k1l2...', createdAt: '2026-05-15T00:00:00Z', lastUsed: '2026-06-07T14:00:00Z', permissions: ['scan:read', 'images:read', 'reports:read'] },
  { id: 'ak-3', name: 'Monitoring Integration', key: 'sk-scssp-m3n4o5p6q7r8...', createdAt: '2026-06-01T00:00:00Z', lastUsed: null, permissions: ['scan:read', 'notifications:read'] },
]

export const mockStatistics: ScanStatistics = {
  totalImages: 8,
  scannedImages: 7,
  totalVulnerabilities: 505,
  criticalVulnerabilities: 10,
  highVulnerabilities: 40,
  mediumVulnerabilities: 106,
  lowVulnerabilities: 349,
  fixesAvailable: 86,
  imagesAtRisk: 4,
}

export const chartData = {
  vulnerabilitySeverity: [
    { name: 'Critical', value: 10, color: '#EF4444' },
    { name: 'High', value: 40, color: '#F59E0B' },
    { name: 'Medium', value: 106, color: '#3B82F6' },
    { name: 'Low', value: 349, color: '#6B7280' },
  ],
  scanTrend: [
    { date: 'Jun 2', scans: 4, vulnerabilities: 87 },
    { date: 'Jun 3', scans: 6, vulnerabilities: 134 },
    { date: 'Jun 4', scans: 3, vulnerabilities: 56 },
    { date: 'Jun 5', scans: 7, vulnerabilities: 215 },
    { date: 'Jun 6', scans: 5, vulnerabilities: 92 },
    { date: 'Jun 7', scans: 8, vulnerabilities: 267 },
    { date: 'Jun 8', scans: 2, vulnerabilities: 45 },
  ],
  monthlySecurity: [
    { month: 'Jan', critical: 12, high: 38, medium: 89, low: 245 },
    { month: 'Feb', critical: 8, high: 42, medium: 76, low: 198 },
    { month: 'Mar', critical: 15, high: 35, medium: 95, low: 267 },
    { month: 'Apr', critical: 10, high: 48, medium: 102, low: 289 },
    { month: 'May', critical: 14, high: 52, medium: 88, low: 312 },
    { month: 'Jun', critical: 10, high: 40, medium: 106, low: 349 },
  ],
}
