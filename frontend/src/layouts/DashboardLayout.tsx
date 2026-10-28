
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import MobileNav from '../components/dashboard/MobileNav'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#10120f] text-[#f4f5f0]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
