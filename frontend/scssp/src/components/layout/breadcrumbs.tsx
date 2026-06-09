import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Breadcrumb } from '@/types'

interface BreadcrumbsProps {
  items: Breadcrumb[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-zinc-400 hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'text-white' : 'text-zinc-400')}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
