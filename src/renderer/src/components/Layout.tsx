import { Outlet } from 'react-router'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex w-full">
      <Sidebar />

      <main className="bg-main-bg text-white nonSelectable grow-1 pl-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
