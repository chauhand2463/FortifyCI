import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[#131736] text-[#9098B8] border-[#1C2150]',
    success: 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20',
    warning: 'bg-[#FFA502]/10 text-[#FFA502] border-[#FFA502]/20',
    danger: 'bg-[#FF4757]/10 text-[#FF4757] border-[#FF4757]/20',
    info: 'bg-[#4DA6FF]/10 text-[#4DA6FF] border-[#4DA6FF]/20',
    outline: 'bg-transparent text-[#5A6380] border-[#1C2150]',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
