import { Link } from 'react-router'

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-xl font-bold text-text">الصفحة غير موجودة</h1>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-hover"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}

export default NotFound
