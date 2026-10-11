import { useNavigate } from 'react-router'
import { LogOut, Menu } from 'lucide-react'
import { DEV_SKIP_LOGIN, logout } from '../../services/auth'
import { getUser } from '../../services/authStorage'

function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const user = getUser() // null when there is no session (e.g. the dev login bypass)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between gap-3 border-b border-border bg-surface px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="rounded-md p-2 text-text-secondary transition-colors duration-150 hover:bg-background lg:hidden"
        >
          <Menu size={22} />
        </button>
        <span className="hidden text-sm text-text-secondary sm:inline">لوحة التحكم</span>
      </div>

      <div className="flex items-center gap-3">
        {DEV_SKIP_LOGIN && (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            وضع التطوير: الدخول بدون تسجيل
          </span>
        )}
        {user && <span className="hidden text-sm font-medium text-text md:inline">{user.name}</span>}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="تسجيل الخروج"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors duration-150 hover:bg-background sm:px-4"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar
