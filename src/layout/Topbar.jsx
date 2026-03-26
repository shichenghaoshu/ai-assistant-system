import { useLocation } from 'react-router-dom'

import { getRouteMeta, routeGroups } from '../routes/appRoutes.jsx'

function getRouteGroupLabel(pathname) {
  return routeGroups.find((group) => group.items.some((item) => item.path === pathname))?.label ?? '工作区'
}

function Topbar() {
  const location = useLocation()
  const route = getRouteMeta(location.pathname)
  const routeGroup = getRouteGroupLabel(location.pathname)
  const routeNote = route?.labels?.find((label) => label !== route?.title) ?? '当前页面已接入真实业务数据'

  return (
    <header className="topbar">
      <div className="topbar-context">
        <div className="topbar-kicker">{routeGroup}</div>
        <h1 className="topbar-title">{route?.title ?? '页面'}</h1>
        <p className="topbar-note">视图焦点：{routeNote}</p>
      </div>

      <div className="topbar-meta">
        <div className="topbar-meta-copy">
          <span className="topbar-meta-label">当前路径</span>
          <strong className="topbar-path">{route?.path ?? location.pathname}</strong>
        </div>
        {route?.inferred ? <span className="topbar-pill">待确认</span> : <span className="topbar-status">已接入</span>}
      </div>
    </header>
  )
}

export default Topbar
