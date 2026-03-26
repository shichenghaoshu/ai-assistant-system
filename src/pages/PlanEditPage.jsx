import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useCurrentProfile } from '../features/account/useCurrentProfile.js'
import { fetchPlanEditorData, updatePlanWithTasks } from '../features/plans/plansApi.js'
import { formatDateTimeLocalValue, joinTaskDatesText } from '../features/plans/planUtils.js'
import '../styles/plans.css'

const initialForm = {
  plan_name: '',
  category: '',
  repeat_type: '每天',
  start_time: '',
  end_time: '',
  taskDatesText: '',
}

function PlanEditPage() {
  const location = useLocation()
  const planId = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('planId')
  const { loading: authLoading, session } = useAuthSession()
  const { loading: profileLoading, error: profileError, profile } = useCurrentProfile(session?.user?.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [taskCount, setTaskCount] = useState(0)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPlan() {
      if (!profile?.id || !planId) {
        if (active) {
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await fetchPlanEditorData(session?.user?.id, planId)
        if (active) {
          setForm({
            plan_name: result.plan?.plan_name ?? '',
            category: result.plan?.category ?? '',
            repeat_type: result.plan?.repeat_type ?? '每天',
            start_time: formatDateTimeLocalValue(result.plan?.start_time),
            end_time: formatDateTimeLocalValue(result.plan?.end_time),
            taskDatesText: joinTaskDatesText(result.tasks),
          })
          setTaskCount(result.tasks.length)
          setLoading(false)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError)
          setLoading(false)
        }
      }
    }

    loadPlan()

    return () => {
      active = false
    }
  }, [profile?.id, planId, session?.user?.id])

  if (authLoading || profileLoading) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state">正在加载计划编辑页面...</div>
      </section>
    )
  }

  if (profileError) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state inline-state-error">暂时无法加载计划编辑页面，请稍后重试。</div>
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

  if (!planId) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="empty-state">
          <p>缺少计划ID</p>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state">正在加载计划编辑页面...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="route-panel app-page plans-page">
        <div className="inline-state inline-state-error">暂时无法加载计划编辑页面，请稍后重试。</div>
      </section>
    )
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setBanner(null)

    try {
      await updatePlanWithTasks(profile.id, planId, form)
      setBanner({
        variant: 'success',
        message: '学习计划已更新',
      })
    } catch (saveError) {
      setBanner({
        variant: 'error',
        message: saveError?.message || '保存失败',
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
          <h2 className="page-title">编辑学习计划</h2>
        </div>
        <p className="page-note">编辑当前档案中的计划信息与任务日期，提交后会回写到真实 Supabase 表。</p>
      </div>

      <div className="plans-form-shell">
        <article className="data-card">
          <div className="section-heading">
            <span className="section-eyebrow">Profile</span>
            <h3>当前档案</h3>
          </div>
          <div className="summary-head">
            <div className="profile-avatar" style={{ backgroundColor: profile.avatar_color ?? '#3B82F6' }}>
              {String(profile.profile_name ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="summary-title">{profile.profile_name}</div>
              <div className="summary-meta">{session?.user?.email ?? '--'}</div>
            </div>
          </div>
          <div className="settings-note-box">
            <span>计划 ID</span>
            <strong>{planId}</strong>
          </div>
          <div className="settings-note-box">
            <span>任务数量</span>
            <strong>{taskCount} 条任务记录</strong>
          </div>
          <Link className="inline-link" to="/plans/manage">
            返回计划管理
          </Link>
        </article>

        <form className="data-card plan-form-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span className="section-eyebrow">Edit Form</span>
            <h3>计划信息</h3>
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
              {saving ? '保存中...' : '保存修改'}
            </button>
            <Link className="secondary-link" to={`/plans/edit?id=${planId}`}>
              保持在编辑页
            </Link>
          </div>

          {banner ? <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div> : null}
        </form>
      </div>
    </section>
  )
}

export default PlanEditPage
