import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

// RTL: "previous" points right and "next" points left
function Pagination({ page, lastPage, total, onPageChange }) {
  if (lastPage <= 1) return null

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        صفحة {page} من {lastPage} · الإجمالي: {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronRight size={18} />
          السابق
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= lastPage}>
          التالي
          <ChevronLeft size={18} />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
