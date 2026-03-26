import { routeMap } from '../routes/appRoutes.jsx'

function RoutePage({ path }) {
  const meta = routeMap[path]

  if (!meta) {
    return (
      <section className="route-panel">
        <h1>未配置路由</h1>
        <p className="route-note">该路径还没有加入本地路由表。</p>
      </section>
    )
  }

  return (
    <section className="route-panel">
      <h1>{meta.title}</h1>
      <p className="route-note">{meta.path}</p>
      <div className="route-tags">
        {meta.labels.map((label) => (
          <span key={label} className="route-tag">
            {label}
          </span>
        ))}
        {meta.inferred ? <span className="route-tag route-tag-muted">待确认</span> : null}
      </div>
    </section>
  )
}

export default RoutePage
