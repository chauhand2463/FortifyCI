import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A14] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#00D4AA] to-[#059669] text-[#080A14] hover:from-[#05C091] hover:to-[#059669] shadow-lg shadow-[#00D4AA]/15',
        destructive: 'bg-[#FF4757] text-white hover:bg-[#FF4757]/90 shadow-sm',
        success: 'bg-[#00D4AA] text-[#080A14] hover:bg-[#05C091] shadow-sm',
        outline: 'border border-[#1C2150] bg-transparent text-[#9098B8] hover:text-[#EEF0F7] hover:bg-[#0D1022] hover:border-[#252A5A]',
        secondary: 'bg-[#0D1022] text-[#9098B8] hover:text-[#EEF0F7] hover:bg-[#131736] border border-[#1C2150]',
        ghost: 'text-[#5A6380] hover:text-[#EEF0F7] hover:bg-[#0D1022]',
        link: 'text-[#00D4AA] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
