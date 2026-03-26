import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthSession } from './session.js'

function AuthGate() {
  const location = useLocation()
  const { loading, session } = useAuthSession()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>加载中...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default AuthGate
