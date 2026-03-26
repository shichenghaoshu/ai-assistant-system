import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockFetchCurrentProfile } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetchCurrentProfile: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
  },
}))

vi.mock('../account/useCurrentProfile.js', () => ({
  fetchCurrentProfile: mockFetchCurrentProfile,
}))

const {
  fetchWeaknessPageData,
  submitPracticeRecord,
  requestPracticeDraft,
} = await import('./weaknessApi.js')

function buildRowsResponse(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(async () => response),
    order: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
    single: vi.fn(async () => response),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    in: vi.fn(() => chain),
  }

  return chain
}

describe('weaknessApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockFetchCurrentProfile.mockReset()
    vi.restoreAllMocks()
  })

  it('loads weakness analysis data for the current profile', async () => {
    mockFetchCurrentProfile.mockResolvedValue({
      id: 'profile-1',
      account_id: 'user-1',
      profile_name: 'shi',
    })

    mockFrom
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))

    const result = await fetchWeaknessPageData('user-1')

    expect(result.currentProfile).toMatchObject({ id: 'profile-1' })
    expect(result.summary).toMatchObject({
      subjectCount: 0,
      knowledgePointCount: 0,
      practiceSubmissionCount: 0,
      weaknessReportCount: 0,
    })
    expect(result.weaknessReports).toEqual([])
    expect(result.recentSubmissions).toEqual([])
  })

  it('derives weakness reports from knowledge points when the reports table is empty', async () => {
    mockFetchCurrentProfile.mockResolvedValue({
      id: 'profile-1',
      account_id: 'user-1',
      profile_name: 'shi',
    })

    mockFrom
      .mockImplementationOnce(() => buildRowsResponse({ data: [{ id: 'math', subject_name: '数学' }], error: null }))
      .mockImplementationOnce(() =>
        buildRowsResponse({
          data: [
            {
              id: 'kp-1',
              subject_id: 'math',
              knowledge_name: '函数',
              weakness_score: 0.86,
              error_count: 8,
              practice_count: 3,
              last_practiced_at: '2026-03-25T08:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))
      .mockImplementationOnce(() => buildRowsResponse({ data: [], error: null }))

    const result = await fetchWeaknessPageData('user-1')

    expect(result.summary.weaknessReportCount).toBe(1)
    expect(result.weaknessReports[0]).toMatchObject({
      id: 'kp-1',
      title: '函数',
      subjectId: 'math',
      weaknessScore: 0.86,
      errorCount: 8,
    })
  })

  it('submits a practice record for the current profile', async () => {
    const submitChain = {
      select: vi.fn(() => submitChain),
      single: vi.fn(async () => ({
        data: {
          id: 'submission-1',
          profile_id: 'profile-1',
          subject_id: 'math',
        },
        error: null,
      })),
    }

    mockFrom.mockImplementationOnce(() => ({
      insert: vi.fn(() => submitChain),
    }))

    const result = await submitPracticeRecord('profile-1', {
      subject_id: 'math',
      practice_title: '函数练习',
      practice_date: '2026-03-26',
      total_questions: 20,
      correct_questions: 16,
      note: '练习记录',
    })

    expect(result).toMatchObject({
      id: 'submission-1',
      profile_id: 'profile-1',
      subject_id: 'math',
    })
  })

  it('requests an ai practice draft from the backend endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        title: '函数练习',
        subject_id: 'math',
        total_questions: 12,
        correct_questions: 9,
      }),
    })

    const result = await requestPracticeDraft({
      text: '函数与导数练习',
      subjectId: 'math',
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/practice-draft', expect.objectContaining({
      method: 'POST',
    }))
    expect(result).toMatchObject({
      title: '函数练习',
      subject_id: 'math',
    })
  })
})
