import { useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useAccountPasswordPageData } from '../features/system-tools/useAccountPasswordPageData.js'
import '../styles/system-tools.css'

function AccountPasswordPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { updating, banner, changePassword } = useAccountPasswordPageData()
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  const [localBanner, setLocalBanner] = useState(null)
  const isLoading = authLoading

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      setLocalBanner({
        variant: 'error',
        message: '两次输入的密码不一致',
      })
      return
    }

    setLocalBanner(null)
    await changePassword(form.newPassword)
  }

  const activeBanner = banner ?? localBanner

  return (
    <section className="route-panel app-page system-tools-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Settings</div>
          <h2 className="page-title">账号密码修改</h2>
        </div>
        <p className="page-note">使用当前登录会话直接更新 Supabase Auth 密码，不需要离开当前站点。</p>
      </div>

      {isLoading ? <div className="inline-state">加载中...</div> : null}

      {!isLoading ? (
        <div className="page-stack">
          {activeBanner ? (
            <div className={`feedback-banner ${activeBanner.variant === 'success' ? 'is-success' : 'is-error'}`}>
              {activeBanner.message}
            </div>
          ) : null}

          <article className="data-card system-tool-card">
            <div className="section-heading">
              <span className="section-eyebrow">Password</span>
              <h3>更新登录密码</h3>
            </div>

            <form className="system-tool-form" onSubmit={handleSubmit}>
              <div className="system-tool-note">
                <span>当前账号</span>
                <strong>{session?.user?.email ?? '--'}</strong>
              </div>

              <label className="field">
                <span className="field-label">新密码</span>
                <input
                  className="field-input"
                  aria-label="新密码"
                  type="password"
                  value={form.newPassword}
                  onChange={(event) => updateField('newPassword', event.target.value)}
                  autoComplete="new-password"
                />
              </label>

              <label className="field">
                <span className="field-label">确认新密码</span>
                <input
                  className="field-input"
                  aria-label="确认新密码"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  autoComplete="new-password"
                />
              </label>

              <div className="rewards-action-row">
                <button className="primary-button" type="submit" disabled={updating || !form.newPassword || !form.confirmPassword}>
                  {updating ? '更新中...' : '更新密码'}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default AccountPasswordPage
