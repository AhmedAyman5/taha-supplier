import { NavLink } from 'react-router'
import {
  Bell,
  FolderTree,
  Images,
  Layers,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Tag,
  Ticket,
  Users,
  X,
} from 'lucide-react'

// The ONLY place for nav links — add new pages here
const navItems = [
  { label: 'الرئيسية', path: '/', icon: LayoutDashboard },
  { label: 'الطلبات', path: '/orders', icon: ShoppingCart },
  { label: 'العملاء', path: '/customers', icon: Users },
  { label: 'الأقسام الرئيسية', path: '/categories', icon: FolderTree },
  { label: 'الأقسام الفرعية', path: '/sub-categories', icon: Layers },
  { label: 'العلامات التجارية', path: '/brands', icon: Tag },
  { label: 'المنتجات', path: '/products', icon: Package },
  { label: 'البنرات', path: '/banners', icon: Images },
  { label: 'الكوبونات', path: '/coupons', icon: Ticket },
  { label: 'الإشعارات', path: '/notifications', icon: Bell },
  { label: 'مناطق التوصيل', path: '/shipping-zones', icon: MapPin },
]

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}

      {/* RTL: the sidebar sits on the right, so translate-x-full hides it off the right edge */}
      <aside
        className={`fixed top-0 start-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col border-e border-border bg-surface transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border px-5">
          <span className="text-lg font-bold text-primary">طه للتوريدات</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="rounded-md p-1 text-text-secondary transition-colors duration-150 hover:bg-background lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-background hover:text-text'
                      }`
                    }
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
