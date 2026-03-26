import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useAuthSession } from '../auth/session.js'
import { useExamEditPageData } from '../features/exams/useExamsPageData.js'
import '../styles/exams.css'

const EXAM_TYPES = ['月考', '期中考试', '期末考试', '模拟考试', '单元测试', '周测', '随堂测验']
const DIFFICULTIES = ['简单', '中等', '困难', '较难']
const RANK_TYPES = ['年级排名', '校排名', '区排名', '市排名']

function buildFormFromRecord(record) {
  return {
    subject: record.subject || '',
    exam_name: record.exam_name || '',
    exam_type: record.exam_type || '',
    semester: record.semester || '',
    exam_date: record.exam_date || '',
    score: record.score ?? '',
    full_score: record.full_score ?? '100',
    grade_level: record.grade_level || '',
    topic: record.topic || '',
    difficulty: record.difficulty || '',
    notes: record.notes || '',
    rank: record.rank ?? '',
    class_average: record.class_average ?? '',
    class_highest: record.class_highest ?? '',
    grade_rank: record.grade_rank ?? '',
    rank_type: record.rank_type || '年级排名',
  }
}

function ExamEditForm({ currentProfile, record, recordId, saveExamRecord, saving }) {
  const [banner, setBanner] = useState(null)
  const [form, setForm] = useState(() => buildFormFromRecord(record))

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!currentProfile?.id || !recordId) {
      setBanner({ variant: 'error', message: '无法定位要编辑的考试记录' })
      return
    }

    try {
      await saveExamRecord(currentProfile.id, recordId, form)
      setBanner({ variant: 'success', message: '修改已保存' })
    } catch (saveError) {
      setBanner({
        variant: 'error',
        message: saveError instanceof Error ? saveError.message : '保存失败',
      })
    }
  }

  return (
    <div className="page-stack">
      {banner ? <div className={`feedback-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div> : null}

      <form className="data-card exams-card-stack" onSubmit={handleSubmit}>
        <div className="section-heading">
          <span className="section-eyebrow">Record</span>
          <h3>编辑当前记录</h3>
        </div>

        <div className="exams-form-grid exams-form-grid--two">
          <label className="field">
            <span className="field-label">科目</span>
            <select className="field-input" value={form.subject} onChange={(event) => updateForm('subject', event.target.value)}>
              <option value="">请选择科目</option>
              <option value={form.subject}>{form.subject || '未命名科目'}</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">考试名称</span>
            <input className="field-input" value={form.exam_name} onChange={(event) => updateForm('exam_name', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">考试类型</span>
            <select className="field-input" value={form.exam_type} onChange={(event) => updateForm('exam_type', event.target.value)}>
              <option value="">请选择</option>
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">学期</span>
            <input className="field-input" value={form.semester} onChange={(event) => updateForm('semester', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">考试日期</span>
            <input className="field-input" type="date" value={form.exam_date} onChange={(event) => updateForm('exam_date', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">得分</span>
            <input className="field-input" value={form.score} onChange={(event) => updateForm('score', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">满分</span>
            <input className="field-input" value={form.full_score} onChange={(event) => updateForm('full_score', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">专题/章节</span>
            <input className="field-input" value={form.topic} onChange={(event) => updateForm('topic', event.target.value)} />
          </label>
        </div>

        <div className="exams-form-grid exams-form-grid--three" style={{ marginTop: 16 }}>
          <label className="field">
            <span className="field-label">年级</span>
            <input className="field-input" value={form.grade_level} onChange={(event) => updateForm('grade_level', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">难度</span>
            <select className="field-input" value={form.difficulty} onChange={(event) => updateForm('difficulty', event.target.value)}>
              <option value="">选择难度（可选）</option>
              {DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">排名类型</span>
            <select className="field-input" value={form.rank_type} onChange={(event) => updateForm('rank_type', event.target.value)}>
              {RANK_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">排名</span>
            <input className="field-input" value={form.rank} onChange={(event) => updateForm('rank', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">班级平均</span>
            <input className="field-input" value={form.class_average} onChange={(event) => updateForm('class_average', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">班级最高</span>
            <input className="field-input" value={form.class_highest} onChange={(event) => updateForm('class_highest', event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">年级排名</span>
            <input className="field-input" value={form.grade_rank} onChange={(event) => updateForm('grade_rank', event.target.value)} />
          </label>
        </div>

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-label">备注</span>
          <textarea className="field-input" rows={3} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
        </label>

        <div className="exams-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </button>
          <div className="inline-state">当前档案：{currentProfile?.profile_name ?? '--'}</div>
        </div>
      </form>
    </div>
  )
}

function ExamsEditPage() {
  const { loading: authLoading, session } = useAuthSession()
  const [searchParams] = useSearchParams()
  const recordId = searchParams.get('id') || searchParams.get('record_id') || ''
  const { loading, error, profileLoading, profileError, currentProfile, record, saveExamRecord, saving } = useExamEditPageData(
    session?.user?.id,
    recordId,
  )

  const isLoading = authLoading || profileLoading || loading
  const resolvedError = profileError || error
  return (
    <section className="route-panel app-page exams-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Exams</div>
          <h2 className="page-title">编辑考试成绩</h2>
        </div>
        <p className="page-note">读取单条考试记录后再写回同一条 `exam_records`。没有 `id` 时不会尝试提交。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载考试记录...</div> : null}
      {!isLoading && resolvedError ? <div className="inline-state inline-state-error">暂时无法加载考试记录，请稍后重试。</div> : null}
      {!isLoading && !resolvedError && !recordId ? (
        <div className="empty-state">
          <p>请选择要编辑的考试记录</p>
        </div>
      ) : null}

      {!isLoading && !resolvedError && recordId ? (
        currentProfile ? (
          record ? (
            <ExamEditForm
              key={record.id}
              currentProfile={currentProfile}
              record={record}
              recordId={recordId}
              saveExamRecord={saveExamRecord}
              saving={saving}
            />
          ) : (
            <div className="empty-state">
              <p>未找到这条考试记录</p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <p>暂无可用档案</p>
          </div>
        )
      ) : null}
    </section>
  )
}

export default ExamsEditPage
