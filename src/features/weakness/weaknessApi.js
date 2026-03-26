import { supabase } from '../../auth/session.js'
import { fetchCurrentProfile } from '../account/useCurrentProfile.js'

function isMissingColumnError(error, columnName) {
  const message = String(error?.message ?? error ?? '').toLowerCase()
  return message.includes(columnName.toLowerCase()) && (message.includes('does not exist') || message.includes('column'))
}

function parseDate(value) {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

function asNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeLabel(row, keys, fallback) {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value)
    }
  }

  return fallback
}

function getSubjectName(subject) {
  return normalizeLabel(subject, ['subject_name', 'display_name', 'name', 'title'], '未分类')
}

function getKnowledgeTitle(point) {
  return normalizeLabel(point, ['knowledge_name', 'knowledge_point_name', 'display_name', 'name', 'title'], '未命名知识点')
}

function getSubmissionTitle(submission) {
  return normalizeLabel(submission, ['practice_title', 'title', 'name', 'note'], '未命名练习')
}

function getWeaknessScore(row) {
  const rawScore =
    row?.weakness_score ??
    row?.weakness_rate ??
    row?.error_rate ??
    row?.score ??
    row?.mastery_score ??
    row?.mastery_level

  if (rawScore === undefined || rawScore === null || rawScore === '') {
    return 0
  }

  const numeric = asNumber(rawScore, 0)

  if (numeric > 1 && numeric <= 100) {
    return numeric / 100
  }

  return numeric
}

function getPracticeCount(row) {
  return asNumber(row?.practice_count ?? row?.attempt_count ?? row?.submission_count ?? row?.total_count, 0)
}

function getErrorCount(row) {
  return asNumber(row?.error_count ?? row?.wrong_count ?? row?.mistake_count ?? row?.incorrect_count, 0)
}

function getTotalQuestions(row) {
  return asNumber(row?.total_questions ?? row?.question_count ?? row?.total_count, 0)
}

function getCorrectQuestions(row) {
  return asNumber(row?.correct_questions ?? row?.right_count ?? row?.correct_count, 0)
}

function getDateValue(row) {
  return (
    row?.last_practiced_at ??
    row?.practice_date ??
    row?.submitted_at ??
    row?.updated_at ??
    row?.created_at ??
    null
  )
}

function sortRowsByDateDesc(rows) {
  return [...rows].sort((left, right) => parseDate(getDateValue(right)) - parseDate(getDateValue(left)))
}

function filterRowsToCurrentProfile(rows, profile) {
  if (!profile) {
    return rows
  }

  const scopeKeys = ['profile_id', 'account_id', 'user_id']

  return rows.filter((row) => {
    let sawScopedField = false
    let matched = false

    for (const key of scopeKeys) {
      if (row?.[key] === undefined || row?.[key] === null || row?.[key] === '') {
        continue
      }

      sawScopedField = true
      if (row[key] === profile.id || row[key] === profile.account_id) {
        matched = true
      }
    }

    return sawScopedField ? matched : true
  })
}

async function fetchRows(tableName, profile, scoped = true) {
  const buildQuery = () => supabase.from(tableName).select('*')

  if (profile && scoped) {
    const scopedResult = await buildQuery().eq('profile_id', profile.id)

    if (!scopedResult.error) {
      return filterRowsToCurrentProfile(scopedResult.data ?? [], profile)
    }

    if (!isMissingColumnError(scopedResult.error, 'profile_id')) {
      throw scopedResult.error
    }
  }

  const fallbackResult = await buildQuery()

  if (fallbackResult.error) {
    throw fallbackResult.error
  }

  return filterRowsToCurrentProfile(fallbackResult.data ?? [], profile)
}

function getReportId(row) {
  return String(row?.id ?? row?.knowledge_point_id ?? row?.knowledge_id ?? getKnowledgeTitle(row))
}

function normalizeSubjectSummaries(reports, submissions, subjectsById) {
  const summaryMap = new Map()

  for (const report of reports) {
    const subjectId = report.subjectId ?? report.subject_id ?? 'unknown'
    const current = summaryMap.get(subjectId) ?? {
      subjectId,
      subjectName: subjectsById.get(subjectId) ?? report.subjectName ?? report.subject_name ?? '未分类',
      weaknessCount: 0,
      submissionCount: 0,
      latestScore: 0,
    }

    current.weaknessCount += 1
    current.latestScore = Math.max(current.latestScore, getWeaknessScore(report))
    summaryMap.set(subjectId, current)
  }

  for (const submission of submissions) {
    const subjectId = submission.subjectId ?? submission.subject_id ?? 'unknown'
    const current = summaryMap.get(subjectId) ?? {
      subjectId,
      subjectName: subjectsById.get(subjectId) ?? submission.subjectName ?? submission.subject_name ?? '未分类',
      weaknessCount: 0,
      submissionCount: 0,
      latestScore: 0,
    }

    current.submissionCount += 1
    summaryMap.set(subjectId, current)
  }

  return [...summaryMap.values()].sort((left, right) => right.weaknessCount - left.weaknessCount || right.submissionCount - left.submissionCount)
}

function deriveReportsFromKnowledgePoints(knowledgePoints, subjectsById) {
  return sortRowsByDateDesc(knowledgePoints).map((point) => {
    const subjectId = point.subjectId ?? point.subject_id ?? 'unknown'
    return {
      ...point,
      id: getReportId(point),
      title: getKnowledgeTitle(point),
      subjectId,
      subjectName: subjectsById.get(subjectId) ?? point.subjectName ?? point.subject_name ?? '未分类',
      weaknessScore: getWeaknessScore(point),
      errorCount: getErrorCount(point),
      practiceCount: getPracticeCount(point),
      lastPracticedAt: getDateValue(point),
    }
  })
}

function normalizeReports(reports, subjectsById, knowledgePoints = []) {
  if (reports.length > 0) {
    return sortRowsByDateDesc(reports).map((row) => {
      const subjectId = row.subjectId ?? row.subject_id ?? 'unknown'

      return {
        ...row,
        id: getReportId(row),
        title: getKnowledgeTitle(row),
        subjectId,
        subjectName: subjectsById.get(subjectId) ?? row.subjectName ?? row.subject_name ?? '未分类',
        weaknessScore: getWeaknessScore(row),
        errorCount: getErrorCount(row),
        practiceCount: getPracticeCount(row),
        lastPracticedAt: getDateValue(row),
      }
    })
  }

  return deriveReportsFromKnowledgePoints(knowledgePoints, subjectsById)
}

function normalizeSubmissions(submissions, subjectsById) {
  return sortRowsByDateDesc(submissions).map((row) => {
    const subjectId = row.subjectId ?? row.subject_id ?? 'unknown'

    return {
      ...row,
      id: String(row.id ?? `${subjectId}-${getDateValue(row) ?? 'submission'}`),
      title: getSubmissionTitle(row),
      subjectId,
      subjectName: subjectsById.get(subjectId) ?? row.subjectName ?? row.subject_name ?? '未分类',
      practiceDate: row.practice_date ?? row.submitted_at ?? row.created_at ?? null,
      totalQuestions: getTotalQuestions(row),
      correctQuestions: getCorrectQuestions(row),
      note: normalizeLabel(row, ['note', 'remarks', 'description'], ''),
    }
  })
}

function normalizeSubjects(subjects) {
  return sortRowsByDateDesc(subjects).map((subject) => ({
    ...subject,
    id: String(subject.id ?? subject.subject_id ?? subject.name ?? getSubjectName(subject)),
    subjectName: getSubjectName(subject),
  }))
}

function buildSubjectNameMap(subjects) {
  return new Map(subjects.map((subject) => [String(subject.id), subject.subjectName]))
}

function buildSummary(subjects, knowledgePoints, submissions, reports) {
  return {
    subjectCount: subjects.length,
    knowledgePointCount: knowledgePoints.length,
    practiceSubmissionCount: submissions.length,
    weaknessReportCount: reports.length,
  }
}

async function loadCommonWeaknessData(accountId) {
  const currentProfile = await fetchCurrentProfile(accountId)

  if (!currentProfile) {
    return {
      currentProfile: null,
      subjects: [],
      knowledgePoints: [],
      submissions: [],
    }
  }

  const [subjects, knowledgePoints, submissions] = await Promise.all([
    fetchRows('exam_subjects', currentProfile, false),
    fetchRows('knowledge_points', currentProfile),
    fetchRows('practice_submissions', currentProfile),
  ])

  return {
    currentProfile,
    subjects: normalizeSubjects(subjects),
    knowledgePoints: sortRowsByDateDesc(knowledgePoints),
    submissions: sortRowsByDateDesc(submissions),
  }
}

export async function fetchWeaknessPageData(accountId) {
  if (!accountId) {
    return {
      currentProfile: null,
      subjects: [],
      knowledgePoints: [],
      weaknessReports: [],
      recentSubmissions: [],
      subjectSummaries: [],
      summary: {
        subjectCount: 0,
        knowledgePointCount: 0,
        practiceSubmissionCount: 0,
        weaknessReportCount: 0,
      },
    }
  }

  const commonData = await loadCommonWeaknessData(accountId)

  if (!commonData.currentProfile) {
    return {
      currentProfile: null,
      subjects: [],
      knowledgePoints: [],
      weaknessReports: [],
      recentSubmissions: [],
      subjectSummaries: [],
      summary: {
        subjectCount: 0,
        knowledgePointCount: 0,
        practiceSubmissionCount: 0,
        weaknessReportCount: 0,
      },
    }
  }

  const reports = await fetchRows('weakness_reports', commonData.currentProfile)
  const subjectsById = buildSubjectNameMap(commonData.subjects)
  const weaknessReports = normalizeReports(reports, subjectsById, commonData.knowledgePoints)
  const recentSubmissions = normalizeSubmissions(commonData.submissions, subjectsById)
  const subjectSummaries = normalizeSubjectSummaries(weaknessReports, recentSubmissions, subjectsById)

  return {
    currentProfile: commonData.currentProfile,
    subjects: commonData.subjects,
    knowledgePoints: commonData.knowledgePoints,
    weaknessReports,
    recentSubmissions,
    subjectSummaries,
    summary: buildSummary(commonData.subjects, commonData.knowledgePoints, recentSubmissions, weaknessReports),
  }
}

export async function fetchWeaknessAddPageData(accountId) {
  if (!accountId) {
    return {
      currentProfile: null,
      subjects: [],
      knowledgePoints: [],
      recentSubmissions: [],
    }
  }

  const commonData = await loadCommonWeaknessData(accountId)
  const subjectsById = buildSubjectNameMap(commonData.subjects)

  return {
    currentProfile: commonData.currentProfile,
    subjects: commonData.subjects,
    knowledgePoints: commonData.knowledgePoints,
    recentSubmissions: normalizeSubmissions(commonData.submissions, subjectsById),
  }
}

export async function submitPracticeRecord(profileId, payload) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const now = new Date().toISOString()
  const submissionPayload = {
    profile_id: profileId,
    subject_id: payload.subject_id,
    practice_title: payload.practice_title?.trim() || null,
    practice_date: payload.practice_date || now.slice(0, 10),
    total_questions: payload.total_questions ?? null,
    correct_questions: payload.correct_questions ?? null,
    note: payload.note?.trim() || null,
    raw_text: payload.raw_text?.trim() || null,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase.from('practice_submissions').insert(submissionPayload).select('*').single()

  if (error) {
    throw error
  }

  return data
}

export async function requestPracticeDraft(payload) {
  const response = await fetch('/api/ai/practice-draft', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || 'AI 草稿生成失败')
  }

  return data?.draft ?? data?.data ?? data
}

export function normalizePracticeDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return {}
  }

  return {
    subject_id: draft.subject_id ?? draft.subjectId ?? '',
    practice_title: draft.practice_title ?? draft.title ?? '',
    practice_date: draft.practice_date ?? draft.date ?? '',
    total_questions: draft.total_questions ?? draft.question_count ?? '',
    correct_questions: draft.correct_questions ?? draft.correct_count ?? '',
    note: draft.note ?? draft.summary ?? '',
    raw_text: draft.raw_text ?? draft.text ?? '',
  }
}
