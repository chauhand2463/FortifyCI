import { Spinner } from '@/components/ui/shared'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}
