import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { fetchPlansManagePageData } from '../features/plans/plansApi.js'
import { formatDate, formatDateTime } from '../features/plans/planUtils.js'
import '../styles/plans.css'

function PlansManagePage() {
  const { loading: authLoading, session } = useAuthSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [summary, setSummary] = useState({
    totalPlans: 0,
    totalTasks: 0,
    completedTasks: 0,
  })
  const [plans, setPlans] = useState([])
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    let active = true

    async function loadPlans() {
      if (!session?.user?.id) {
        if (active) {
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await fetchPlansManagePageData(session.user.id)

        if (active) {
          setCurrentProfile(data.currentProfile)
          setSummary(data.summary)
          setPlans(data.plans)
          setLoading(false)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError)
          setLoading(false)
        }
      }
    }

    loadPlans()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const isLoading = authLoading || loading
  const normalizedQuery = searchValue.trim().toLowerCase()
  const visiblePlans = plans.filter((plan) => {
    if (!normalizedQuery) {
      return true
    }

    const haystack = [plan.plan_name, plan.category, plan.repeat_type].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  return (
    <section className="route-panel app-page plans-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Plans</div>
          <h2 className="page-title">计划管理</h2>
        </div>
        <p className="page-note">读取当前档案下的学习计划和任务统计。写操作单独放在添加、编辑和批量页面里。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载计划管理数据...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载计划管理数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          <div className="plans-summary-grid">
            <article className="data-card plan-summary-card">
              <div className="section-heading">
                <span className="section-eyebrow">Current Profile</span>
                <h3>当前档案</h3>
              </div>
              <div className="summary-head">
                <div className="profile-avatar" style={{ backgroundColor: currentProfile?.avatar_color ?? '#3B82F6' }}>
                  {String(currentProfile?.profile_name ?? '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="summary-title">{currentProfile?.profile_name ?? '未找到档案'}</div>
                  <div className="summary-meta">{session?.user?.email ?? '--'}</div>
                </div>
              </div>
            </article>

            <article className="metric-card">
              <span className="metric-label">学习计划</span>
              <strong>{summary.totalPlans} 个计划</strong>
              <p>当前档案下的计划总数</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">任务记录</span>
              <strong>{summary.totalTasks} 个任务</strong>
              <p>当前档案下的任务条目</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">已完成任务</span>
              <strong>{summary.completedTasks} 个已完成</strong>
              <p>已完成的任务记录</p>
            </article>
          </div>

          <article className="data-card">
            <div className="plans-toolbar">
              <label className="field plans-search">
                <span className="field-label">搜索</span>
                <input
                  className="field-input"
                  placeholder="搜索计划名称或分类..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </label>

              <div className="plans-actions">
                <Link className="secondary-link" to="/plans/add">
                  添加学习计划
                </Link>
                <Link className="secondary-link" to="/plans/ai-add">
                  AI添加计划
                </Link>
                <Link className="secondary-link" to="/plans/batch-add">
                  批量添加计划
                </Link>
              </div>
            </div>

            {plans.length === 0 ? (
              <div className="empty-state">
                <p>当前还没有学习计划</p>
                <Link className="inline-link" to="/plans/add">
                  去添加学习计划
                </Link>
              </div>
            ) : visiblePlans.length === 0 ? (
              <div className="empty-state">
                <p>没有找到匹配的计划</p>
              </div>
            ) : (
              <div className="plans-table-wrap">
                <table className="plans-table">
                  <thead>
                    <tr>
                      <th>计划信息</th>
                      <th>分类</th>
                      <th>重复</th>
                      <th>任务</th>
                      <th>更新时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <div className="plan-main-cell">
                            <div className="record-title">{plan.plan_name || '未命名计划'}</div>
                            <div className="record-meta">
                              <span>{plan.progressLabel}</span>
                              <span>{plan.start_time ? formatDate(plan.start_time) : '待安排'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{plan.category || '未分类'}</td>
                        <td>{plan.repeat_type || '未设置重复'}</td>
                        <td>
                          <div className="plan-task-summary">
                            <strong>{plan.taskCount}</strong>
                            <span>{plan.completedTaskCount} 已完成</span>
                          </div>
                        </td>
                        <td>{formatDateTime(plan.updated_at ?? plan.created_at)}</td>
                        <td>
                          <div className="plans-row-actions">
                            <Link className="users-action-button" to={`/plans/edit?id=${plan.id}`}>
                              编辑
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default PlansManagePage
