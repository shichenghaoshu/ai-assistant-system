import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { COLOR_OPTIONS, getHabitTypeLabel, HABIT_TYPE_OPTIONS, ICON_OPTIONS } from '../features/habits/habitsApi.js'
import { useHabitsManagePageData } from '../features/habits/useHabitsManagePageData.js'

import '../styles/habits.css'

const EMPTY_FORM = {
  habit_name: '',
  habit_description: '',
  habit_type: 'daily_once',
  max_daily_count: '',
  points_per_checkin: '1',
  requires_approval: false,
  icon_name: 'star',
  color_scheme: 'blue',
  is_active: true,
}

function formatPoints(value) {
  const points = Number.parseInt(String(value ?? '0'), 10)
  if (!Number.isFinite(points)) {
    return '0'
  }

  return points > 0 ? `+${points}` : String(points)
}

function HabitChip({ children, tone = 'default' }) {
  return <span className={`habit-chip habit-chip-${tone}`}>{children}</span>
}

function HabitCard({ habit, onEdit, onDelete, onMoveUp, onMoveDown, onToggleActive }) {
  return (
    <article className="habit-card">
      <div className="habit-card-main">
        <div className="habit-card-icon" data-color={habit.color_scheme || 'blue'}>
          {String(habit.icon_name || 'star').slice(0, 1).toUpperCase()}
        </div>
        <div className="habit-card-copy">
          <div className="habit-card-title-row">
            <h3>{habit.habit_name}</h3>
            <HabitChip tone={habit.is_active ? 'success' : 'muted'}>{habit.is_active ? '启用中' : '已停用'}</HabitChip>
          </div>
          <p>{habit.habit_description || '暂无说明'}</p>
          <div className="habit-card-tags">
            <HabitChip>{getHabitTypeLabel(habit.habit_type)}</HabitChip>
            <HabitChip tone="accent">
              {formatPoints(habit.points_per_checkin)} 积分
            </HabitChip>
            <HabitChip tone="soft">
              {habit.habit_type === 'weekly'
                ? `每周最多 ${habit.max_daily_count ?? 1} 次`
                : habit.habit_type === 'daily_multiple'
                  ? `每天最多 ${habit.max_daily_count ?? 1} 次`
                  : '每日一次'}
            </HabitChip>
            {habit.requires_approval ? <HabitChip tone="warning">需审定</HabitChip> : null}
          </div>
        </div>
      </div>

      <div className="habit-card-actions">
        <button type="button" className="text-button" onClick={() => onEdit(habit)}>
          编辑
        </button>
        <button type="button" className="text-button" onClick={() => onMoveUp(habit.id)}>
          上移
        </button>
        <button type="button" className="text-button" onClick={() => onMoveDown(habit.id)}>
          下移
        </button>
        <button type="button" className="text-button" onClick={() => onToggleActive(habit.id, !habit.is_active)}>
          {habit.is_active ? '停用' : '启用'}
        </button>
        <button type="button" className="text-button text-button-danger" onClick={() => onDelete(habit.id)}>
          删除
        </button>
      </div>
    </article>
  )
}

function HabitsManagePage() {
  const { loading: authLoading, session } = useAuthSession()
  const {
    loading,
    error,
    currentProfile,
    habits,
    summary,
    createHabit,
    updateHabit,
    deleteHabit,
    moveHabit,
    toggleHabitActive,
    importDefaultHabits,
  } = useHabitsManagePageData(session?.user?.id)
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingHabitId, setEditingHabitId] = useState(null)
  const [banner, setBanner] = useState(null)
  const [formState, setFormState] = useState(EMPTY_FORM)

  const isLoading = authLoading || loading

  const visibleHabits = habits.filter((habit) => {
    const query = searchValue.trim().toLowerCase()
    const matchesQuery =
      !query ||
      [habit.habit_name, habit.habit_description, habit.habit_type].filter(Boolean).join(' ').toLowerCase().includes(query)
    const matchesType = typeFilter === 'all' || habit.habit_type === typeFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? habit.is_active : !habit.is_active)

    return matchesQuery && matchesType && matchesStatus
  })

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      if (editingHabitId) {
        await updateHabit(editingHabitId, formState)
        setBanner({ variant: 'success', message: '习惯已更新' })
      } else {
        await createHabit(formState)
        setBanner({ variant: 'success', message: '新习惯已创建' })
      }

      setEditingHabitId(null)
      setFormState(EMPTY_FORM)
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '保存失败' })
    }
  }

  async function handleImportDefaults() {
    try {
      await importDefaultHabits()
      setBanner({ variant: 'success', message: '默认习惯已导入' })
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '导入失败' })
    }
  }

  async function handleMoveHabit(habitId, direction) {
    try {
      await moveHabit(habitId, direction)
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '移动失败' })
    }
  }

  async function handleToggleHabitActive(habitId, isActive) {
    try {
      await toggleHabitActive(habitId, isActive)
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '状态更新失败' })
    }
  }

  async function handleDelete(habitId) {
    if (!window.confirm('确定要删除这个习惯吗？')) {
      return
    }

    try {
      await deleteHabit(habitId)
      setBanner({ variant: 'success', message: '习惯已删除' })
      if (editingHabitId === habitId) {
        setEditingHabitId(null)
      }
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '删除失败' })
    }
  }

  return (
    <section className="route-panel app-page habits-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Habits</div>
          <h2 className="page-title">管理行为习惯</h2>
        </div>
        <div className="page-header-actions">
          <Link className="secondary-button" to="/habits/checkin">
            去打卡
          </Link>
          <button className="primary-button" type="button" onClick={handleImportDefaults}>
            导入默认习惯
          </button>
        </div>
      </div>

      {isLoading ? <div className="inline-state">正在加载行为习惯数据...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载行为习惯，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          {banner ? (
            <div className={`settings-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div>
          ) : null}

          <div className="habit-summary-grid">
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Summary</span>
              <h3>习惯总览</h3>
              <div className="habit-summary-value">{summary.totalHabits}</div>
              <p>当前档案下的习惯总数</p>
            </article>
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Active</span>
              <h3>启用中</h3>
              <div className="habit-summary-value">{summary.activeHabits}</div>
              <p>仍会参与打卡与积分累计</p>
            </article>
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Inactive</span>
              <h3>已停用</h3>
              <div className="habit-summary-value">{summary.inactiveHabits}</div>
              <p>保留配置，不参与打卡</p>
            </article>
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Points</span>
              <h3>积分预览</h3>
              <div className="habit-summary-value">{summary.positivePoints - summary.negativePoints}</div>
              <p>按习惯积分预估的日常变动</p>
            </article>
          </div>

          <div className="habit-layout">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Directory</span>
                <h3>习惯列表</h3>
              </div>

              <div className="habit-toolbar">
                <label className="field">
                  <span className="field-label">搜索</span>
                  <input
                    className="field-input"
                    placeholder="搜索习惯名称或描述..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">类型</span>
                  <select className="field-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="all">全部类型</option>
                    {HABIT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">状态</span>
                  <select className="field-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">全部状态</option>
                    <option value="active">启用中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </label>
              </div>

              {visibleHabits.length === 0 ? (
                <div className="empty-state">
                  <p>{habits.length === 0 ? '当前还没有行为习惯' : '没有找到匹配的行为习惯'}</p>
                </div>
              ) : (
                <div className="habit-list">
                  {visibleHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onDelete={handleDelete}
                      onEdit={(nextHabit) => {
                        setEditingHabitId(nextHabit.id)
                        setFormState({
                          habit_name: nextHabit.habit_name ?? '',
                          habit_description: nextHabit.habit_description ?? '',
                          habit_type: nextHabit.habit_type ?? 'daily_once',
                          max_daily_count: String(nextHabit.max_daily_count ?? ''),
                          points_per_checkin: String(nextHabit.points_per_checkin ?? '1'),
                          requires_approval: Boolean(nextHabit.requires_approval),
                          icon_name: nextHabit.icon_name ?? 'star',
                          color_scheme: nextHabit.color_scheme ?? 'blue',
                          is_active: Boolean(nextHabit.is_active),
                        })
                      }}
                      onMoveDown={(habitId) => handleMoveHabit(habitId, 1)}
                      onMoveUp={(habitId) => handleMoveHabit(habitId, -1)}
                      onToggleActive={handleToggleHabitActive}
                    />
                  ))}
                </div>
              )}
            </article>

            <article className="data-card habit-form-card">
              <div className="section-heading">
                <span className="section-eyebrow">{editingHabitId ? 'Editing' : 'Create'}</span>
                <h3>{editingHabitId ? '编辑习惯' : '新增习惯'}</h3>
              </div>

              <form className="habit-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="field-label">习惯名称</span>
                  <input
                    className="field-input"
                    value={formState.habit_name}
                    onChange={(event) => setFormState((current) => ({ ...current, habit_name: event.target.value }))}
                  />
                </label>

                <label className="field">
                  <span className="field-label">习惯说明</span>
                  <textarea
                    className="field-input field-textarea"
                    rows={3}
                    value={formState.habit_description}
                    onChange={(event) => setFormState((current) => ({ ...current, habit_description: event.target.value }))}
                  />
                </label>

                <div className="habit-form-grid">
                  <label className="field">
                    <span className="field-label">习惯类型</span>
                    <select
                      className="field-input"
                      value={formState.habit_type}
                      onChange={(event) => setFormState((current) => ({ ...current, habit_type: event.target.value }))}
                    >
                      {HABIT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">积分</span>
                    <input
                      className="field-input"
                      value={formState.points_per_checkin}
                      onChange={(event) => setFormState((current) => ({ ...current, points_per_checkin: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">每日/每周上限</span>
                    <input
                      className="field-input"
                      value={formState.max_daily_count}
                      onChange={(event) => setFormState((current) => ({ ...current, max_daily_count: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">图标</span>
                    <select
                      className="field-input"
                      value={formState.icon_name}
                      onChange={(event) => setFormState((current) => ({ ...current, icon_name: event.target.value }))}
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">颜色</span>
                    <select
                      className="field-input"
                      value={formState.color_scheme}
                      onChange={(event) => setFormState((current) => ({ ...current, color_scheme: event.target.value }))}
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={formState.is_active}
                      onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
                    />
                    <span>启用习惯</span>
                  </label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={formState.requires_approval}
                      onChange={(event) => setFormState((current) => ({ ...current, requires_approval: event.target.checked }))}
                    />
                    <span>需要审定</span>
                  </label>
                </div>

                <div className="habit-form-actions">
                  <button className="primary-button" type="submit">
                    保存习惯
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setEditingHabitId(null)
                      setFormState(EMPTY_FORM)
                    }}
                  >
                    清空表单
                  </button>
                </div>
              </form>

              {currentProfile ? (
                <div className="habit-profile-note">
                  <span>当前档案</span>
                  <strong>{currentProfile.profile_name}</strong>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default HabitsManagePage
