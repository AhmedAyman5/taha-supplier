import { LoaderCircle } from 'lucide-react'

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface p-10 text-sm text-text-secondary">
      <LoaderCircle size={20} className="animate-spin text-primary" />
      جاري تحميل البيانات...
    </div>
  )
}

export default LoadingState
