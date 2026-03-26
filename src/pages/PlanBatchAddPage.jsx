import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useCurrentProfile } from '../features/account/useCurrentProfile.js'
import { createPlansFromDrafts, parseBatchPlanInput } from '../features/plans/plansApi.js'
import '../styles/plans.css'

function PlanBatchAddPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading: profileLoading, error: profileError, profile } = useCurrentProfile(session?.user?.id)
  const [rawText, setRawText] = useState('')
  const [drafts, setDrafts] = useState([])
  const [status, setStatus] = useState({
    variant: 'info',
    message: '输入批量文本后点击解析。每行建议用 `计划名称 | 分类 | 周期 | 日期` 格式。',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDrafts([])
    setStatus({
      variant: 'info',
      message: '输入批量文本后点击解析。每行建议用 `计划名称 | 分类 | 周期 | 日期` 格式。',
    })
  }, [profile?.id])

  if (authLoading || profileLoading) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state">正在加载批量添加页面...</div>
      </section>
    )
  }

  if (profileError) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state inline-state-error">暂时无法加载批量添加页面，请稍后重试。</div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="empty-state">
          <p>暂无可用档案</p>
        </div>
      </section>
    )
  }

  async function handleParse() {
    try {
      const result = await parseBatchPlanInput(profile.id, rawText)
      setDrafts(result.drafts)
      setStatus({
        variant: result.warning ? 'warning' : 'success',
        message: result.warning || `已解析 ${result.drafts.length} 个待创建计划`,
      })
    } catch (error) {
      setStatus({
        variant: 'error',
        message: error?.message || '解析失败',
      })
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await createPlansFromDrafts(profile.id, drafts)
      setStatus({
        variant: 'success',
        message: `已创建 ${result.createdPlans.length} 个计划`,
      })
    } catch (error) {
      setStatus({
        variant: 'error',
        message: error?.message || '保存失败',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="route-panel app-page plans-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Plans</div>
          <h2 className="page-title">批量添加计划</h2>
        </div>
        <p className="page-note">将多条计划文本一次性解析成草稿，适合把已有清单快速导入到当前档案。</p>
      </div>

      <div className="plans-form-shell">
        <article className="data-card">
          <div className="section-heading">
            <span className="section-eyebrow">Batch Input</span>
            <h3>批量文本</h3>
          </div>
          <label className="field">
            <span className="field-label">批量文本</span>
            <textarea
              className="field-input field-textarea field-textarea-large"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="数学复习 | 复习 | 每天&#10;英语单词 | 记忆 | 每周"
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={handleParse} disabled={!rawText.trim()}>
              解析计划
            </button>
            <Link className="secondary-link" to="/plans/add">
              单个添加
            </Link>
          </div>
          <div className={`feedback-banner is-${status.variant}`}>{status.message}</div>
        </article>

        <article className="data-card">
          <div className="section-heading">
            <span className="section-eyebrow">Draft List</span>
            <h3>待创建计划</h3>
          </div>

          {drafts.length === 0 ? (
            <div className="empty-state">
              <p>暂无待创建计划</p>
            </div>
          ) : (
            <>
              <div className="batch-count">{drafts.length} 个待创建计划</div>
              <div className="batch-draft-list">
                {drafts.map((draft) => (
                  <article key={`${draft.plan_name}-${draft.category}-${draft.repeat_type}`} className="batch-draft-card">
                    <div className="record-title">{draft.plan_name || '未命名计划'}</div>
                    <div className="record-meta">
                      <span>{draft.category || '未分类'}</span>
                      <span>{draft.repeat_type || '按需'}</span>
                    </div>
                    <div className="batch-draft-note">
                      {draft.taskDatesText ? draft.taskDatesText.split('\n').filter(Boolean).length : 0} 条任务日期
                    </div>
                  </article>
                ))}
              </div>
              <div className="form-actions">
                <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
                  {saving ? '创建中...' : '批量创建'}
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  )
}

export default PlanBatchAddPage
