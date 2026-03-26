import { useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useUsersPageData } from '../features/users/useUsersPageData.js'
import '../styles/users.css'

function formatDateTime(value) {
  if (!value) {
    return '暂无时间'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '暂无时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getProfileType(profile) {
  return profile?.is_default ? '主要档案' : '次要档案'
}

function getProfileAvatar(profile) {
  if (profile?.avatar_url) {
    return (
      <img
        alt={profile.profile_name}
        className="users-avatar-image"
        src={profile.avatar_url}
      />
    )
  }

  const label = String(profile?.profile_name ?? '?').slice(0, 1).toUpperCase()

  return (
    <div
      className="users-avatar-fallback"
      style={{ backgroundColor: profile?.avatar_color ?? '#3B82F6' }}
    >
      {label}
    </div>
  )
}

function countAccounts(profiles) {
  return new Set((profiles ?? []).map((profile) => profile.account_id).filter(Boolean)).size
}

function matchesQuery(profile, query, accountEmail) {
  if (!query) {
    return true
  }

  const haystack = [profile?.profile_name, accountEmail, profile?.account_id].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(query)
}

function createDraft(profile) {
  return {
    profile_name: profile?.profile_name ?? '',
    avatar_color: profile?.avatar_color ?? '#3B82F6',
    is_default: Boolean(profile?.is_default),
    display_order: profile?.display_order ?? 0,
    max_owned_classes: profile?.max_owned_classes ?? '',
    max_class_members: profile?.max_class_members ?? '',
  }
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeDraft(draft) {
  return {
    profile_name: draft.profile_name.trim(),
    avatar_color: draft.avatar_color.trim() || '#3B82F6',
    is_default: Boolean(draft.is_default),
    display_order: parseInteger(draft.display_order) ?? 0,
    max_owned_classes: parseInteger(draft.max_owned_classes),
    max_class_members: parseInteger(draft.max_class_members),
  }
}

function DialogShell({ title, onClose, children, footer, variant = 'default' }) {
  return (
    <div className="users-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-label={title}
        className={`users-modal${variant === 'danger' ? ' is-danger' : ''}`}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="users-modal-header">
          <div>
            <h3>{title}</h3>
          </div>
          <button className="users-modal-close" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="users-modal-body">{children}</div>
        <div className="users-modal-footer">{footer}</div>
      </div>
    </div>
  )
}

function UsersPage() {
  const { loading: authLoading, session } = useAuthSession()
  const {
    loading,
    error,
    accountEmail,
    profiles,
    updateProfile,
    clearProfileData,
    deleteProfile,
  } = useUsersPageData(session?.user?.id, session?.user?.email ?? '')
  const [searchValue, setSearchValue] = useState('')
  const [banner, setBanner] = useState(null)
  const [dialog, setDialog] = useState({
    type: null,
    profile: null,
    draft: null,
  })
  const [saving, setSaving] = useState(false)

  const isLoading = authLoading || loading
  const normalizedQuery = searchValue.trim().toLowerCase()
  const visibleProfiles = profiles.filter((profile) => matchesQuery(profile, normalizedQuery, accountEmail))
  const profileCount = profiles.length
  const accountCount = countAccounts(profiles)
  const activeProfile = visibleProfiles[0] ?? null
  const summaryEmptyMessage =
    profiles.length === 0 ? '暂无档案' : visibleProfiles.length === 0 ? '没有找到匹配的档案' : null

  async function handleSaveProfile(event) {
    event.preventDefault()

    if (!dialog.profile || !dialog.draft) {
      return
    }

    setSaving(true)
    try {
      await updateProfile(dialog.profile.id, normalizeDraft(dialog.draft))
      setBanner({
        variant: 'success',
        message: '档案已保存',
      })
      setDialog({
        type: null,
        profile: null,
        draft: null,
      })
    } catch (saveError) {
      setBanner({
        variant: 'error',
        message: saveError?.message || '保存档案失败',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmAction() {
    if (!dialog.profile || (dialog.type !== 'clear' && dialog.type !== 'delete')) {
      return
    }

    setSaving(true)
    try {
      if (dialog.type === 'clear') {
        await clearProfileData(dialog.profile.id)
        setBanner({
          variant: 'success',
          message: '档案数据已清空',
        })
      } else {
        await deleteProfile(dialog.profile.id)
        setBanner({
          variant: 'success',
          message: '档案已删除',
        })
      }

      setDialog({
        type: null,
        profile: null,
        draft: null,
      })
    } catch (actionError) {
      setBanner({
        variant: 'error',
        message: actionError?.message || '操作失败，请重试',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="route-panel app-page users-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Users</div>
          <h2 className="page-title">档案管理</h2>
        </div>
        <p className="page-note">管理学习档案和用户账户。当前只读取当前登录账号下的真实档案与统计，不补造样例数据。</p>
      </div>

      {banner ? (
        <div className={`users-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div>
      ) : null}

      {isLoading ? <div className="inline-state">正在加载档案数据...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载档案数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Directory</span>
              <h3>账号档案列表</h3>
            </div>

            <div className="users-toolbar">
              <label className="field users-search">
                <span className="field-label">搜索</span>
                <input
                  className="field-input"
                  placeholder="搜索档案名称或邮箱..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </label>

              <div className="users-summary-line">
                {profileCount} 个档案 | {accountCount} 个账户
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="empty-state">
                <p>暂无档案</p>
              </div>
            ) : visibleProfiles.length === 0 ? (
              <div className="empty-state">
                <p>没有找到匹配的档案</p>
              </div>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>档案信息</th>
                      <th>账户邮箱</th>
                      <th>类型</th>
                      <th>创建时间</th>
                      <th>限额与统计</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProfiles.map((profile) => (
                      <tr key={profile.id}>
                        <td>
                          <div className="users-profile-cell">
                            <div className="users-avatar">{getProfileAvatar(profile)}</div>
                            <div className="users-profile-copy">
                              <div className="users-profile-title-row">
                                <span className="record-title">{profile.profile_name}</span>
                                {profile.is_default ? <span className="status-pill">默认档案</span> : null}
                              </div>
                              <div className="record-meta">
                                <span>{profile.id}</span>
                                <span>排序 {profile.display_order ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{accountEmail || session?.user?.email || '--'}</td>
                        <td>{getProfileType(profile)}</td>
                        <td>{formatDateTime(profile.created_at)}</td>
                        <td>
                          <div className="users-stats">
                            <span>最多可拥有 {profile.max_owned_classes ?? '--'} 个班级</span>
                            <span>单班最多 {profile.max_class_members ?? '--'} 人</span>
                            <span>计划 {profile.counts?.learningPlans ?? 0}</span>
                            <span>任务 {profile.counts?.planTasks ?? 0}</span>
                            <span>习惯 {profile.counts?.behaviorHabits ?? 0}</span>
                            <span>设置 {profile.counts?.userPreferences ?? 0}</span>
                            <span>考试 {profile.counts?.examRecords ?? 0}</span>
                          </div>
                        </td>
                        <td>
                          <div className="users-actions">
                            <button
                              className="users-action-button"
                              type="button"
                              onClick={() =>
                                setDialog({
                                  type: 'edit',
                                  profile,
                                  draft: createDraft(profile),
                                })
                              }
                            >
                              编辑档案
                            </button>
                            <button
                              className="users-action-button"
                              type="button"
                              onClick={() =>
                                setDialog({
                                  type: 'clear',
                                  profile,
                                  draft: null,
                                })
                              }
                            >
                              清空数据
                            </button>
                            <button
                              className="users-action-button users-action-danger"
                              type="button"
                              onClick={() =>
                                setDialog({
                                  type: 'delete',
                                  profile,
                                  draft: null,
                                })
                              }
                            >
                              删除档案
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <div className="split-grid split-grid-emphasis">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Summary</span>
                <h3>当前档案概览</h3>
              </div>

              {activeProfile ? (
                <div className="users-summary-panel">
                  <div className="summary-head">
                    <div className="profile-avatar" style={{ backgroundColor: activeProfile.avatar_color ?? '#3B82F6' }}>
                      {String(activeProfile.profile_name ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="summary-title">{activeProfile.profile_name}</div>
                      <div className="summary-meta">{accountEmail || session?.user?.email || '--'}</div>
                    </div>
                  </div>

                  <div className="summary-list">
                    <div>
                      <dt>默认状态</dt>
                      <dd>{activeProfile.is_default ? '主要档案' : '次要档案'}</dd>
                    </div>
                    <div>
                      <dt>创建时间</dt>
                      <dd>{formatDateTime(activeProfile.created_at)}</dd>
                    </div>
                    <div>
                      <dt>班级限制</dt>
                      <dd>{activeProfile.max_owned_classes ?? '--'} 个班级</dd>
                    </div>
                    <div>
                      <dt>单班成员上限</dt>
                      <dd>{activeProfile.max_class_members ?? '--'} 人</dd>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>{summaryEmptyMessage ?? '暂无档案'}</p>
                </div>
              )}
            </article>

            <article className="data-card compact-card">
              <div className="section-heading">
                <span className="section-eyebrow">Notes</span>
                <h3>写操作说明</h3>
              </div>
              <div className="status-panel">
                <strong>真实写操作已启用</strong>
                <p>编辑、清空和删除按钮会调用当前账号下的真实 Supabase 写接口，并在操作成功后自动刷新列表。</p>
              </div>
            </article>
          </div>
        </div>
      ) : null}

      {dialog.type === 'edit' && dialog.profile ? (
        <DialogShell
          title="编辑档案"
          onClose={() =>
            setDialog({
              type: null,
              profile: null,
              draft: null,
            })
          }
          footer={
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setDialog({
                    type: null,
                    profile: null,
                    draft: null,
                  })
                }
              >
                取消
              </button>
              <button className="primary-button" type="submit" form="users-edit-form" disabled={saving}>
                {saving ? '保存中...' : '保存修改'}
              </button>
            </>
          }
        >
          <form id="users-edit-form" className="users-form" onSubmit={handleSaveProfile}>
            <div className="users-form-grid">
              <label className="field">
                <span className="field-label">档案名称</span>
                <input
                  className="field-input"
                  value={dialog.draft?.profile_name ?? ''}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        profile_name: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">头像颜色</span>
                <input
                  className="field-input"
                  value={dialog.draft?.avatar_color ?? ''}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        avatar_color: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">显示顺序</span>
                <input
                  className="field-input"
                  type="number"
                  value={dialog.draft?.display_order ?? 0}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        display_order: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">班级上限</span>
                <input
                  className="field-input"
                  type="number"
                  value={dialog.draft?.max_owned_classes ?? ''}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        max_owned_classes: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">单班成员上限</span>
                <input
                  className="field-input"
                  type="number"
                  value={dialog.draft?.max_class_members ?? ''}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      draft: {
                        ...current.draft,
                        max_class_members: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>

            <label className="users-checkbox">
              <input
                checked={Boolean(dialog.draft?.is_default)}
                type="checkbox"
                onChange={(event) =>
                  setDialog((current) => ({
                    ...current,
                    draft: {
                      ...current.draft,
                      is_default: event.target.checked,
                    },
                  }))
                }
              />
              <span>设为默认档案</span>
            </label>
          </form>
        </DialogShell>
      ) : null}

      {dialog.type === 'clear' && dialog.profile ? (
        <DialogShell
          title="清空档案数据"
          variant="danger"
          onClose={() =>
            setDialog({
              type: null,
              profile: null,
              draft: null,
            })
          }
          footer={
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setDialog({
                    type: null,
                    profile: null,
                    draft: null,
                  })
                }
              >
                取消
              </button>
              <button className="primary-button" type="button" disabled={saving} onClick={handleConfirmAction}>
                {saving ? '清空中...' : '确认清空'}
              </button>
            </>
          }
        >
          <p className="users-modal-copy">
            确认后会删除该档案下的学习计划、任务、行为习惯、设置和考试记录，但保留档案本身。
          </p>
          <div className="users-modal-summary">
            <strong>{dialog.profile.profile_name}</strong>
            <span>{dialog.profile.id}</span>
          </div>
        </DialogShell>
      ) : null}

      {dialog.type === 'delete' && dialog.profile ? (
        <DialogShell
          title="删除档案"
          variant="danger"
          onClose={() =>
            setDialog({
              type: null,
              profile: null,
              draft: null,
            })
          }
          footer={
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setDialog({
                    type: null,
                    profile: null,
                    draft: null,
                  })
                }
              >
                取消
              </button>
              <button className="primary-button users-danger-button" type="button" disabled={saving} onClick={handleConfirmAction}>
                {saving ? '删除中...' : '确认删除'}
              </button>
            </>
          }
        >
          <p className="users-modal-copy">
            确认后会先清空该档案的全部数据，再删除档案记录。这一步会直接影响线上数据。
          </p>
          <div className="users-modal-summary">
            <strong>{dialog.profile.profile_name}</strong>
            <span>{dialog.profile.id}</span>
          </div>
        </DialogShell>
      ) : null}
    </section>
  )
}

export default UsersPage
