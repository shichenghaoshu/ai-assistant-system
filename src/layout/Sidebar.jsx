import { NavLink } from 'react-router-dom'

import { routeGroups } from '../routes/appRoutes.jsx'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark">小打卡</div>
        <div>
          <div className="sidebar-title">学习打卡助手</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {routeGroups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link${item.inferred ? ' nav-link-inferred' : ''}${isActive ? ' is-active' : ''}`
                    }
                  >
                    <span className="nav-link-title">{item.title}</span>
                    {item.inferred ? <span className="nav-link-badge">待确认</span> : null}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
      </nav>
    </aside>
  )
}

export default Sidebar
