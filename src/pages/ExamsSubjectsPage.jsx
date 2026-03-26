import { useMemo, useState } from 'react'

import { useAuthSession } from '../auth/session.js'
import { useExamSubjectsPageData } from '../features/exams/useExamsPageData.js'
import '../styles/exams.css'

const SUBJECT_COLORS = [
  'from-sky-400 to-blue-500',
  'from-indigo-400 to-purple-500',
  'from-orange-300 to-amber-400',
  'from-cyan-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-green-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-cyan-500',
  'from-red-400 to-rose-500',
  'from-slate-400 to-gray-600',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-fuchsia-500',
  'from-lime-400 to-green-500',
  'from-yellow-400 to-orange-500',
]

const ICON_NAMES = ['BookOpen', 'Calculator', 'Languages', 'Atom', 'Beaker', 'Leaf', 'Scroll', 'Globe', 'Scale', 'Monitor', 'Microscope']

function createEmptySubject(index = 0) {
  return {
    id: null,
    subject_name: '',
    subject_color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    icon_name: 'BookOpen',
    display_order: index,
    is_active: true,
  }
}

function ExamsSubjectsPage() {
  const { loading: authLoading, session } = useAuthSession()
  const { loading, error, profileLoading, profileError, currentProfile, subjects, saveExamSubject, toggleExamSubject, deleteExamSubject, saving } =
    useExamSubjectsPageData(session?.user?.id)
  const [banner, setBanner] = useState(null)
  const [draft, setDraft] = useState(createEmptySubject())
  const [editingId, setEditingId] = useState(null)

  const isLoading = authLoading || profileLoading || loading
  const resolvedError = profileError || error
  const activeSubjects = useMemo(() => subjects ?? [], [subjects])

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function resetDraft() {
    setEditingId(null)
    setDraft(createEmptySubject(activeSubjects.length))
  }

  function editSubject(subject) {
    setEditingId(subject.id)
    setDraft({
      id: subject.id,
      subject_name: subject.subject_name || '',
      subject_color: subject.subject_color || SUBJECT_COLORS[0],
      icon_name: subject.icon_name || 'BookOpen',
      display_order: subject.display_order ?? 0,
      is_active: subject.is_active !== false,
    })
  }

  async function handleSave() {
    if (!currentProfile?.id) {
      setBanner({ variant: 'error', message: '未找到当前档案' })
      return
    }

    try {
      await saveExamSubject(currentProfile.id, draft)
      setBanner({ variant: 'success', message: editingId ? '科目已更新' : '新科目已添加' })
      resetDraft()
    } catch (saveError) {
      setBanner({
        variant: 'error',
        message: saveError instanceof Error ? saveError.message : '保存失败',
      })
    }
  }

  async function handleToggle(subject) {
    if (!currentProfile?.id) {
      return
    }

    try {
      await toggleExamSubject(currentProfile.id, subject.id, !subject.is_active)
      setBanner({ variant: 'success', message: subject.is_active ? '科目已禁用' : '科目已启用' })
    } catch (toggleError) {
      setBanner({
        variant: 'error',
        message: toggleError instanceof Error ? toggleError.message : '操作失败',
      })
    }
  }

  async function handleDelete(subject) {
    if (!currentProfile?.id) {
      return
    }

    try {
      await deleteExamSubject(currentProfile.id, subject.id)
      setBanner({ variant: 'success', message: '科目已删除' })
    } catch (deleteError) {
      setBanner({
        variant: 'error',
        message: deleteError instanceof Error ? deleteError.message : '删除失败',
      })
    }
  }

  return (
    <section className="route-panel app-page exams-page">
      <div className="page-header">
        <div>
          <div className="route-kicker">Exams</div>
          <h2 className="page-title">科目管理</h2>
        </div>
        <p className="page-note">管理 `exam_subjects`，为考试成绩提供科目选择、颜色和图标信息。</p>
      </div>

      {isLoading ? <div className="inline-state">正在加载科目数据...</div> : null}
      {!isLoading && resolvedError ? <div className="inline-state inline-state-error">暂时无法加载科目数据，请稍后重试。</div> : null}

      {!isLoading && !resolvedError ? (
        currentProfile ? (
          <div className="page-stack">
          {banner ? <div className={`feedback-banner ${banner.variant === 'error' ? 'is-error' : 'is-success'}`}>{banner.message}</div> : null}

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Subjects</span>
              <h3>我的科目</h3>
            </div>

            <div className="exams-actions" style={{ marginBottom: 16 }}>
              <button className="primary-button" type="button" onClick={resetDraft}>
                添加科目
              </button>
              <div className="inline-state">当前档案：{currentProfile?.profile_name ?? '--'}</div>
            </div>

            {activeSubjects.length === 0 ? (
              <div className="empty-state">
                <p>还没有设置任何科目</p>
              </div>
            ) : (
              <div className="exams-subject-list">
                {activeSubjects.map((subject) => (
                  <article key={subject.id} className="exams-subject-item">
                    <div className="exams-subject-top">
                      <div>
                        <div className="record-title">{subject.subject_name}</div>
                        <div className="exams-subject-meta">
                          <span>顺序 {subject.display_order ?? 0}</span>
                          <span>{subject.icon_name || 'BookOpen'}</span>
                          <span>{subject.is_active === false ? '禁用' : '启用'}</span>
                        </div>
                      </div>
                      <span className={`status-pill ${subject.is_active === false ? '' : 'is-success'}`}>{subject.is_active === false ? '禁用' : '启用'}</span>
                    </div>

                    <div className="exams-subject-actions">
                      <button className="exams-mini-button" type="button" onClick={() => handleToggle(subject)}>
                        {subject.is_active === false ? '启用' : '禁用'}
                      </button>
                      <button className="exams-mini-button" type="button" onClick={() => editSubject(subject)}>
                        编辑
                      </button>
                      <button className="exams-mini-button" type="button" onClick={() => handleDelete(subject)}>
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="data-card">
            <div className="section-heading">
              <span className="section-eyebrow">Editor</span>
              <h3>{editingId ? '更新科目' : '添加科目'}</h3>
            </div>

            <div className="exams-form-grid exams-form-grid--two">
              <label className="field">
                <span className="field-label">科目名称</span>
                <input
                  className="field-input"
                  value={draft.subject_name}
                  onChange={(event) => updateDraft('subject_name', event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">显示顺序</span>
                <input
                  className="field-input"
                  type="number"
                  value={draft.display_order}
                  onChange={(event) => updateDraft('display_order', Number(event.target.value) || 0)}
                />
              </label>
              <label className="field">
                <span className="field-label">图标</span>
                <select className="field-input" value={draft.icon_name} onChange={(event) => updateDraft('icon_name', event.target.value)}>
                  {ICON_NAMES.map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">颜色</span>
                <select className="field-input" value={draft.subject_color} onChange={(event) => updateDraft('subject_color', event.target.value)}>
                  {SUBJECT_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="exams-actions" style={{ marginTop: 16 }}>
              <button className="primary-button" type="button" disabled={saving} onClick={handleSave}>
                {editingId ? '更新' : '添加'}
              </button>
              <div className="inline-state">提交后会写入真实的 `exam_subjects` 表。</div>
            </div>
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

export default ExamsSubjectsPage
