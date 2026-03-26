import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="shell-main">
        <Topbar />
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
