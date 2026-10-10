import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function DashboardLayout() {
  // Only matters on small screens — on lg: the sidebar is always visible
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
