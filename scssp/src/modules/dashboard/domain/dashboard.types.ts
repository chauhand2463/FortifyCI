export interface DashboardStats {
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

export interface DashboardChartData {
  vulnerabilitySeverity: VulnerabilitySeverity[]
  scanTrend: ScanTrend[]
  monthlySecurity: MonthlySecurity[]
}

export interface DashboardResponse {
  stats: DashboardStats
  chartData: DashboardChartData
}
