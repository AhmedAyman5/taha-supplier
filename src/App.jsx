// TEMPORARY style check — replaced by the layout + routing in the next task
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-bold text-text">لوحة تحكم طه للتوريدات</h1>
        <p className="text-sm text-text-secondary">تجربة الخط والألوان</p>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-hover disabled:opacity-50"
        >
          زر تجريبي
        </button>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            نشط
          </span>
          <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            قيد المراجعة
          </span>
          <span className="inline-flex items-center rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
            ملغي
          </span>
          <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
            قيد التجهيز
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
