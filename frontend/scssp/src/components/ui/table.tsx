import { type TableHTMLAttributes, forwardRef, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
))
Table.displayName = 'Table'

const TableHeader = forwardRef<HTMLTableSectionElement, TableHTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-[#1C2150]', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef<HTMLTableSectionElement, TableHTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-[#1C2150]/50', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableRow = forwardRef<HTMLTableRowElement, TableHTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('transition-colors hover:bg-[#131736]/50 data-[state=selected]:bg-[#131736]', className)} {...props} />
))
TableRow.displayName = 'TableRow'

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('h-10 px-4 text-left align-middle font-medium text-[#5A6380] text-xs uppercase tracking-wider', className)} {...props} />
))
TableHead.displayName = 'TableHead'

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle text-[#EEF0F7]', className)} {...props} />
))
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
