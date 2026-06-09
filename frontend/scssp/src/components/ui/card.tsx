import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-[#1C2150] bg-[#0D1022]/60 backdrop-blur-sm', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('flex items-center justify-between px-6 py-4 border-b border-[#1C2150]', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>
}

export function CardDescription({ children, className }: CardProps) {
  return <p className={cn('text-sm text-[#5A6380]', className)}>{children}</p>
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={cn('flex items-center px-6 py-4 border-t border-[#1C2150]', className)}>{children}</div>
}
