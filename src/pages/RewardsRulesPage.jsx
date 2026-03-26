import { useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useRewardsRulesPageData } from '../features/rewards/useRewardsRulesPageData.js'
import '../styles/rewards.css'

function toNumberInputValue(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

function createDraftFromPreferences(preferences) {
  if (!preferences) {
    return null
  }

  return {
    base_stars_enabled: Boolean(preferences.base_stars_enabled),
    base_stars_value: toNumberInputValue(preferences.base_stars_value ?? ''),
    time_bonus_30min_enabled: Boolean(preferences.time_bonus_30min_enabled),
    time_bonus_30min_value: toNumberInputValue(preferences.time_bonus_30min_value ?? ''),
    time_bonus_60min_enabled: Boolean(preferences.time_bonus_60min_enabled),
    time_bonus_60min_value: toNumberInputValue(preferences.time_bonus_60min_value ?? ''),
    early_bird_bonus_enabled: Boolean(preferences.early_bird_bonus_enabled),
    early_bird_multiplier: toNumberInputValue(preferences.early_bird_multiplier ?? ''),
    early_bird_start_hour: toNumberInputValue(preferences.early_bird_start_hour ?? ''),
    early_bird_end_hour: toNumberInputValue(preferences.early_bird_end_hour ?? ''),
    weekend_bonus_enabled: Boolean(preferences.weekend_bonus_enabled),
    weekend_multiplier: toNumberInputValue(preferences.weekend_multiplier ?? ''),
    completion_bonus_enabled: Boolean(preferences.completion_bonus_enabled),
    completion_multiplier: toNumberInputValue(preferences.completion_multiplier ?? ''),
    daily_completion_bonus_value: toNumberInputValue(preferences.daily_completion_bonus_value ?? ''),
  }
}

function RewardsRulesPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, preferences, saving, banner, saveRules } =
    useRewardsRulesPageData(session?.user?.id)
  const [draft, setDraft] = useState(null)

  const isLoading = authLoading || loading
  const formState = draft ?? createDraftFromPreferences(preferences)

  function updateField(field, value) {
    setDraft((current) => ({
      ...(current ?? createDraftFromPreferences(preferences) ?? {}),
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formState) {
      return
    }

    await saveRules(formState)
    setDraft(null)
  }

  return (
    <section className="route-panel app-page rewards-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Rewards</div>
          <h2 className="page-title">奖励规则设置</h2>
        </div>
        <p className="page-note">当前页面负责编辑积分规则本身。它直接保存到 `user_preferences`，而不是只做只读展示。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}
      {!isLoading && error ? <div className="inline-state inline-state-error">获取奖励规则失败，请稍后重试。</div> : null}

      {!isLoading && !error && currentProfile ? (
        <div className="page-stack">
          {banner ? (
            <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div>
          ) : null}

          <form className="rewards-form" onSubmit={handleSubmit}>
            <div className="split-grid rewards-grid">
              <article className="data-card">
                <div className="section-heading">
                  <span className="section-eyebrow">基础奖励</span>
                  <h3>基础积分与时间奖励</h3>
                </div>

                <div className="rewards-stack">
                  <label className="field">
                    <span className="field-label">基础积分</span>
                    <input
                      className="field-input"
                      aria-label="基础积分"
                      type="number"
                      value={formState?.base_stars_value ?? ''}
                      onChange={(event) => updateField('base_stars_value', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">30 分钟奖励</span>
                    <input
                      className="field-input"
                      aria-label="30 分钟奖励"
                      type="number"
                      value={formState?.time_bonus_30min_value ?? ''}
                      onChange={(event) => updateField('time_bonus_30min_value', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">60 分钟奖励</span>
                    <input
                      className="field-input"
                      aria-label="60 分钟奖励"
                      type="number"
                      value={formState?.time_bonus_60min_value ?? ''}
                      onChange={(event) => updateField('time_bonus_60min_value', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">每日完成奖励</span>
                    <input
                      className="field-input"
                      aria-label="每日完成奖励"
                      type="number"
                      value={formState?.daily_completion_bonus_value ?? ''}
                      onChange={(event) => updateField('daily_completion_bonus_value', event.target.value)}
                    />
                  </label>
                </div>
              </article>

              <article className="data-card">
                <div className="section-heading">
                  <span className="section-eyebrow">Bonus Rules</span>
                  <h3>进阶奖励规则</h3>
                </div>

                <div className="rewards-stack">
                  <label className="field">
                    <span className="field-label">早起倍率</span>
                    <input
                      className="field-input"
                      aria-label="早起倍率"
                      type="number"
                      value={formState?.early_bird_multiplier ?? ''}
                      onChange={(event) => updateField('early_bird_multiplier', event.target.value)}
                    />
                  </label>
                  <div className="rewards-inline-grid">
                    <label className="field">
                      <span className="field-label">早起开始小时</span>
                      <input
                        className="field-input"
                        aria-label="早起开始小时"
                        type="number"
                        value={formState?.early_bird_start_hour ?? ''}
                        onChange={(event) => updateField('early_bird_start_hour', event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">早起结束小时</span>
                      <input
                        className="field-input"
                        aria-label="早起结束小时"
                        type="number"
                        value={formState?.early_bird_end_hour ?? ''}
                        onChange={(event) => updateField('early_bird_end_hour', event.target.value)}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">周末倍率</span>
                    <input
                      className="field-input"
                      aria-label="周末倍率"
                      type="number"
                      value={formState?.weekend_multiplier ?? ''}
                      onChange={(event) => updateField('weekend_multiplier', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">完成倍率</span>
                    <input
                      className="field-input"
                      aria-label="完成倍率"
                      type="number"
                      value={formState?.completion_multiplier ?? ''}
                      onChange={(event) => updateField('completion_multiplier', event.target.value)}
                    />
                  </label>
                </div>
              </article>
            </div>

            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Status</span>
                <h3>规则状态</h3>
              </div>

              <div className="rewards-toggle-grid">
                {[
                  ['base_stars_enabled', '基础积分启用'],
                  ['time_bonus_30min_enabled', '30 分钟奖励启用'],
                  ['time_bonus_60min_enabled', '60 分钟奖励启用'],
                  ['early_bird_bonus_enabled', '早起加成启用'],
                  ['weekend_bonus_enabled', '周末加成启用'],
                  ['completion_bonus_enabled', '完成奖励启用'],
                ].map(([field, label]) => (
                  <button
                    key={field}
                    className={`reward-toggle${formState?.[field] ? ' is-on' : ''}`}
                    type="button"
                    onClick={() => updateField(field, !formState?.[field])}
                  >
                    <span>{label}</span>
                    <strong>{formState?.[field] ? '已开启' : '已关闭'}</strong>
                  </button>
                ))}
              </div>
            </article>

            <div className="rewards-action-row">
              <button className="primary-button" type="submit" disabled={saving || !formState}>
                {saving ? '保存中...' : '保存规则'}
              </button>
            </div>
          </form>
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

export default RewardsRulesPage
