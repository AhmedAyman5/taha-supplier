import { Menu } from 'lucide-react'

function Topbar({ onMenuClick }) {
  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border bg-surface px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background lg:hidden"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm text-text-secondary">لوحة التحكم</span>
      </div>

      {/* The auth task adds the admin name + logout here */}
      <div className="flex items-center gap-3"></div>
    </header>
  )
}

export default Topbar
