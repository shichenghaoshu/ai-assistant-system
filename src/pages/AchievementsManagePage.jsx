import { useMemo, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useAchievementsManagePageData } from '../features/rewards/useAchievementsManagePageData.js'
import '../styles/rewards.css'

function toInputValue(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

function createDraftFromAchievement(achievement) {
  if (!achievement) {
    return {
      name: '',
      description: '',
      reward_stars: '',
      sort_order: '',
      is_active: true,
    }
  }

  return {
    id: achievement.id,
    name: achievement.name ?? achievement.display_name ?? '',
    description: achievement.description ?? '',
    reward_stars: toInputValue(achievement.reward_stars),
    sort_order: toInputValue(achievement.sort_order),
    is_active: Boolean(achievement.is_active),
  }
}

function AchievementsManagePage() {
  const { loading: authLoading, session } = useAuthSession()
  const {
    loading,
    error,
    currentProfile,
    achievements,
    selectedAchievementId,
    banner,
    savingId,
    deletingId,
    selectAchievement,
    saveAchievement,
    deleteAchievement,
  } = useAchievementsManagePageData(session?.user?.id)
  const [draft, setDraft] = useState(null)

  const selectedAchievement = useMemo(
    () => achievements.find((achievement) => achievement.id === selectedAchievementId) ?? null,
    [achievements, selectedAchievementId],
  )
  const formState = draft ?? createDraftFromAchievement(selectedAchievement)

  const isLoading = authLoading || loading

  function updateField(field, value) {
    setDraft((current) => ({
      ...(current ?? createDraftFromAchievement(selectedAchievement)),
      [field]: value,
    }))
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!formState) {
      return
    }

    await saveAchievement(formState)
    setDraft(null)
  }

  async function handleDelete() {
    if (!formState?.id) {
      return
    }

    await deleteAchievement(formState.id)
    setDraft(null)
  }

  return (
    <section className="route-panel app-page rewards-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Rewards</div>
          <h2 className="page-title">管理成就</h2>
        </div>
        <p className="page-note">该页直接读取 `achievements` 与 `user_achievements`，允许创建、编辑、停用和删除成就定义。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">获取成就数据失败，请稍后重试。</div> : null}

      {!isLoading && !error && currentProfile ? (
        <div className="page-stack">
          {banner ? (
            <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div>
          ) : null}

          <div className="split-grid rewards-management-grid">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Achievement List</span>
                <h3>成就列表</h3>
              </div>

              {achievements.length === 0 ? (
                <div className="empty-state">
                  <p>还没有成就定义</p>
                </div>
              ) : (
                <div className="achievement-list">
                  {achievements.map((achievement) => (
                    <button
                      key={achievement.id}
                      className={`achievement-row${achievement.id === selectedAchievementId ? ' is-selected' : ''}`}
                      type="button"
                      onClick={() => selectAchievement(achievement.id)}
                    >
                      <div className="achievement-copy">
                        <strong>{achievement.display_name ?? achievement.name}</strong>
                        <span>{achievement.description || '暂无说明'}</span>
                      </div>
                      <div className="achievement-meta">
                        <span>{achievement.reward_stars ?? 0} 星</span>
                        <span>{achievement.earned_count ?? 0} 次达成</span>
                        <span>{achievement.is_active ? '启用' : '停用'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </article>

            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Editor</span>
                <h3>成就编辑器</h3>
              </div>

              <form className="rewards-form" onSubmit={handleSave}>
                <label className="field">
                  <span className="field-label">成就名称</span>
                  <input
                    className="field-input"
                    aria-label="成就名称"
                    value={formState?.name ?? ''}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="请输入成就名称"
                  />
                </label>

                <label className="field">
                  <span className="field-label">成就说明</span>
                  <textarea
                    className="field-input rewards-textarea"
                    aria-label="成就说明"
                    value={formState?.description ?? ''}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="请输入成就说明"
                  />
                </label>

                <div className="rewards-inline-grid">
                  <label className="field">
                    <span className="field-label">奖励星星</span>
                    <input
                      className="field-input"
                      aria-label="奖励星星"
                      type="number"
                      value={formState?.reward_stars ?? ''}
                      onChange={(event) => updateField('reward_stars', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">排序</span>
                    <input
                      className="field-input"
                      aria-label="排序"
                      type="number"
                      value={formState?.sort_order ?? ''}
                      onChange={(event) => updateField('sort_order', event.target.value)}
                    />
                  </label>
                </div>

                <button
                  className={`reward-toggle reward-toggle-inline${formState?.is_active ? ' is-on' : ''}`}
                  type="button"
                  onClick={() => updateField('is_active', !formState?.is_active)}
                >
                  <span>启用成就</span>
                  <strong>{formState?.is_active ? '已开启' : '已关闭'}</strong>
                </button>

                <div className="rewards-action-row">
                  <button className="primary-button" type="submit" disabled={savingId === (formState?.id ?? 'new')}>
                    {savingId === (formState?.id ?? 'new') ? '保存中...' : '保存成就'}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      selectAchievement(null)
                      setDraft(null)
                    }}
                  >
                    新增成就
                  </button>
                  <button className="secondary-button" type="button" disabled={!formState?.id || deletingId === formState.id} onClick={handleDelete}>
                    {deletingId === formState?.id ? '删除中...' : '删除成就'}
                  </button>
                </div>
              </form>
            </article>
          </div>
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

export default AchievementsManagePage
