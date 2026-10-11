import { CircleAlert, RotateCw } from 'lucide-react'
import Button from './Button'

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
      <CircleAlert size={28} className="text-error" />
      <p className="text-sm text-text-secondary">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RotateCw size={18} />
        إعادة المحاولة
      </Button>
    </div>
  )
}

export default ErrorState
