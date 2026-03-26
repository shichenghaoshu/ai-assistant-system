import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatAuthError, redeemMembershipCode, useAuthSession } from '../auth/session.js'
import { useRedeemPageData } from '../features/redeem/useRedeemPageData.js'

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
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getRecordTypeName(record) {
  if (record?.membership_type?.display_name) {
    return record.membership_type.display_name
  }

  if (record?.membership_type?.name) {
    return record.membership_type.name
  }

  return record?.membership_type_name || '未知会员'
}

function RedeemPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, membershipTypes, redemptionRecords, refresh } = useRedeemPageData(session?.user?.id)
  const [code, setCode] = useState('')
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    message: '',
  })

  const isLoading = authLoading || loading
  const isSubmitting = submitState.status === 'submitting'

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitState({
      status: 'submitting',
      message: '',
    })

    const result = await redeemMembershipCode(code)

    if (!result.success) {
      setSubmitState({
        status: 'error',
        message: formatAuthError(result.error),
      })
      return
    }

    setSubmitState({
      status: 'success',
      message: result.data?.message || '兑换成功',
    })
    setCode('')
    await Promise.resolve(refresh())
  }

  return (
    <section className="route-panel app-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Redeem</div>
          <h2 className="page-title">兑换会员码</h2>
        </div>
        <p className="page-note">只有在你点击提交后才会调用真实兑换接口，页面不会自动发起写操作。</p>
      </div>

      <div className="split-grid split-grid-emphasis">
        <article className="data-card">
          <div className="section-heading">
            <span className="section-eyebrow">Redeem Form</span>
            <h3>提交会员兑换码</h3>
          </div>
          <form className="redeem-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">会员兑换码</span>
              <input
                className="field-input"
                name="membershipCode"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="请输入兑换码"
                autoComplete="off"
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={isSubmitting || !code.trim()}>
                {isSubmitting ? '提交中...' : '立即兑换'}
              </button>
              <Link className="secondary-link" to="/membership">
                查看会员中心
              </Link>
            </div>
            {submitState.message ? (
              <div className={`feedback-banner ${submitState.status === 'success' ? 'is-success' : 'is-error'}`}>
                {submitState.message}
              </div>
            ) : null}
          </form>
        </article>

        <aside className="side-column">
          <article className="data-card compact-card">
            <div className="section-heading">
              <span className="section-eyebrow">Recent Redemptions</span>
              <h3>最近兑换记录</h3>
            </div>
            {isLoading ? <div className="inline-state">正在刷新记录...</div> : null}
            {!isLoading && error ? (
              <div className="inline-state inline-state-error">暂时无法读取兑换侧栏数据。</div>
            ) : null}
            {!isLoading && !error ? (
              redemptionRecords.length === 0 ? (
                <div className="empty-state">
                  <p>暂无兑换记录</p>
                </div>
              ) : (
                <div className="record-list record-list-compact">
                  {redemptionRecords.map((record) => (
                    <article key={record.id ?? `${record.redeemed_at}-${record.code ?? 'record'}`} className="record-item">
                      <div className="record-main">
                        <div className="record-title">{getRecordTypeName(record)}</div>
                        <div className="record-meta">
                          <span>{record.status || '已记录'}</span>
                          <span>{formatDateTime(record.redeemed_at ?? record.created_at)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}
          </article>

          <article className="data-card compact-card">
            <div className="section-heading">
              <span className="section-eyebrow">Available Types</span>
              <h3>可兑换会员类型</h3>
            </div>
            {membershipTypes.length === 0 ? (
              <div className="empty-state">
                <p>当前未读取到可用会员类型</p>
              </div>
            ) : (
              <div className="type-list">
                {membershipTypes.map((type) => (
                  <div key={type.id} className="type-list-item">
                    <strong>{type.display_name || type.name}</strong>
                    <span>{type.duration_days ? `${type.duration_days} 天` : '长期有效'}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </aside>
      </div>
    </section>
  )
}

export default RedeemPage
