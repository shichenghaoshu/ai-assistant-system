import { useLocation } from 'react-router-dom'

import { getRouteMeta } from '../routes/appRoutes.jsx'

function Topbar() {
  const location = useLocation()
  const route = getRouteMeta(location.pathname)

  return (
    <header className="topbar">
      <div>
        <div className="topbar-kicker">小打卡</div>
        <h1 className="topbar-title">{route?.title ?? '页面'}</h1>
      </div>

      <div className="topbar-meta">
        <span>{route?.path ?? location.pathname}</span>
        {route?.inferred ? <span className="topbar-pill">待确认</span> : null}
      </div>
    </header>
  )
}

export default Topbar
