import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const now = new Date()
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#EF4444'
    case 'high': return '#F59E0B'
    case 'medium': return '#3B82F6'
    case 'low': return '#6B7280'
    case 'none': return '#22C55E'
    default: return '#6B7280'
  }
}

export function severityBgClass(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'low': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    case 'none': return 'bg-green-500/10 text-green-400 border-green-500/20'
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }
}

export function truncate(str: string, len = 40): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}
