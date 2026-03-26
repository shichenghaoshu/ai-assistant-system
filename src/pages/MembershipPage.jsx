import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useMembershipPageData } from '../features/membership/useMembershipPageData.js'

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

function normalizeFeatures(features) {
  if (Array.isArray(features)) {
    return features.filter(Boolean)
  }

  if (typeof features === 'string') {
    return features
      .split(/[\n,，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function getMembershipField(membership, keys, fallback = '--') {
  if (!membership || typeof membership !== 'object') {
    return fallback
  }

  for (const key of keys) {
    if (membership[key] !== undefined && membership[key] !== null && membership[key] !== '') {
      return membership[key]
    }
  }

  return fallback
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

function MembershipPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, membership, membershipUnavailable, membershipTypes, redemptionRecords } =
    useMembershipPageData(session?.user?.id)

  const isLoading = authLoading || loading

  return (
    <section className="route-panel app-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Membership</div>
          <h2 className="page-title">会员中心</h2>
        </div>
        <p className="page-note">展示真实会员类型与兑换历史。RPC 缺失时回退为明确提示，不中断页面渲染。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载会员信息...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载会员页数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          <div className="split-grid split-grid-emphasis">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Current Status</span>
                <h3>当前会员状态</h3>
              </div>

              {membershipUnavailable ? (
                <div className="status-panel is-warning">
                  <strong>暂时无法读取会员状态</strong>
                  <p>本地客户端调用 `get_user_membership` RPC 失败，已按正常回退路径处理。</p>
                </div>
              ) : membership === null ? (
                <div className="status-panel">
                  <strong>当前未激活会员</strong>
                  <p>还没有读到有效会员状态，你可以先查看可用套餐或前往兑换会员码。</p>
                </div>
              ) : (
                <div className="status-grid">
                  <div className="status-cell">
                    <span>当前套餐</span>
                    <strong>{getMembershipField(membership, ['display_name', 'membership_name', 'name'])}</strong>
                  </div>
                  <div className="status-cell">
                    <span>状态</span>
                    <strong>{getMembershipField(membership, ['status', 'membership_status'], '未知')}</strong>
                  </div>
                  <div className="status-cell">
                    <span>到期时间</span>
                    <strong>{getMembershipField(membership, ['expires_at', 'expire_at', 'end_at'])}</strong>
                  </div>
                  <div className="status-cell">
                    <span>当前账号</span>
                    <strong>{session?.user?.email ?? '--'}</strong>
                  </div>
                </div>
              )}
            </article>

            <article className="data-card compact-card">
              <div className="section-heading">
                <span className="section-eyebrow">Actions</span>
                <h3>常用操作</h3>
              </div>
              <div className="action-stack">
                <Link className="quick-link-card" to="/redeem">
                  <span className="quick-link-title">前往兑换会员码</span>
                  <span className="quick-link-note">手动提交兑换码，不会自动触发写操作</span>
                </Link>
                <div className="hint-box">
                  <span>可用套餐</span>
                  <strong>{membershipTypes.length}</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Membership Types</span>
              <h3>会员类型</h3>
            </div>
            <div className="type-grid">
              {membershipTypes.map((type) => {
                const features = normalizeFeatures(type.features)

                return (
                  <article key={type.id} className="type-card">
                    <div className="type-head">
                      <div>
                        <div className="record-title">{type.display_name || type.name}</div>
                        <div className="record-meta">
                          <span>{type.duration_days ? `${type.duration_days} 天` : '长期有效'}</span>
                          <span>{type.name}</span>
                        </div>
                      </div>
                      <span className="status-pill">{type.is_active ? '可用' : '停用'}</span>
                    </div>
                    <p className="type-description">{type.description || '暂无说明'}</p>
                    <div className="feature-row">
                      {features.length > 0 ? (
                        features.map((feature) => (
                          <span key={feature} className="feature-pill">
                            {feature}
                          </span>
                        ))
                      ) : (
                        <span className="feature-pill feature-pill-muted">暂无特性说明</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </article>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">History</span>
              <h3>兑换历史</h3>
            </div>
            {redemptionRecords.length === 0 ? (
              <div className="empty-state">
                <p>还没有兑换记录</p>
                <Link className="inline-link" to="/redeem">
                  去兑换会员码
                </Link>
              </div>
            ) : (
              <div className="record-list">
                {redemptionRecords.map((record) => (
                  <article key={record.id ?? `${record.redeemed_at}-${record.code ?? 'record'}`} className="record-item">
                    <div className="record-main">
                      <div className="record-title">{getRecordTypeName(record)}</div>
                      <div className="record-meta">
                        <span>{record.status || '未知状态'}</span>
                        <span>{formatDateTime(record.redeemed_at ?? record.created_at)}</span>
                      </div>
                    </div>
                    <span className={`status-pill ${record.status === 'success' ? 'is-success' : ''}`}>
                      {record.status || '已记录'}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default MembershipPage
