import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useWeaknessPageData } from '../features/weakness/useWeaknessPageData.js'
import '../styles/weakness.css'

function formatDate(value) {
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
  }).format(date)
}

function formatPercent(value) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0%'
  }

  if (numeric <= 1) {
    return `${Math.round(numeric * 100)}%`
  }

  return `${Math.round(numeric)}%`
}

function formatRatio(correctQuestions, totalQuestions) {
  if (!totalQuestions) {
    return '暂无题数'
  }

  return `${correctQuestions}/${totalQuestions}`
}

function WeaknessPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, summary, weaknessReports, recentSubmissions, subjectSummaries } =
    useWeaknessPageData(session?.user?.id)

  const isLoading = authLoading || loading

  return (
    <section className="route-panel app-page weakness-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Weakness</div>
          <h2 className="page-title">薄弱知识</h2>
        </div>
        <p className="page-note">读取当前档案的薄弱知识报告、知识点和练习记录，优先展示真实数据，缺失时保持明确空态。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载薄弱知识数据...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载薄弱知识数据，请稍后重试。</div> : null}

      {!isLoading && !error ? (
        <div className="page-stack">
          <div className="weakness-summary-grid">
            <article className="data-card weakness-summary-card">
              <span className="section-eyebrow">Profile</span>
              <h3>{currentProfile?.profile_name ?? '当前档案'}</h3>
              <p className="settings-copy settings-copy-muted">当前账号下的薄弱知识分析仅针对这一个档案。</p>
            </article>
            <article className="data-card weakness-summary-card">
              <span className="section-eyebrow">Summary</span>
              <strong>{summary.weaknessReportCount}</strong>
              <p>薄弱知识点</p>
            </article>
            <article className="data-card weakness-summary-card">
              <span className="section-eyebrow">Practice</span>
              <strong>{summary.practiceSubmissionCount}</strong>
              <p>练习记录</p>
            </article>
            <article className="data-card weakness-summary-card">
              <span className="section-eyebrow">Subjects</span>
              <strong>{summary.subjectCount}</strong>
              <p>学科数量</p>
            </article>
          </div>

          <div className="split-grid split-grid-emphasis weakness-main-grid">
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Analysis</span>
                <h3>薄弱知识分析</h3>
              </div>

              {weaknessReports.length === 0 ? (
                <div className="empty-state">
                  <p>当前还没有可分析的薄弱知识记录</p>
                  <Link className="inline-link" to="/weakness/add">
                    去提交练习记录
                  </Link>
                </div>
              ) : (
                <div className="weakness-card-list">
                  {weaknessReports.map((report) => (
                    <article key={report.id} className="weakness-report-card">
                      <div className="weakness-report-head">
                        <div>
                          <div className="record-title">{report.title}</div>
                          <div className="record-meta">
                            <span>{report.subjectName}</span>
                            <span>最近 {formatDate(report.lastPracticedAt)}</span>
                          </div>
                        </div>
                        <span className="status-pill is-warning">{formatPercent(report.weaknessScore)}</span>
                      </div>

                      <div className="weakness-report-stats">
                        <span>错误 {report.errorCount}</span>
                        <span>练习 {report.practiceCount}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Subjects</span>
                <h3>学科分布</h3>
              </div>

              {subjectSummaries.length === 0 ? (
                <div className="empty-state">
                  <p>暂无学科统计</p>
                </div>
              ) : (
                <div className="weakness-subject-list">
                  {subjectSummaries.map((item) => (
                    <article key={item.subjectId ?? item.subjectName} className="weakness-subject-card">
                      <div className="record-title">{item.subjectName}</div>
                      <div className="record-meta">
                        <span>{item.weaknessCount} 个薄弱点</span>
                        <span>{item.submissionCount} 次练习</span>
                      </div>
                      <div className="weakness-meter">
                        <span style={{ width: `${Math.min(100, Math.max(0, item.latestScore * 100))}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </div>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Recent</span>
              <h3>近期练习记录</h3>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="empty-state">
                <p>当前还没有练习记录</p>
                <Link className="inline-link" to="/weakness/add">
                  去提交练习记录
                </Link>
              </div>
            ) : (
              <div className="record-list">
                {recentSubmissions.map((submission) => (
                  <article key={submission.id} className="record-item">
                    <div className="record-main">
                      <div className="record-title">{submission.title}</div>
                      <div className="record-meta">
                        <span>{submission.subjectName}</span>
                        <span>{formatDate(submission.practiceDate)}</span>
                        <span>{formatRatio(submission.correctQuestions, submission.totalQuestions)}</span>
                      </div>
                    </div>
                    <span className="status-pill">{submission.note || '已记录'}</span>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="data-card weakness-action-card">
            <div className="section-heading">
              <span className="section-eyebrow">Action</span>
              <h3>快捷入口</h3>
            </div>
            <div className="quick-link-grid">
              <Link className="quick-link-card" to="/weakness/add">
                <span className="quick-link-title">去提交练习记录</span>
                <span className="quick-link-note">上传本次练习并生成新的薄弱知识分析</span>
              </Link>
              <Link className="quick-link-card" to="/exams/add">
                <span className="quick-link-title">录入考试成绩</span>
                <span className="quick-link-note">考试数据也会参与薄弱知识判断</span>
              </Link>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default WeaknessPage
