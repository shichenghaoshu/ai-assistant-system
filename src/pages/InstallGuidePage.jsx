import { useAuthSession } from '../auth/session.js'
import { useInstallGuidePageData } from '../features/system-tools/useInstallGuidePageData.js'
import '../styles/system-tools.css'

function InstallGuidePage() {
  const { loading: authLoading } = useAuthSession()
  const { loading, error, canInstall, installLabel, banner, install } = useInstallGuidePageData()

  const isLoading = authLoading || loading

  return (
    <section className="route-panel app-page system-tools-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">System Tools</div>
          <h2 className="page-title">安装应用到桌面</h2>
        </div>
        <p className="page-note">提供浏览器安装提示和手动安装步骤。支持时可以直接触发安装流程。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">获取安装指引失败，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          {banner ? (
            <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div>
          ) : null}

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Install</span>
              <h3>安装入口</h3>
            </div>

            <div className="system-tool-note">
              <span>当前状态</span>
              <strong>{canInstall ? '可直接安装' : '请使用浏览器菜单安装'}</strong>
            </div>

            <div className="rewards-action-row">
              <button className="primary-button" type="button" disabled={!canInstall} onClick={install}>
                {installLabel}
              </button>
            </div>
          </article>

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Guide</span>
              <h3>手动安装步骤</h3>
            </div>

            <ol className="system-tool-steps">
              <li>在 Chrome 或 Edge 中打开当前站点。</li>
              <li>点击浏览器菜单里的“安装应用”或“添加到桌面”。</li>
              <li>确认后即可像桌面应用一样启动。</li>
            </ol>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default InstallGuidePage
