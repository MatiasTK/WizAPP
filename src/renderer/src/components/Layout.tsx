import Sidebar from '@components/ui/Sidebar'
import { ToastContainer } from '@components/ui/Toast'
import { Outlet } from 'react-router'

export default function Layout() {
  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="bg-main-bg text-white nonSelectable grow-1 pl-56 min-h-screen">
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  )
}
