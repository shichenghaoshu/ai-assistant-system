import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { normalizePracticeDraft } from '../features/weakness/weaknessApi.js'
import { useWeaknessAddPageData } from '../features/weakness/useWeaknessAddPageData.js'
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

function getSubjectLabel(subject) {
  return subject?.subjectName ?? subject?.display_name ?? subject?.name ?? '未分类'
}

function WeaknessAddPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, currentProfile, subjects, recentSubmissions, submitPracticeRecord, requestPracticeDraft, refresh } = useWeaknessAddPageData(
    session?.user?.id,
  )
  const [form, setForm] = useState({
    subject_id: '',
    practice_title: '',
    practice_date: new Date().toISOString().slice(0, 10),
    total_questions: '',
    correct_questions: '',
    note: '',
    raw_text: '',
  })
  const [banner, setBanner] = useState(null)
  const [drafting, setDrafting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!form.subject_id && subjects.length > 0) {
      setForm((current) => ({
        ...current,
        subject_id: String(subjects[0].id),
      }))
    }
  }, [subjects, form.subject_id])

  const isLoading = authLoading || loading

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!currentProfile) {
      return
    }

    setSubmitting(true)
    setBanner(null)

    try {
      await submitPracticeRecord(currentProfile.id, {
        subject_id: form.subject_id,
        practice_title: form.practice_title,
        practice_date: form.practice_date,
        total_questions: form.total_questions === '' ? null : Number(form.total_questions),
        correct_questions: form.correct_questions === '' ? null : Number(form.correct_questions),
        note: form.note,
        raw_text: form.raw_text,
      })

      setBanner({
        variant: 'success',
        message: '练习记录已保存',
      })

      await refresh()
    } catch (error) {
      setBanner({
        variant: 'error',
        message: error?.message || '提交练习记录失败',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGenerateDraft() {
    setDrafting(true)
    setBanner(null)

    try {
      const draft = normalizePracticeDraft(
        await requestPracticeDraft({
          text: form.raw_text,
          subjectId: form.subject_id,
          profileId: currentProfile?.id ?? null,
        }),
      )

      setForm((current) => ({
        ...current,
        subject_id: draft.subject_id || current.subject_id,
        practice_title: draft.practice_title || current.practice_title,
        practice_date: draft.practice_date || current.practice_date,
        total_questions: draft.total_questions || current.total_questions,
        correct_questions: draft.correct_questions || current.correct_questions,
        note: draft.note || current.note,
        raw_text: draft.raw_text || current.raw_text,
      }))

      setBanner({
        variant: 'success',
        message: 'AI 草稿已填充',
      })
    } catch (error) {
      setBanner({
        variant: 'error',
        message: error?.message || '生成 AI 草稿失败',
      })
    } finally {
      setDrafting(false)
    }
  }

  return (
    <section className="route-panel app-page weakness-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Weakness</div>
          <h2 className="page-title">提交练习记录</h2>
        </div>
        <p className="page-note">手动提交练习记录或用 AI 文本草稿快速填充表单，保存后会刷新当前档案的练习侧栏数据。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载练习记录表单...</div> : null}

      {!isLoading && error ? <div className="inline-state inline-state-error">暂时无法加载练习记录表单，请稍后重试。</div> : null}

      {!isLoading && !error && !currentProfile ? (
        <div className="empty-state">
          <p>暂无可用档案</p>
        </div>
      ) : null}

      {!isLoading && !error && currentProfile ? (
        <div className="weakness-add-layout">
          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Form</span>
              <h3>练习记录表单</h3>
            </div>

            {banner ? <div className={`feedback-banner ${banner.variant === 'success' ? 'is-success' : 'is-error'}`}>{banner.message}</div> : null}

            <form className="weakness-form" onSubmit={handleSubmit}>
              <div className="weakness-form-grid">
                <label className="field">
                  <span className="field-label">学科</span>
                  <select
                    className="field-input"
                    value={form.subject_id}
                    onChange={(event) => updateField('subject_id', event.target.value)}
                  >
                    <option value="">请选择学科</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={String(subject.id)}>
                        {getSubjectLabel(subject)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">练习名称</span>
                  <input
                    className="field-input"
                    value={form.practice_title}
                    onChange={(event) => updateField('practice_title', event.target.value)}
                    placeholder="例如：函数练习"
                  />
                </label>

                <label className="field">
                  <span className="field-label">练习日期</span>
                  <input
                    className="field-input"
                    type="date"
                    value={form.practice_date}
                    onChange={(event) => updateField('practice_date', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">总题数</span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={form.total_questions}
                    onChange={(event) => updateField('total_questions', event.target.value)}
                    placeholder="20"
                  />
                </label>

                <label className="field">
                  <span className="field-label">正确题数</span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={form.correct_questions}
                    onChange={(event) => updateField('correct_questions', event.target.value)}
                    placeholder="16"
                  />
                </label>

                <label className="field">
                  <span className="field-label">备注</span>
                  <input
                    className="field-input"
                    value={form.note}
                    onChange={(event) => updateField('note', event.target.value)}
                    placeholder="简单记录一下这次练习"
                  />
                </label>
              </div>

              <label className="field">
                <span className="field-label">AI 文本草稿</span>
                <textarea
                  className="field-input field-textarea"
                  value={form.raw_text}
                  onChange={(event) => updateField('raw_text', event.target.value)}
                  placeholder="粘贴练习题、批改记录或错题摘要，交给 AI 先整理一版草稿。"
                />
              </label>

              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={handleGenerateDraft} disabled={drafting}>
                  {drafting ? '生成中...' : '生成 AI 草稿'}
                </button>
                <button className="primary-button" type="submit" disabled={submitting || !form.subject_id}>
                  {submitting ? '提交中...' : '提交练习记录'}
                </button>
              </div>
            </form>
          </article>

          <aside className="side-column">
            <article className="data-card compact-card">
              <div className="section-heading">
                <span className="section-eyebrow">Profile</span>
                <h3>当前档案</h3>
              </div>

              <div className="settings-note-box">
                <span>{currentProfile.profile_name ?? '当前档案'}</span>
                <strong>{session?.user?.email ?? '--'}</strong>
              </div>

              <div className="settings-note-box">
                <span>最近更新</span>
                <strong>{formatDate(currentProfile.updated_at ?? currentProfile.created_at)}</strong>
              </div>
            </article>

            <article className="data-card compact-card">
              <div className="section-heading">
                <span className="section-eyebrow">Recent</span>
                <h3>最近提交</h3>
              </div>

              {recentSubmissions.length === 0 ? (
                <div className="empty-state">
                  <p>暂无最近提交</p>
                </div>
              ) : (
                <div className="record-list record-list-compact">
                  {recentSubmissions.slice(0, 4).map((submission) => (
                    <article key={submission.id} className="record-item">
                      <div className="record-main">
                        <div className="record-title">{submission.title}</div>
                        <div className="record-meta">
                          <span>{submission.subjectName}</span>
                          <span>{formatDate(submission.practiceDate)}</span>
                        </div>
                      </div>
                      <span className="status-pill">{submission.totalQuestions ? `${submission.correctQuestions}/${submission.totalQuestions}` : '已记录'}</span>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="data-card compact-card">
              <div className="section-heading">
                <span className="section-eyebrow">Guide</span>
                <h3>填写建议</h3>
              </div>
              <div className="settings-guide">
                <p>如果只有文本摘要，可以先交给 AI 草稿，再补全总题数和正确题数。</p>
                <p>提交后会自动回到薄弱知识分析中，便于检查新记录是否带来新的薄弱点。</p>
                <p className="settings-guide-tip">题数为空时也可以提交，但分析精度会下降。</p>
              </div>
              <div className="settings-note-box">
                <span>学科数量</span>
                <strong>{subjects.length}</strong>
              </div>
              <div className="settings-note-box">
                <span>最近提交数</span>
                <strong>{recentSubmissions.length}</strong>
              </div>
              <Link className="secondary-link" to="/weakness">
                返回薄弱知识分析
              </Link>
            </article>
          </aside>
        </div>
      ) : null}
    </section>
  )
}

export default WeaknessAddPage
