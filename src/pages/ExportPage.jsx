import { useAuthSession } from '../auth/session.js'
import { useExportPageData } from '../features/system-tools/useExportPageData.js'
import '../styles/system-tools.css'

function ExportPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, snapshot, counts, downloadExport } = useExportPageData(
    session?.user?.id,
    session?.user?.email ?? '',
  )

  const isLoading = authLoading || loading

  return (
    <section className="route-panel app-page system-tools-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">System Tools</div>
          <h2 className="page-title">数据导出</h2>
        </div>
        <p className="page-note">导出的是当前账号与当前档案的真实快照，文件内容直接来自 Supabase 数据。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">获取导出数据失败，请稍后重试。</div> : null}

      {!isLoading && !error && currentProfile ? (
        <div className="page-stack">
          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Snapshot</span>
              <h3>导出快照</h3>
            </div>

            <div className="tool-stat-grid">
              {Object.entries(counts).map(([key, value]) => (
                <div key={key} className="tool-stat">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="rewards-action-row">
              <button className="primary-button" type="button" onClick={downloadExport} disabled={!snapshot}>
                下载 JSON
              </button>
            </div>
          </article>

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Preview</span>
              <h3>导出预览</h3>
            </div>

            <pre className="tool-json-preview">{JSON.stringify(snapshot ?? {}, null, 2)}</pre>
          </article>
        </div>
      ) : null}

      {!isLoading && !error && !currentProfile ? (
        <div className="empty-state">
          <p>暂无可用档案</p>
        </div>
      ) : null}
    </section>
  )
}

export default ExportPage
