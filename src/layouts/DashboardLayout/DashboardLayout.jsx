import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function DashboardLayout() {
  // Only matters on small screens — on lg: the sidebar is always visible
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // print: variants — the fixed-height, scrolling layout would clip a printed page to what is visible
  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
