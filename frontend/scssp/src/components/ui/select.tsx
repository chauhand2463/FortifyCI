import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, options, ...props }, ref) => (
  <select
    className={cn(
      'flex h-9 w-full rounded-lg border border-[#1C2150] bg-[#080A14] px-3 py-2 text-sm text-[#EEF0F7]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/20 focus-visible:border-[#00D4AA]/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all',
      className
    )}
    ref={ref}
    {...props}
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value} className="bg-[#080A14]">{opt.label}</option>
    ))}
  </select>
))
Select.displayName = 'Select'

export { Select }
