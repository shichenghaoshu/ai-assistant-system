import { useMemo, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useExamAiAddPageData } from '../features/exams/useExamsPageData.js'
import '../styles/exams.css'

function createSubmissionFromDraft(draft) {
  const row = {
    subject: draft.subject || draft.subject_name || '',
    score: draft.score ?? '',
    full_score: draft.full_score ?? '100',
    rank: draft.rank ?? '',
    class_average: draft.class_average ?? '',
    class_highest: draft.class_highest ?? '',
    grade_rank: draft.grade_rank ?? '',
    rank_type: draft.rank_type ?? '年级排名',
    exam_date: draft.exam_date ?? new Date().toLocaleDateString('en-CA'),
    notes: draft.notes ?? '',
  }

  return {
    form: {
      exam_name: draft.exam_name || '',
      exam_type: draft.exam_type || '',
      grade_level: draft.grade_level || '',
      semester: draft.semester || '',
      exam_date: draft.exam_date || new Date().toLocaleDateString('en-CA'),
      topic: draft.topic || '',
      difficulty: draft.difficulty || '',
      total_rank: draft.total_rank || '',
      total_grade_rank: draft.total_grade_rank || '',
      total_rank_type: draft.total_rank_type || '年级排名',
      class_total_average: draft.class_total_average || '',
      class_total_highest: draft.class_total_highest || '',
      notes: draft.notes || '',
    },
    rows: [row],
  }
}

function ExamsAiAddPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, profileLoading, profileError, currentProfile, subjects, requestExamDraft, saveExamSubmission, generating, saving } =
    useExamAiAddPageData(session?.user?.id)
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState(null)
  const [banner, setBanner] = useState(null)

  const isLoading = authLoading || profileLoading || loading
  const resolvedError = profileError || error
  const subjectOptions = useMemo(() => subjects.filter((subject) => subject.is_active !== false), [subjects])

  async function handleGenerate() {
    try {
      const nextDraft = await requestExamDraft({
        userInput: prompt,
        messages: [],
        currentDraft: draft,
      })
      setDraft(nextDraft)
      setBanner({ variant: 'success', message: nextDraft.assistant_message || '已生成草案，请检查后保存' })
    } catch (draftError) {
      setBanner({
        variant: 'error',
        message: draftError instanceof Error ? draftError.message : '生成草案失败',
      })
    }
  }

  async function handleSave() {
    if (!currentProfile?.id || !draft) {
      setBanner({ variant: 'error', message: '请先生成成绩草案' })
      return
    }

    try {
      const { form, rows } = createSubmissionFromDraft(draft)
      await saveExamSubmission(currentProfile.id, form, rows, false)
      setBanner({ variant: 'success', message: '草案成绩已保存' })
    } catch (saveError) {
      setBanner({
        variant: 'error',
        message: saveError instanceof Error ? saveError.message : '保存失败',
      })
    }
  }

  return (
    <section className="route-panel app-page exams-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Exams</div>
          <h2 className="page-title">AI添加考试成绩</h2>
        </div>
        <p className="page-note">把成绩描述交给 AI 生成草案，再确认后写入真实的 `exam_records`。当前实现保留了生成草案和保存两步。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载考试数据...</div> : null}
      {!isLoading && resolvedError ? <div className="inline-state inline-state-error">暂时无法加载考试数据，请稍后重试。</div> : null}

      {!isLoading && !resolvedError ? (
        currentProfile ? (
          <div className="page-stack">
          {banner ? <div className={`feedback-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div> : null}

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">AI Exam Assistant</span>
              <h3>AI 成绩助手</h3>
            </div>

            <div className="exams-card-stack">
              <label className="field">
                <span className="field-label">描述成绩信息，可上传试卷...</span>
                <textarea
                  className="field-input"
                  rows={5}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="例如：数学95分，第一次月考，年级第8名"
                />
              </label>

              <div className="exams-actions">
                <button className="primary-button" type="button" disabled={generating || !prompt.trim()} onClick={handleGenerate}>
                  {generating ? '生成中...' : '生成草案'}
                </button>
                <button className="secondary-button" type="button" disabled={saving || !draft} onClick={handleSave}>
                  {saving ? '保存中...' : '保存草案成绩'}
                </button>
              </div>
            </div>
          </article>

          {draft ? (
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Draft</span>
                <h3>草案预览</h3>
              </div>

              <div className="exams-draft-preview">
                <div>
                  <strong>{draft.assistant_message || '已生成草案'}</strong>
                </div>
                <div className="exams-form-grid exams-form-grid--three">
                  <div>
                    <span className="summary-meta">考试名称</span>
                    <div className="record-title">{draft.exam_name || '--'}</div>
                  </div>
                  <div>
                    <span className="summary-meta">考试类型</span>
                    <div className="record-title">{draft.exam_type || '--'}</div>
                  </div>
                  <div>
                    <span className="summary-meta">科目</span>
                    <div className="record-title">{draft.subject || draft.subject_name || '--'}</div>
                  </div>
                  <div>
                    <span className="summary-meta">得分</span>
                    <div className="record-title">
                      {draft.score ?? '--'} / {draft.full_score ?? '--'}
                    </div>
                  </div>
                  <div>
                    <span className="summary-meta">学期</span>
                    <div className="record-title">{draft.semester || '--'}</div>
                  </div>
                  <div>
                    <span className="summary-meta">考试日期</span>
                    <div className="record-title">{draft.exam_date || '--'}</div>
                  </div>
                </div>
                <div className="record-meta">
                  <span>{subjectOptions.length} 个可用科目</span>
                  <span>{currentProfile?.profile_name ?? '未找到档案'}</span>
                </div>
              </div>
            </article>
          ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <p>暂无可用档案</p>
          </div>
        )
      ) : null}
    </section>
  )
}

export default ExamsAiAddPage
