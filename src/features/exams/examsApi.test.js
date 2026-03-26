import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockFetch } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const {
  fetchExamPageData,
  requestExamDraft,
  saveExamSubmission,
  saveExamSubject,
  updateExamRecord,
} = await import('./examsApi.js')

function buildChain(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => response),
    single: vi.fn(async () => response),
    in: vi.fn(() => chain),
    then: vi.fn((resolve) => Promise.resolve(resolve(response))),
  }

  return chain
}

describe('examsApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('loads the exam catalog for the current profile', async () => {
    mockFrom
      .mockImplementationOnce(() =>
        buildChain({
          data: [{ id: 'subject-1', profile_id: 'profile-1', subject_name: '数学' }],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: [{ id: 'session-1', profile_id: 'profile-1', session_name: '第一次月考' }],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: [{ id: 'record-1', profile_id: 'profile-1', subject: '数学', score: 95 }],
          error: null,
        }),
      )

    const result = await fetchExamPageData('profile-1')

    expect(result.subjects).toHaveLength(1)
    expect(result.sessions).toHaveLength(1)
    expect(result.records).toHaveLength(1)
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'exam_subjects')
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'exam_sessions')
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'exam_records')
  })

  it('keeps the subject list empty when exam_subjects has no rows', async () => {
    mockFrom
      .mockImplementationOnce(() =>
        buildChain({
          data: [],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: [],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: [],
          error: null,
        }),
      )

    const result = await fetchExamPageData('profile-1')

    expect(result.subjects).toEqual([])
  })

  it('creates a multi-subject submission with a session row first', async () => {
    mockFrom
      .mockImplementationOnce(() =>
        buildChain({
          data: {
            id: 'session-1',
            profile_id: 'profile-1',
            session_name: '第一次月考',
          },
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: {
            id: 'record-1',
            profile_id: 'profile-1',
            session_id: 'session-1',
            subject: '数学',
          },
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: {
            id: 'record-2',
            profile_id: 'profile-1',
            session_id: 'session-1',
            subject: '英语',
          },
          error: null,
        }),
      )

    const result = await saveExamSubmission(
      'profile-1',
      {
        exam_name: '第一次月考',
        exam_type: '月考',
        grade_level: '高一',
        semester: '2025-2026学年上学期',
        exam_date: '2026-03-26',
        topic: '函数',
        difficulty: '中等',
        total_rank: '2',
        total_grade_rank: '8',
        total_rank_type: '年级排名',
        class_total_average: '95',
        class_total_highest: '100',
        notes: 'note',
      },
      [
        { subject: '数学', score: '95', full_score: '100', rank: '1', class_average: '90', class_highest: '100', grade_rank: '3', rank_type: '年级排名', exam_date: '2026-03-26', notes: 'good' },
        { subject: '英语', score: '88', full_score: '100', rank: '', class_average: '', class_highest: '', grade_rank: '', rank_type: '年级排名', exam_date: '2026-03-26', notes: '' },
      ],
      true,
    )

    expect(result.session).toMatchObject({ id: 'session-1' })
    expect(result.records).toHaveLength(2)
  })

  it('updates an exam record by profile and record id', async () => {
    mockFrom.mockImplementationOnce(() =>
      buildChain({
        data: {
          id: 'record-1',
          profile_id: 'profile-1',
          subject: '数学',
          score: 97,
        },
        error: null,
      }),
    )

    const result = await updateExamRecord('profile-1', 'record-1', {
      subject: '数学',
      score: '97',
      full_score: '100',
      exam_date: '2026-03-26',
    })

    expect(result).toMatchObject({ id: 'record-1', score: 97 })
  })

  it('creates and updates exam subjects with real table fields', async () => {
    mockFrom
      .mockImplementationOnce(() =>
        buildChain({
          data: {
            id: 'subject-1',
            profile_id: 'profile-1',
            subject_name: '科学',
            subject_color: 'from-blue-400 to-cyan-500',
            icon_name: 'BookOpen',
            display_order: 3,
            is_active: true,
          },
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildChain({
          data: {
            id: 'subject-1',
            profile_id: 'profile-1',
            subject_name: '科学',
            subject_color: 'from-blue-400 to-cyan-500',
            icon_name: 'BookOpen',
            display_order: 4,
            is_active: false,
          },
          error: null,
        }),
      )

    const created = await saveExamSubject('profile-1', {
      subject_name: '科学',
      subject_color: 'from-blue-400 to-cyan-500',
      icon_name: 'BookOpen',
      display_order: 3,
    })
    const updated = await saveExamSubject('profile-1', {
      id: 'subject-1',
      subject_name: '科学',
      subject_color: 'from-blue-400 to-cyan-500',
      icon_name: 'BookOpen',
      display_order: 4,
      is_active: false,
    })

    expect(created).toMatchObject({ id: 'subject-1', subject_name: '科学' })
    expect(updated).toMatchObject({ id: 'subject-1', display_order: 4, is_active: false })
  })

  it('posts AI exam draft requests to the backend endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: {
          assistant_message: '已生成草案',
          exam_name: '第一次月考',
          exam_type: '月考',
          subject: '数学',
          score: '95',
          full_score: '100',
        },
      })),
    })

    const result = await requestExamDraft({
      userInput: '数学95分，第一次月考',
      currentDraft: null,
      messages: [],
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/exam-draft',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(result).toMatchObject({
      assistant_message: '已生成草案',
      exam_name: '第一次月考',
      subject: '数学',
    })
  })
})
