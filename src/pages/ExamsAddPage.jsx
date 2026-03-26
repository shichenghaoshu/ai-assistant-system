import { useMemo, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useExamAddPageData } from '../features/exams/useExamsPageData.js'
import '../styles/exams.css'

const EXAM_TYPES = ['月考', '期中考试', '期末考试', '模拟考试', '单元测试', '周测', '随堂测验']
const DIFFICULTIES = ['简单', '中等', '困难', '较难']
const RANK_TYPES = ['年级排名', '校排名', '区排名', '市排名']
const GRADE_LEVELS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '初四', '高一', '高二', '高三']

function getTodayInputValue() {
  return new Date().toLocaleDateString('en-CA')
}

function createSemesterOptions() {
  const year = new Date().getFullYear()
  const semesters = []

  for (let current = year - 3; current <= year + 1; current += 1) {
    semesters.push(`${current}-${current + 1}学年上学期`)
    semesters.push(`${current}-${current + 1}学年下学期`)
  }

  return semesters
}

function createRow(defaultDate) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    subject: '',
    score: '',
    full_score: '100',
    rank: '',
    class_average: '',
    class_highest: '',
    grade_rank: '',
    rank_type: '年级排名',
    exam_date: defaultDate,
    notes: '',
  }
}

function ExamsAddPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, profileLoading, profileError, currentProfile, subjects, recentRecords, saving, saveExamSubmission } =
    useExamAddPageData(session?.user?.id)
  const [multiSubject, setMultiSubject] = useState(false)
  const [banner, setBanner] = useState(null)
  const [form, setForm] = useState({
    exam_name: '',
    exam_type: '',
    grade_level: '',
    semester: '',
    exam_date: getTodayInputValue(),
    topic: '',
    difficulty: '',
    total_rank: '',
    total_grade_rank: '',
    total_rank_type: '年级排名',
    class_total_average: '',
    class_total_highest: '',
    notes: '',
  })
  const [rows, setRows] = useState([createRow(getTodayInputValue())])

  const isLoading = authLoading || profileLoading || loading
  const resolvedError = profileError || error
  const subjectOptions = useMemo(() => {
    if (subjects.length > 0) {
      return subjects.filter((subject) => subject.is_active !== false)
    }

    return []
  }, [subjects])
  const semesterOptions = useMemo(() => createSemesterOptions(), [])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'exam_date') {
      setRows((current) => current.map((row) => ({ ...row, exam_date: value })))
    }
  }

  function updateRow(rowId, field, value) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((current) => [...current, createRow(form.exam_date)])
  }

  function removeRow(rowId) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== rowId) : current))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!currentProfile?.id) {
      setBanner({ variant: 'error', message: '未找到当前档案' })
      return
    }

    try {
      await saveExamSubmission(currentProfile.id, form, rows, multiSubject)
      setBanner({ variant: 'success', message: '考试成绩已保存' })
    } catch (submitError) {
      setBanner({
        variant: 'error',
        message: submitError instanceof Error ? submitError.message : '保存失败',
      })
    }
  }

  return (
    <section className="route-panel app-page exams-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Exams</div>
          <h2 className="page-title">添加考试成绩</h2>
        </div>
        <p className="page-note">按真实站点的数据流写入 `exam_sessions` 和 `exam_records`。多科目模式会先创建场次，再逐条写入成绩记录。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载考试数据...</div> : null}
      {!isLoading && resolvedError ? <div className="inline-state inline-state-error">暂时无法加载考试数据，请稍后重试。</div> : null}

      {!isLoading && !resolvedError ? (
        currentProfile ? (
          <div className="page-stack">
          {banner ? <div className={`feedback-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div> : null}

          <form className="exams-card-stack" onSubmit={handleSubmit}>
            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Basic</span>
                <h3>基本信息</h3>
              </div>

              <div className="exams-form-grid exams-form-grid--two">
                <label className="field">
                  <span className="field-label">考试名称 *</span>
                  <input
                    className="field-input"
                    value={form.exam_name}
                    onChange={(event) => updateForm('exam_name', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">考试类型 *</span>
                  <select
                    className="field-input"
                    value={form.exam_type}
                    onChange={(event) => updateForm('exam_type', event.target.value)}
                  >
                    <option value="">请选择</option>
                    {EXAM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">年级</span>
                  <select
                    className="field-input"
                    value={form.grade_level}
                    onChange={(event) => updateForm('grade_level', event.target.value)}
                  >
                    <option value="">选择年级（可选）</option>
                    {GRADE_LEVELS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">学期 *</span>
                  <select
                    className="field-input"
                    value={form.semester}
                    onChange={(event) => updateForm('semester', event.target.value)}
                  >
                    <option value="">请选择学期</option>
                    {semesterOptions.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">专题/章节</span>
                  <input
                    className="field-input"
                    value={form.topic}
                    onChange={(event) => updateForm('topic', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">难度</span>
                  <select
                    className="field-input"
                    value={form.difficulty}
                    onChange={(event) => updateForm('difficulty', event.target.value)}
                  >
                    <option value="">选择难度（可选）</option>
                    {DIFFICULTIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="exams-form-grid exams-form-grid--three" style={{ marginTop: 16 }}>
                <label className="field">
                  <span className="field-label">考试日期 *</span>
                  <input
                    className="field-input"
                    type="date"
                    value={form.exam_date}
                    onChange={(event) => updateForm('exam_date', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">总排名</span>
                  <input
                    className="field-input"
                    value={form.total_rank}
                    onChange={(event) => updateForm('total_rank', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">年级总排名</span>
                  <input
                    className="field-input"
                    value={form.total_grade_rank}
                    onChange={(event) => updateForm('total_grade_rank', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">总排名类型</span>
                  <select
                    className="field-input"
                    value={form.total_rank_type}
                    onChange={(event) => updateForm('total_rank_type', event.target.value)}
                  >
                    {RANK_TYPES.map((rankType) => (
                      <option key={rankType} value={rankType}>
                        {rankType}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">班级平均分</span>
                  <input
                    className="field-input"
                    value={form.class_total_average}
                    onChange={(event) => updateForm('class_total_average', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">班级最高分</span>
                  <input
                    className="field-input"
                    value={form.class_total_highest}
                    onChange={(event) => updateForm('class_total_highest', event.target.value)}
                  />
                </label>
              </div>

              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">备注</span>
                <textarea
                  className="field-input"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                />
              </label>
            </article>

            <article className="data-card">
              <div className="section-heading">
                <span className="section-eyebrow">Mode</span>
                <h3>成绩详情</h3>
              </div>

              <label className="exams-toggle-row">
                <input
                  checked={multiSubject}
                  type="checkbox"
                  onChange={(event) => setMultiSubject(event.target.checked)}
                />
                <span>这是多科目考试，需要记录总分排名</span>
              </label>

              {multiSubject ? (
                <div className="empty-state" style={{ marginTop: 14 }}>
                  <p>开启多科目模式后，系统会先写入 `exam_sessions`，再把每个科目的成绩写入 `exam_records`。</p>
                </div>
              ) : null}

              <div className="exams-rows" style={{ marginTop: 16 }}>
                {rows.map((row, index) => (
                  <section key={row.id} className="exams-row-card">
                    <div className="exams-row-head">
                      <div className="exams-row-title">科目 {index + 1}</div>
                      <div className="exams-row-actions">
                        <button className="exams-mini-button" type="button" onClick={addRow}>
                          添加科目
                        </button>
                        <button
                          className="exams-mini-button"
                          type="button"
                          disabled={rows.length === 1}
                          onClick={() => removeRow(row.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <div className="exams-form-grid exams-form-grid--three">
                      <label className="field">
                        <span className="field-label">科目 {index + 1}</span>
                        <select
                          className="field-input"
                          value={row.subject}
                          onChange={(event) => updateRow(row.id, 'subject', event.target.value)}
                        >
                          <option value="">请选择科目</option>
                          {(subjectOptions.length > 0 ? subjectOptions : []).map((subject) => (
                            <option key={subject.id} value={subject.subject_name}>
                              {subject.subject_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field-label">得分 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.score}
                          onChange={(event) => updateRow(row.id, 'score', event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">满分 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.full_score}
                          onChange={(event) => updateRow(row.id, 'full_score', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="exams-form-grid exams-form-grid--three">
                      <label className="field">
                        <span className="field-label">排名 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.rank}
                          onChange={(event) => updateRow(row.id, 'rank', event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">班级平均 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.class_average}
                          onChange={(event) => updateRow(row.id, 'class_average', event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">班级最高 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.class_highest}
                          onChange={(event) => updateRow(row.id, 'class_highest', event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">年级排名 {index + 1}</span>
                        <input
                          className="field-input"
                          value={row.grade_rank}
                          onChange={(event) => updateRow(row.id, 'grade_rank', event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">排名类型 {index + 1}</span>
                        <select
                          className="field-input"
                          value={row.rank_type}
                          onChange={(event) => updateRow(row.id, 'rank_type', event.target.value)}
                        >
                          {RANK_TYPES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field-label">考试日期 {index + 1}</span>
                        <input
                          className="field-input"
                          type="date"
                          value={row.exam_date}
                          onChange={(event) => updateRow(row.id, 'exam_date', event.target.value)}
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span className="field-label">备注 {index + 1}</span>
                      <textarea
                        className="field-input"
                        rows={2}
                        value={row.notes}
                        onChange={(event) => updateRow(row.id, 'notes', event.target.value)}
                      />
                    </label>
                  </section>
                ))}
              </div>
            </article>

            <article className="data-card">
              <div className="exams-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? '保存中...' : '保存考试成绩'}
                </button>
                <div className="inline-state">
                  当前档案：{currentProfile?.profile_name ?? '未找到档案'}
                </div>
              </div>
            </article>
          </form>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Recent</span>
              <h3>最近考试记录</h3>
            </div>
            {recentRecords.length === 0 ? (
              <div className="empty-state">
                <p>当前还没有考试记录</p>
              </div>
            ) : (
              <div className="record-list">
                {recentRecords.map((record) => (
                  <article key={record.id} className="record-item">
                    <div className="record-main">
                      <div className="record-title">{record.exam_name || record.subject || '未命名考试'}</div>
                      <div className="record-meta">
                        <span>{record.subject || '未命名科目'}</span>
                        <span>
                          {record.score ?? '--'} / {record.full_score ?? '--'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
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

export default ExamsAddPage
