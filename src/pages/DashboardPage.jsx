import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useDashboardPageData } from '../features/dashboard/useDashboardPageData.js'
import '../styles/dashboard.css'

function formatDate(value) {
  if (!value) {
    return '待安排'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '待安排'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatTaskProgress(task) {
  if (typeof task.completed_count === 'number' && typeof task.target_count === 'number') {
    return `${task.completed_count}/${task.target_count}`
  }

  if (task.is_completed) {
    return '已完成'
  }

  if (typeof task.session_count === 'number' && task.session_count > 0) {
    return `${task.session_count} 次专注`
  }

  return '待开始'
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getTaskTitle(task) {
  return task?.plan?.plan_name || task?.task_name || '未关联计划'
}

function DashboardPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, profile, metrics, recentPlans, recentTasks, todayTasks = [] } = useDashboardPageData(
    session?.user?.id,
  )
  const [isFocusRunning, setIsFocusRunning] = useState(false)
  const [focusSeconds, setFocusSeconds] = useState(0)

  const isLoading = authLoading || loading
  const activeTask = todayTasks[0] ?? null

  useEffect(() => {
    if (!isFocusRunning) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setFocusSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isFocusRunning])

  function startFocus() {
    setIsFocusRunning(true)
  }

  function pauseFocus() {
    setIsFocusRunning(false)
  }

  function resetFocus() {
    setIsFocusRunning(false)
    setFocusSeconds(0)
  }

  return (
    <section className="route-panel app-page dashboard-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Dashboard</div>
          <h2 className="page-title">学习与账户概览</h2>
        </div>
        <p className="page-note">首页数据直接读取当前账号与档案，缺少数据时保持空态，不补造样例内容。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载首页数据...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载首页数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          <section className="dashboard-intro">
            <article className="data-card summary-card summary-card-hero">
              <div className="section-heading">
                <span className="section-eyebrow">Account Desk</span>
                <h3>账户与档案</h3>
              </div>
              <div className="summary-hero">
                <div className="summary-head summary-head-hero">
                  <div
                    className="profile-avatar"
                    style={{ background: profile?.avatar_color ?? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                  >
                    {(profile?.profile_name ?? session?.user?.email ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="summary-title">{profile?.profile_name ?? '未找到档案'}</div>
                    <div className="summary-meta">{session?.user?.email ?? '未登录'}</div>
                  </div>
                </div>
                <dl className="summary-list summary-list-inline">
                  <div>
                    <dt>账号 ID</dt>
                    <dd>{session?.user?.id ?? '--'}</dd>
                  </div>
                  <div>
                    <dt>档案 ID</dt>
                    <dd>{profile?.id ?? '暂无档案'}</dd>
                  </div>
                  <div>
                    <dt>默认档案</dt>
                    <dd>{profile?.is_default ? '是' : '否'}</dd>
                  </div>
                </dl>
              </div>
            </article>

            <div className="metric-strip">
              <article className="metric-card metric-stat">
                <span className="metric-label">学习计划</span>
                <strong>{metrics.plans}</strong>
                <p>当前档案下的计划总数</p>
              </article>
              <article className="metric-card metric-stat">
                <span className="metric-label">任务记录</span>
                <strong>{metrics.tasks}</strong>
                <p>当前档案下的任务条目</p>
              </article>
              <article className="metric-card metric-stat">
                <span className="metric-label">行为习惯</span>
                <strong>{metrics.habits}</strong>
                <p>当前档案下的习惯配置</p>
              </article>
              <article className="metric-card metric-stat">
                <span className="metric-label">兑换记录</span>
                <strong>{metrics.redemptions}</strong>
                <p>当前账号下的会员兑换次数</p>
              </article>
            </div>
          </section>

          <div className="dashboard-focus-grid">
            <article className="data-card focus-card focus-card-hero">
              <div className="section-heading">
                <span className="section-eyebrow">Daily Rhythm</span>
                <h3>今日节奏</h3>
              </div>
              <div className="focus-stage">
                <div className="focus-primary">
                  <div className="focus-clock" aria-label="专注时长">
                    {formatDuration(focusSeconds)}
                  </div>
                  <p className="focus-copy">把当前学习节奏稳定在一个可持续的专注循环里，不需要额外装饰性摘要。</p>
                  <div className="focus-actions">
                    <button className="primary-button" type="button" onClick={isFocusRunning ? pauseFocus : startFocus}>
                      {isFocusRunning ? '暂停专注' : '开始专注'}
                    </button>
                    <button className="secondary-button" type="button" onClick={resetFocus}>
                      重置计时
                    </button>
                  </div>
                </div>

                {activeTask ? (
                  <div className="status-panel">
                    <strong>当前专注任务</strong>
                    <p>{getTaskTitle(activeTask)}</p>
                    <div className="status-grid">
                      <div className="status-cell">
                        <span>任务日期</span>
                        <strong>{formatDate(activeTask.task_date)}</strong>
                      </div>
                      <div className="status-cell">
                        <span>完成进度</span>
                        <strong>{formatTaskProgress(activeTask)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>今天还没有任务，先从学习计划开始。</p>
                    <Link className="inline-link" to="/plans/add">
                      去添加学习计划
                    </Link>
                  </div>
                )}
              </div>
            </article>

            <article className="data-card dashboard-today-card">
              <div className="section-heading">
                <span className="section-eyebrow">Today</span>
                <h3>今天的任务</h3>
              </div>
              {todayTasks.length === 0 ? (
                <div className="empty-state">
                  <p>今天没有读取到任务记录</p>
                  <Link className="inline-link" to="/plans/manage">
                    去查看计划管理
                  </Link>
                </div>
              ) : (
                <div className="record-list">
                  {todayTasks.map((task) => (
                    <article key={task.id} className="record-item">
                      <div className="record-main">
                        <div className="record-title">{getTaskTitle(task)}</div>
                        <div className="record-meta">
                          <span>{formatDate(task.task_date)}</span>
                          <span>{formatTaskProgress(task)}</span>
                        </div>
                      </div>
                      <span className={`status-pill ${task.is_completed ? 'is-success' : ''}`}>
                        {task.is_completed ? '已完成' : '待处理'}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>

          <div className="split-grid split-grid-emphasis">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Recent Plans</span>
                <h3>计划回看</h3>
              </div>
              {recentPlans.length === 0 ? (
                <div className="empty-state">
                  <p>当前还没有学习计划</p>
                  <Link className="inline-link" to="/plans/add">
                    去添加学习计划
                  </Link>
                </div>
              ) : (
                <div className="record-list">
                  {recentPlans.map((plan) => (
                    <article key={plan.id} className="record-item">
                      <div className="record-main">
                        <div className="record-title">{plan.plan_name || '未命名计划'}</div>
                        <div className="record-meta">
                          <span>{plan.category || '未分类'}</span>
                          <span>{plan.repeat_type || '未设置重复'}</span>
                        </div>
                      </div>
                      <span className="record-date">{formatDate(plan.updated_at ?? plan.created_at)}</span>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Recent Tasks</span>
                <h3>执行记录</h3>
              </div>
              {recentTasks.length === 0 ? (
                <div className="empty-state">
                  <p>当前还没有任务记录</p>
                  <Link className="inline-link" to="/plans/manage">
                    去查看计划管理
                  </Link>
                </div>
              ) : (
                <div className="record-list">
                  {recentTasks.map((task) => (
                    <article key={task.id} className="record-item">
                      <div className="record-main">
                        <div className="record-title">{task.plan?.plan_name || '未关联计划'}</div>
                        <div className="record-meta">
                          <span>{formatDate(task.task_date)}</span>
                          <span>{formatTaskProgress(task)}</span>
                        </div>
                      </div>
                      <span className={`status-pill ${task.is_completed ? 'is-success' : ''}`}>
                        {task.is_completed ? '已完成' : '待处理'}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Next Steps</span>
              <h3>工作入口</h3>
            </div>
            <div className="quick-link-grid">
              <Link className="quick-link-card" to="/plans/manage">
                <span className="quick-link-title">查看计划管理</span>
                <span className="quick-link-note">核对全部计划、重复周期与执行节奏</span>
              </Link>
              <Link className="quick-link-card" to="/plans/add">
                <span className="quick-link-title">去添加学习计划</span>
                <span className="quick-link-note">当前档案还没有计划时，从这里开始配置</span>
              </Link>
              <Link className="quick-link-card" to="/habits/manage">
                <span className="quick-link-title">管理行为习惯</span>
                <span className="quick-link-note">查看 habit_name 数据与打卡规则</span>
              </Link>
              <Link className="quick-link-card" to="/membership">
                <span className="quick-link-title">打开会员中心</span>
                <span className="quick-link-note">查看会员类型与兑换历史</span>
              </Link>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default DashboardPage
