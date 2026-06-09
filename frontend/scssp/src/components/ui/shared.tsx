import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-[#080A14] p-1 border border-[#1C2150]', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === tab.id
              ? 'bg-[#00D4AA]/10 text-[#00D4AA] shadow-sm border border-[#00D4AA]/20'
              : 'text-[#5A6380] hover:text-[#9098B8]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-[#131736]', className)} />
}

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-3' }
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-[#1C2150] border-t-[#00D4AA]',
        sizes[size],
        className
      )}
    />
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[#5A6380]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#9098B8]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[#5A6380] max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00D4AA] to-[#059669] px-4 py-2 text-sm font-medium text-[#080A14] hover:from-[#05C091] hover:to-[#059669] transition-all duration-200 shadow-lg shadow-[#00D4AA]/15"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4757]/10">
        <svg className="h-6 w-6 text-[#FF4757]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#9098B8]">Error</h3>
      <p className="mt-2 text-sm text-[#5A6380]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#1C2150] bg-[#0D1022] px-4 py-2 text-sm font-medium text-[#9098B8] hover:text-[#EEF0F7] hover:bg-[#131736] transition-all duration-200"
        >
          Try again
        </button>
      )}
    </div>
  )
}

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

export function TableSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-[#1C2150]">
      <span className="text-sm text-[#5A6380]">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm rounded-md border border-[#1C2150] bg-[#0D1022] text-[#9098B8] hover:bg-[#131736] hover:text-[#EEF0F7] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm rounded-md border border-[#1C2150] bg-[#0D1022] text-[#9098B8] hover:bg-[#131736] hover:text-[#EEF0F7] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  )
}
