import { useMemo, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { summarizeHabits } from '../features/habits/habitsApi.js'
import { useHabitsCheckinPageData } from '../features/habits/useHabitsCheckinPageData.js'

import '../styles/habits.css'

function CheckinCard({ habit, value, onChange }) {
  return (
    <article className="checkin-card">
      <div className="checkin-card-copy">
        <div className="habit-card-title-row">
          <h3>{habit.habit_name}</h3>
          {Number(value) > 0 ? <span className="habit-chip habit-chip-success">已打卡 {value} 次</span> : null}
        </div>
        <p>{habit.habit_description || '暂无说明'}</p>
      </div>
      <label className="field checkin-field">
        <span className="field-label">{habit.habit_name} 今日打卡次数</span>
        <input
          className="field-input"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </article>
  )
}

function HabitsCheckinPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, habits, savedCheckins, saveCheckins, clearCheckins } =
    useHabitsCheckinPageData(session?.user?.id)
  const [entries, setEntries] = useState({})
  const [banner, setBanner] = useState(null)

  const isLoading = authLoading || loading
  const activeHabits = useMemo(() => habits.filter((habit) => Boolean(habit.is_active)), [habits])
  const summary = useMemo(() => summarizeHabits(activeHabits), [activeHabits])
  const currentEntries = { ...savedCheckins, ...entries }

  async function handleSave() {
    setBanner(null)

    try {
      const saved = await saveCheckins(currentEntries)

      if (!saved) {
        throw new Error('保存失败')
      }

      setEntries(currentEntries)
      setBanner({ variant: 'success', message: '今日打卡已保存' })
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '保存失败' })
    }
  }

  async function handleClear() {
    setBanner(null)

    try {
      const cleared = await clearCheckins()

      if (!cleared) {
        throw new Error('清空失败')
      }

      setEntries({})
      setBanner({ variant: 'success', message: '今日打卡已清空' })
    } catch (error) {
      setBanner({ variant: 'error', message: error?.message || '清空失败' })
    }
  }

  return (
    <section className="route-panel app-page habits-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Habits</div>
          <h2 className="page-title">行为习惯打卡</h2>
        </div>
        <div className="page-header-actions">
          <button className="secondary-button" type="button" onClick={handleClear}>
            清空今日打卡
          </button>
          <button className="primary-button" type="button" onClick={handleSave}>
            保存今日打卡
          </button>
        </div>
      </div>

      {isLoading ? <div className="inline-state">正在加载打卡数据...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载打卡数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          {banner ? (
            <div className={`settings-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div>
          ) : null}

          <div className="habit-summary-grid">
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Today</span>
              <h3>当前可打卡习惯</h3>
              <div className="habit-summary-value">{activeHabits.length}</div>
              <p>只展示当前档案下启用中的习惯</p>
            </article>
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Saved</span>
              <h3>已记录项</h3>
              <div className="habit-summary-value">
                {Object.values(currentEntries).filter((value) => Number(value) > 0).length}
              </div>
              <p>本地保存的今日打卡次数</p>
            </article>
            <article className="data-card habit-summary-card">
              <span className="section-eyebrow">Points</span>
              <h3>积分预览</h3>
              <div className="habit-summary-value">{summary.positivePoints - summary.negativePoints}</div>
              <p>按当前习惯配置预估的日常积分变动</p>
            </article>
          </div>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Check-in</span>
              <h3>今日打卡列表</h3>
            </div>

            {activeHabits.length === 0 ? (
              <div className="empty-state">
                <p>当前还没有可打卡的习惯</p>
              </div>
            ) : (
              <div className="checkin-list">
                {activeHabits.map((habit) => (
                  <CheckinCard
                    key={habit.id}
                    habit={habit}
                    value={currentEntries[habit.id] ?? 0}
                    onChange={(nextValue) =>
                      setEntries((current) => ({
                        ...current,
                        [habit.id]: Number.parseInt(String(nextValue).trim(), 10) || 0,
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </article>

          {currentProfile ? (
            <article className="data-card habit-profile-note">
              <span>当前档案</span>
              <strong>{currentProfile.profile_name}</strong>
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default HabitsCheckinPage
