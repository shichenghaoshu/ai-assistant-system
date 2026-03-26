import { useEffect, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useSettingsPageData } from '../features/settings/useSettingsPageData.js'
import '../styles/settings.css'

function SettingsToggle({ label, description, enabled, disabled, onToggle }) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <h4>{label}</h4>
        <p>{description}</p>
      </div>
      <button
        aria-label={label}
        className={`setting-toggle${enabled ? ' is-on' : ''}`}
        disabled={disabled}
        type="button"
        onClick={() => onToggle(!enabled)}
      >
        <span className="setting-toggle-track">
          <span className="setting-toggle-thumb" />
        </span>
        <span className="setting-toggle-label">{enabled ? '已开启' : '已关闭'}</span>
      </button>
    </div>
  )
}

function buildRuleDraft(preferences) {
  if (!preferences) {
    return null
  }

  return {
    base_stars_enabled: Boolean(preferences.base_stars_enabled),
    base_stars_value: preferences.base_stars_value ?? '',
    time_bonus_30min_enabled: Boolean(preferences.time_bonus_30min_enabled),
    time_bonus_30min_value: preferences.time_bonus_30min_value ?? '',
    time_bonus_60min_enabled: Boolean(preferences.time_bonus_60min_enabled),
    time_bonus_60min_value: preferences.time_bonus_60min_value ?? '',
    early_bird_bonus_enabled: Boolean(preferences.early_bird_bonus_enabled),
    early_bird_multiplier: preferences.early_bird_multiplier ?? '',
    early_bird_start_hour: preferences.early_bird_start_hour ?? '',
    early_bird_end_hour: preferences.early_bird_end_hour ?? '',
    weekend_bonus_enabled: Boolean(preferences.weekend_bonus_enabled),
    weekend_multiplier: preferences.weekend_multiplier ?? '',
    completion_bonus_enabled: Boolean(preferences.completion_bonus_enabled),
    completion_multiplier: preferences.completion_multiplier ?? '',
    daily_completion_bonus_value: preferences.daily_completion_bonus_value ?? '',
  }
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeRuleDraft(draft) {
  if (!draft) {
    return {}
  }

  return {
    base_stars_enabled: Boolean(draft.base_stars_enabled),
    base_stars_value: parseNumber(draft.base_stars_value),
    time_bonus_30min_enabled: Boolean(draft.time_bonus_30min_enabled),
    time_bonus_30min_value: parseNumber(draft.time_bonus_30min_value),
    time_bonus_60min_enabled: Boolean(draft.time_bonus_60min_enabled),
    time_bonus_60min_value: parseNumber(draft.time_bonus_60min_value),
    early_bird_bonus_enabled: Boolean(draft.early_bird_bonus_enabled),
    early_bird_multiplier: parseNumber(draft.early_bird_multiplier),
    early_bird_start_hour: parseNumber(draft.early_bird_start_hour),
    early_bird_end_hour: parseNumber(draft.early_bird_end_hour),
    weekend_bonus_enabled: Boolean(draft.weekend_bonus_enabled),
    weekend_multiplier: parseNumber(draft.weekend_multiplier),
    completion_bonus_enabled: Boolean(draft.completion_bonus_enabled),
    completion_multiplier: parseNumber(draft.completion_multiplier),
    daily_completion_bonus_value: parseNumber(draft.daily_completion_bonus_value),
  }
}

function SettingsPage() {
  const { loading: authLoading, session } = useAuthSession()
  const {
    loading,
    error,
    currentProfile,
    preferences,
    banner,
    clipboardPromptDismissed,
    savingField,
    updatePreference,
    saveRewardRules,
    dismissClipboardPrompt,
    restoreClipboardPrompt,
  } = useSettingsPageData(session?.user?.id)
  const [ruleDraft, setRuleDraft] = useState(null)

  const isLoading = authLoading || loading

  useEffect(() => {
    setRuleDraft(buildRuleDraft(preferences))
  }, [preferences])

  async function handleRuleSubmit(event) {
    event.preventDefault()

    await saveRewardRules(normalizeRuleDraft(ruleDraft))
  }

  return (
    <section className="route-panel app-page settings-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Settings</div>
          <h2 className="page-title">系统设置</h2>
        </div>
        <p className="page-note">展示真实的奖励规则与音效偏好。页面加载时读取当前档案的 user_preferences，缺失时会按线上逻辑自动初始化。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">获取设置失败，请稍后重试。</div> : null}

      {!isLoading && !error && currentProfile ? (
        <div className="page-stack">
          {banner ? (
            <div className={`settings-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div>
          ) : null}

          <div className="settings-layout">
            <article className="data-card settings-card">
              <div className="section-heading">
                <span className="section-eyebrow">Rewards</span>
                <h3>奖励系统设置</h3>
              </div>

              <div className="settings-stack">
                <SettingsToggle
                  label="成就系统奖励"
                  description="完成成就时自动获得星星奖励"
                  disabled={savingField === 'achievement_rewards_enabled'}
                  enabled={Boolean(preferences?.achievement_rewards_enabled)}
                  onToggle={(nextValue) => updatePreference('achievement_rewards_enabled', nextValue)}
                />
                <SettingsToggle
                  label="连续打卡奖励"
                  description="连续打卡天数达到里程碑时获得额外奖励"
                  disabled={savingField === 'auto_streak_bonus_enabled'}
                  enabled={Boolean(preferences?.auto_streak_bonus_enabled)}
                  onToggle={(nextValue) => updatePreference('auto_streak_bonus_enabled', nextValue)}
                />
                <SettingsToggle
                  label="学习时长奖励"
                  description="完成长时间学习时获得额外星星奖励"
                  disabled={savingField === 'study_session_bonus_enabled'}
                  enabled={Boolean(preferences?.study_session_bonus_enabled)}
                  onToggle={(nextValue) => updatePreference('study_session_bonus_enabled', nextValue)}
                />
              </div>
            </article>

            <article className="data-card settings-card">
              <div className="section-heading">
                <span className="section-eyebrow">Rules</span>
                <h3>自定义积分奖励规则</h3>
              </div>
              <p className="settings-copy settings-copy-muted">
                配置基础积分、时间奖励、早起加成、周末加成等详细规则。
              </p>

              {ruleDraft ? (
                <form className="settings-rule-form" onSubmit={handleRuleSubmit}>
                  <div className="settings-rule-grid">
                    <label className="settings-rule-field">
                      <span>基础积分</span>
                      <div className="settings-rule-inline">
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.base_stars_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                base_stars_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                        <input
                          aria-label="基础积分"
                          className="field-input"
                          type="number"
                          value={ruleDraft.base_stars_value}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              base_stars_value: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>30 分钟奖励</span>
                      <div className="settings-rule-inline">
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.time_bonus_30min_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                time_bonus_30min_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                        <input
                          aria-label="30 分钟奖励"
                          className="field-input"
                          type="number"
                          value={ruleDraft.time_bonus_30min_value}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              time_bonus_30min_value: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>60 分钟奖励</span>
                      <div className="settings-rule-inline">
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.time_bonus_60min_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                time_bonus_60min_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                        <input
                          aria-label="60 分钟奖励"
                          className="field-input"
                          type="number"
                          value={ruleDraft.time_bonus_60min_value}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              time_bonus_60min_value: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>早起加成倍率</span>
                      <div className="settings-rule-inline settings-rule-inline-wide">
                        <input
                          aria-label="早起加成倍率"
                          className="field-input"
                          type="number"
                          step="0.1"
                          value={ruleDraft.early_bird_multiplier}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              early_bird_multiplier: event.target.value,
                            }))
                          }
                        />
                        <input
                          aria-label="早起开始小时"
                          className="field-input"
                          type="number"
                          value={ruleDraft.early_bird_start_hour}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              early_bird_start_hour: event.target.value,
                            }))
                          }
                        />
                        <input
                          aria-label="早起结束小时"
                          className="field-input"
                          type="number"
                          value={ruleDraft.early_bird_end_hour}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              early_bird_end_hour: event.target.value,
                            }))
                          }
                        />
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.early_bird_bonus_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                early_bird_bonus_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>周末加成倍率</span>
                      <div className="settings-rule-inline">
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.weekend_bonus_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                weekend_bonus_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                        <input
                          aria-label="周末加成倍率"
                          className="field-input"
                          type="number"
                          step="0.1"
                          value={ruleDraft.weekend_multiplier}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              weekend_multiplier: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>完成奖励倍率</span>
                      <div className="settings-rule-inline">
                        <label className="settings-rule-flag">
                          <input
                            checked={Boolean(ruleDraft.completion_bonus_enabled)}
                            type="checkbox"
                            onChange={(event) =>
                              setRuleDraft((current) => ({
                                ...current,
                                completion_bonus_enabled: event.target.checked,
                              }))
                            }
                          />
                          <span>启用</span>
                        </label>
                        <input
                          aria-label="完成奖励倍率"
                          className="field-input"
                          type="number"
                          step="0.1"
                          value={ruleDraft.completion_multiplier}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              completion_multiplier: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>

                    <label className="settings-rule-field">
                      <span>每日完成奖励</span>
                      <div className="settings-rule-inline">
                        <input
                          aria-label="每日完成奖励"
                          className="field-input"
                          type="number"
                          value={ruleDraft.daily_completion_bonus_value}
                          onChange={(event) =>
                            setRuleDraft((current) => ({
                              ...current,
                              daily_completion_bonus_value: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </label>
                  </div>

                  <div className="settings-action-row">
                    <button className="primary-button" type="submit" disabled={savingField === 'reward_rules'}>
                      {savingField === 'reward_rules' ? '保存中...' : '保存积分规则'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="inline-state">正在准备奖励规则...</div>
              )}
            </article>
          </div>

          <div className="settings-layout settings-layout-side">
            <article className="data-card settings-card">
              <div className="section-heading">
                <span className="section-eyebrow">Sound</span>
                <h3>音效设置</h3>
              </div>

              <SettingsToggle
                label="计划完成音效"
                description="完成计划时播放提示音效"
                disabled={savingField === 'completion_sound_enabled'}
                enabled={Boolean(preferences?.completion_sound_enabled)}
                onToggle={(nextValue) => updatePreference('completion_sound_enabled', nextValue)}
              />

              <div className="settings-note-box">
                <span>本地同步键</span>
                <strong>{currentProfile ? `sound_setting_${currentProfile.id}` : '--'}</strong>
              </div>
            </article>

            <article className="data-card settings-card">
              <div className="section-heading">
                <span className="section-eyebrow">Clipboard</span>
                <h3>粘贴板识别提示</h3>
              </div>

              <div className="settings-note-box">
                <span>当前状态：</span>
                <strong>{clipboardPromptDismissed ? '已关闭弹窗' : '正常弹出'}</strong>
              </div>

              <div className="settings-action-row">
                {clipboardPromptDismissed ? (
                  <button className="primary-button" type="button" onClick={restoreClipboardPrompt}>
                    恢复弹窗
                  </button>
                ) : (
                  <button className="secondary-button" type="button" onClick={dismissClipboardPrompt}>
                    关闭弹窗
                  </button>
                )}
              </div>

              <p className="settings-copy settings-copy-muted">
                如果之前选择了“不再弹出”，可以在这里重新开启提示。
              </p>
            </article>
          </div>

          <article className="data-card settings-card">
            <div className="section-heading">
              <span className="section-eyebrow">Guide</span>
              <h3>设置说明</h3>
            </div>

            <div className="settings-guide">
              <p>当您完成学习里程碑时，系统会自动给予星星奖励。</p>
              <p>连续学习天数达到一定数量时，会发放额外奖励。</p>
              <p>较长的学习时长也会触发额外星星奖励。</p>
              <p>完成学习计划时可播放提示音效，增强成就感。</p>
              <p className="settings-guide-tip">
                如果您觉得自动获得的星星过多，可以关闭相应的奖励功能，只保留习惯打卡奖励；需要安静环境时，也可以关闭音效功能。
              </p>
            </div>
          </article>
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

export default SettingsPage
