import { useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useImportPageData } from '../features/system-tools/useImportPageData.js'
import '../styles/system-tools.css'

function ImportPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, parsing, importing, parsedSnapshot, banner, parseImportFile, importSnapshot } =
    useImportPageData(session?.user?.id)
  const [selectedFileName, setSelectedFileName] = useState('')

  const isLoading = authLoading || loading

  async function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null
    setSelectedFileName(file?.name ?? '')

    if (file) {
      await parseImportFile(file)
    }
  }

  async function handleImport() {
    await importSnapshot(parsedSnapshot)
  }

  return (
    <section className="route-panel app-page system-tools-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">System Tools</div>
          <h2 className="page-title">数据导入</h2>
        </div>
        <p className="page-note">支持读取导出的 JSON 快照并按表合并回当前账号。写入前会先做文件解析和结构校验。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">获取导入数据失败，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        currentProfile ? (
          <div className="page-stack">
          {banner ? (
            <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div>
          ) : null}

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Import File</span>
              <h3>导入文件</h3>
            </div>

            <div className="system-tool-upload">
              <label className="field">
                <span className="field-label">导入文件</span>
                <input
                  className="field-input"
                  aria-label="导入文件"
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileChange}
                />
              </label>

              <div className="system-tool-note">
                <span>已选择</span>
                <strong>{selectedFileName || '尚未选择文件'}</strong>
              </div>

              <div className="rewards-action-row">
                <button className="primary-button" type="button" disabled={parsing || importing || !parsedSnapshot} onClick={handleImport}>
                  {importing ? '导入中...' : '开始导入'}
                </button>
              </div>
            </div>
          </article>

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Preview</span>
              <h3>导入预览</h3>
            </div>

            {parsedSnapshot ? (
              <div className="tool-stat-grid">
                {Object.entries(parsedSnapshot).map(([key, value]) => (
                  <div key={key} className="tool-stat">
                    <span>{key}</span>
                    <strong>{Array.isArray(value) ? value.length : 0}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>请选择一个导出快照文件</p>
              </div>
            )}
          </article>
        </div>
        ) : (
          <div className="empty-state">
            <p>暂无可用档案</p>
          </div>
        )
      ) : null}
    </section>
  )
}

export default ImportPage
