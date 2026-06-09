export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-500',
    running: 'bg-blue-500 animate-pulse',
    queued: 'bg-zinc-500',
    failed: 'bg-red-500',
    scanning: 'bg-blue-500 animate-pulse',
    clean: 'bg-emerald-500',
    vulnerable: 'bg-red-500',
    error: 'bg-red-500',
    ready: 'bg-emerald-500',
    generating: 'bg-amber-500 animate-pulse',
    active: 'bg-emerald-500',
    inactive: 'bg-zinc-500',
  }
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || 'bg-zinc-500'}`} />
  )
}
