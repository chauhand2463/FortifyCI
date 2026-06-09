import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-lg border border-[#1C2150] bg-[#080A14] px-3 py-2 text-sm text-[#EEF0F7] placeholder:text-[#5A6380]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/20 focus-visible:border-[#00D4AA]/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#EEF0F7]',
      'transition-all',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
