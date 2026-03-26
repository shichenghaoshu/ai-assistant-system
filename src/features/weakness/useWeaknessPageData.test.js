import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetchWeaknessPageData } = vi.hoisted(() => ({
  mockFetchWeaknessPageData: vi.fn(),
}))

vi.mock('./weaknessApi.js', () => ({
  fetchWeaknessPageData: mockFetchWeaknessPageData,
}))

const { useWeaknessPageData } = await import('./useWeaknessPageData.js')

describe('useWeaknessPageData', () => {
  beforeEach(() => {
    mockFetchWeaknessPageData.mockReset()
  })

  it('starts in a loading state before the payload resolves', () => {
    mockFetchWeaknessPageData.mockResolvedValue({
      currentProfile: { id: 'profile-1' },
      summary: {
        subjectCount: 1,
        knowledgePointCount: 2,
        practiceSubmissionCount: 3,
        weaknessReportCount: 1,
      },
      weaknessReports: [{ id: 'kp-1', title: '函数' }],
      recentSubmissions: [],
      subjectSummaries: [],
      loading: false,
      error: null,
    })

    const { result } = renderHook(() => useWeaknessPageData('user-1'))
    expect(result.current.loading).toBe(true)
  })

  it('hydrates the weakness analysis payload after the request resolves', async () => {
    mockFetchWeaknessPageData.mockResolvedValue({
      currentProfile: { id: 'profile-1', profile_name: 'shi' },
      summary: {
        subjectCount: 1,
        knowledgePointCount: 2,
        practiceSubmissionCount: 3,
        weaknessReportCount: 1,
      },
      weaknessReports: [{ id: 'kp-1', title: '函数' }],
      recentSubmissions: [{ id: 'submission-1', title: '函数练习' }],
      subjectSummaries: [{ subjectName: '数学', weaknessCount: 1, submissionCount: 3 }],
    })

    const { result } = renderHook(() => useWeaknessPageData('user-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.currentProfile).toMatchObject({
      id: 'profile-1',
      profile_name: 'shi',
    })
    expect(result.current.weaknessReports).toHaveLength(1)
    expect(result.current.recentSubmissions).toHaveLength(1)
  })
})
