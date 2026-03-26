import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useCurrentProfile } from '../features/account/useCurrentProfile.js'
import { createPlanWithTasks, generatePlanDraft } from '../features/plans/plansApi.js'
import { formatDateTimeLocalValue } from '../features/plans/planUtils.js'
import '../styles/plans.css'

const initialForm = {
  plan_name: '',
  category: '',
  repeat_type: '按需',
  start_time: '',
  end_time: '',
  taskDatesText: '',
}

function PlanAiAddPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading: profileLoading, error: profileError, profile } = useCurrentProfile(session?.user?.id)
  const [prompt, setPrompt] = useState('')
  const [form, setForm] = useState(initialForm)
  const [draftState, setDraftState] = useState({
    status: 'idle',
    message: '',
  })
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBanner(null)
  }, [profile?.id])

  if (authLoading || profileLoading) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state">正在加载 AI 计划页面...</div>
      </section>
    )
  }

  if (profileError) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state inline-state-error">暂时无法加载 AI 计划页面，请稍后重试。</div>
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

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleGenerate() {
    setDraftState({
      status: 'loading',
      message: '正在生成草稿...',
    })
    setBanner(null)

    try {
      const result = await generatePlanDraft(profile.id, prompt)
      setForm({
        ...initialForm,
        ...result.draft,
      })
      setDraftState({
        status: 'success',
        message: result.warning || '草稿已生成',
      })
      if (result.warning) {
        setBanner({
          variant: 'warning',
          message: result.warning,
        })
      }
    } catch (error) {
      setDraftState({
        status: 'error',
        message: error?.message || '生成失败',
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setBanner(null)

    try {
      await createPlanWithTasks(profile.id, form)
      setBanner({
        variant: 'success',
        message: '学习计划已保存',
      })
    } catch (error) {
      setBanner({
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
          <h2 className="page-title">AI添加计划</h2>
        </div>
        <p className="page-note">先输入需求生成草稿，再人工确认后保存。AI 不可用时会保留一个明确的本地草稿。</p>
      </div>

      <div className="plans-form-shell">
        <article className="data-card">
          <div className="section-heading">
            <span className="section-eyebrow">Prompt</span>
            <h3>生成需求</h3>
          </div>
          <label className="field">
            <span className="field-label">AI 需求描述</span>
            <textarea
              className="field-input field-textarea field-textarea-large"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="例如：周末帮我安排两天语文复习"
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={handleGenerate} disabled={!prompt.trim()}>
              生成草稿
            </button>
            <Link className="secondary-link" to="/plans/add">
              手动添加
            </Link>
          </div>
          <div className="feedback-banner is-info">{draftState.message || '草稿生成后会在右侧展示可编辑内容。'}</div>
        </article>

        <form className="data-card plan-form-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span className="section-eyebrow">Draft</span>
            <h3>草稿预览</h3>
          </div>

          <div className="plan-form-grid">
            <label className="field">
              <span className="field-label">计划名称</span>
              <input className="field-input" value={form.plan_name} onChange={(event) => updateField('plan_name', event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">分类</span>
              <input className="field-input" value={form.category} onChange={(event) => updateField('category', event.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">重复规则</span>
              <select className="field-input" value={form.repeat_type} onChange={(event) => updateField('repeat_type', event.target.value)}>
                <option value="每天">每天</option>
                <option value="每周">每周</option>
                <option value="周末">周末</option>
                <option value="按需">按需</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">开始时间</span>
              <input
                className="field-input"
                type="datetime-local"
                value={form.start_time}
                onChange={(event) => updateField('start_time', formatDateTimeLocalValue(event.target.value))}
              />
            </label>
            <label className="field">
              <span className="field-label">结束时间</span>
              <input
                className="field-input"
                type="datetime-local"
                value={form.end_time}
                onChange={(event) => updateField('end_time', formatDateTimeLocalValue(event.target.value))}
              />
            </label>
            <label className="field field-span-2">
              <span className="field-label">任务安排</span>
              <textarea
                className="field-input field-textarea"
                value={form.taskDatesText}
                onChange={(event) => updateField('taskDatesText', event.target.value)}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving || !form.plan_name.trim()}>
              {saving ? '保存中...' : '保存计划'}
            </button>
            <Link className="secondary-link" to="/plans/manage">
              返回管理
            </Link>
          </div>

          {banner ? <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : banner.variant === 'warning' ? 'is-warning' : 'is-error'}`}>{banner.message}</div> : null}
          <div className="draft-summary">
            <strong>{form.plan_name || '暂无草稿'}</strong>
            <span>{form.category || '未分类'}</span>
            <span>{form.repeat_type}</span>
            <span>{form.taskDatesText ? form.taskDatesText.split('\n').filter(Boolean).length : 0} 条任务日期</span>
          </div>
        </form>
      </div>
    </section>
  )
}

export default PlanAiAddPage

