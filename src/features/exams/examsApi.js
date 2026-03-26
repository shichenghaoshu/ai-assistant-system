import { supabase } from '../../auth/session.js'

function cleanString(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined))
}

export async function fetchExamPageData(profileId) {
  if (!profileId) {
    return {
      subjects: [],
      sessions: [],
      records: [],
    }
  }

  const [subjectsResult, sessionsResult, recordsResult] = await Promise.all([
    supabase
      .from('exam_subjects')
      .select('*')
      .eq('profile_id', profileId)
      .order('display_order', { ascending: true })
      .order('subject_name', { ascending: true }),
    supabase
      .from('exam_sessions')
      .select(
        'id,profile_id,session_name,exam_type,semester,exam_date,grade_level,total_score,total_full_score,total_rank,total_grade_rank,total_rank_type,class_total_average,class_total_highest,notes,created_at',
      )
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('exam_records')
      .select(
        'id,profile_id,session_id,subject,exam_name,exam_type,semester,exam_date,score,full_score,grade_level,topic,difficulty,notes,rank,class_average,class_highest,grade_rank,rank_type,created_at',
      )
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const queryError = subjectsResult.error || sessionsResult.error || recordsResult.error

  if (queryError) {
    throw queryError
  }

  return {
    subjects: subjectsResult.data ?? [],
    sessions: sessionsResult.data ?? [],
    records: recordsResult.data ?? [],
  }
}

export async function fetchExamRecord(profileId, recordId) {
  if (!profileId || !recordId) {
    return null
  }

  const { data, error } = await supabase
    .from('exam_records')
    .select('*')
    .eq('profile_id', profileId)
    .eq('id', recordId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function createExamSession(profileId, payload) {
  const recordPayload = compactObject({
    profile_id: profileId,
    session_name: cleanString(payload.session_name),
    exam_type: cleanString(payload.exam_type),
    semester: cleanString(payload.semester),
    exam_date: cleanString(payload.exam_date),
    grade_level: cleanString(payload.grade_level) || null,
    total_score: toNumber(payload.total_score),
    total_full_score: toNumber(payload.total_full_score),
    total_rank: toNumber(payload.total_rank),
    total_grade_rank: toNumber(payload.total_grade_rank),
    total_rank_type: cleanString(payload.total_rank_type) || '年级排名',
    class_total_average: toNumber(payload.class_total_average),
    class_total_highest: toNumber(payload.class_total_highest),
    notes: cleanString(payload.notes) || null,
  })

  const { data, error } = await supabase.from('exam_sessions').insert(recordPayload).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function createExamRecord(profileId, payload) {
  const recordPayload = compactObject({
    profile_id: profileId,
    session_id: payload.session_id ?? null,
    subject: cleanString(payload.subject),
    exam_name: cleanString(payload.exam_name),
    exam_type: cleanString(payload.exam_type),
    semester: cleanString(payload.semester),
    exam_date: cleanString(payload.exam_date),
    score: toNumber(payload.score),
    full_score: toNumber(payload.full_score),
    grade_level: cleanString(payload.grade_level) || null,
    topic: cleanString(payload.topic) || null,
    difficulty: cleanString(payload.difficulty) || null,
    notes: cleanString(payload.notes) || null,
    rank: toNumber(payload.rank),
    class_average: toNumber(payload.class_average),
    class_highest: toNumber(payload.class_highest),
    grade_rank: toNumber(payload.grade_rank),
    rank_type: cleanString(payload.rank_type) || null,
  })

  const { data, error } = await supabase.from('exam_records').insert(recordPayload).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function updateExamRecord(profileId, recordId, payload) {
  const updatePayload = compactObject({
    subject: cleanString(payload.subject),
    exam_name: cleanString(payload.exam_name),
    exam_type: cleanString(payload.exam_type),
    semester: cleanString(payload.semester),
    exam_date: cleanString(payload.exam_date),
    score: toNumber(payload.score),
    full_score: toNumber(payload.full_score),
    grade_level: cleanString(payload.grade_level) || null,
    topic: cleanString(payload.topic) || null,
    difficulty: cleanString(payload.difficulty) || null,
    notes: cleanString(payload.notes) || null,
    rank: toNumber(payload.rank),
    class_average: toNumber(payload.class_average),
    class_highest: toNumber(payload.class_highest),
    grade_rank: toNumber(payload.grade_rank),
    rank_type: cleanString(payload.rank_type) || null,
    updated_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('exam_records')
    .update(updatePayload)
    .eq('profile_id', profileId)
    .eq('id', recordId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function saveExamSubmission(profileId, formState, rows, multiSubject) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const validRows = (Array.isArray(rows) ? rows : []).filter(
    (row) => cleanString(row?.subject) && cleanString(row?.score) && cleanString(row?.exam_date),
  )

  if (validRows.length === 0) {
    throw new Error('请添加至少一个完整的科目成绩')
  }

  const sessionPayload = {
    session_name: formState.exam_name,
    exam_type: formState.exam_type,
    semester: formState.semester,
    exam_date: formState.exam_date,
    grade_level: formState.grade_level,
    total_score: validRows.reduce((sum, row) => sum + (toNumber(row.score) ?? 0), 0),
    total_full_score: validRows.reduce((sum, row) => sum + (toNumber(row.full_score) ?? 0), 0),
    total_rank: formState.total_rank,
    total_grade_rank: formState.total_grade_rank,
    total_rank_type: formState.total_rank_type,
    class_total_average: formState.class_total_average,
    class_total_highest: formState.class_total_highest,
    notes: formState.notes,
  }

  let session = null
  const records = []

  if (multiSubject) {
    session = await createExamSession(profileId, sessionPayload)
  }

  for (const row of validRows) {
    const created = await createExamRecord(profileId, {
      session_id: session?.id ?? row.session_id ?? null,
      subject: row.subject,
      exam_name: formState.exam_name,
      exam_type: formState.exam_type,
      semester: formState.semester,
      exam_date: row.exam_date,
      score: row.score,
      full_score: row.full_score,
      grade_level: formState.grade_level,
      topic: formState.topic,
      difficulty: formState.difficulty,
      notes: row.notes || formState.notes,
      rank: row.rank,
      class_average: row.class_average,
      class_highest: row.class_highest,
      grade_rank: row.grade_rank,
      rank_type: row.rank_type,
    })

    records.push(created)
  }

  return { session, records }
}

export async function saveExamSubject(profileId, payload) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const subjectPayload = compactObject({
    profile_id: profileId,
    subject_name: cleanString(payload.subject_name),
    subject_color: cleanString(payload.subject_color),
    icon_name: cleanString(payload.icon_name),
    display_order: toNumber(payload.display_order) ?? 0,
    is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    updated_at: new Date().toISOString(),
  })

  if (payload.id) {
    const { data, error } = await supabase
      .from('exam_subjects')
      .update(subjectPayload)
      .eq('profile_id', profileId)
      .eq('id', payload.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabase.from('exam_subjects').insert(subjectPayload).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteExamSubject(profileId, subjectId) {
  if (!profileId || !subjectId) {
    throw new Error('missing subject id')
  }

  const { error } = await supabase.from('exam_subjects').delete().eq('profile_id', profileId).eq('id', subjectId)

  if (error) {
    throw error
  }

  return true
}

export async function toggleExamSubject(profileId, subjectId, isActive) {
  if (!profileId || !subjectId) {
    throw new Error('missing subject id')
  }

  const { data, error } = await supabase
    .from('exam_subjects')
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', profileId)
    .eq('id', subjectId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function requestExamDraft(payload) {
  const response = await fetch('/api/ai/exam-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userInput: payload.userInput || undefined,
      imageUrls: payload.imageUrls?.length ? payload.imageUrls : undefined,
      messages: payload.messages ?? [],
      currentDraft: payload.currentDraft ?? null,
    }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || body?.message || '生成草案失败，请稍后重试')
  }

  return body.data ?? body
}
