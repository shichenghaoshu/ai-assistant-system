import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetchWeaknessAddPageData, mockSubmitPracticeRecord, mockRequestPracticeDraft } = vi.hoisted(() => ({
  mockFetchWeaknessAddPageData: vi.fn(),
  mockSubmitPracticeRecord: vi.fn(),
  mockRequestPracticeDraft: vi.fn(),
}))

vi.mock('./weaknessApi.js', () => ({
  fetchWeaknessAddPageData: mockFetchWeaknessAddPageData,
  submitPracticeRecord: mockSubmitPracticeRecord,
  requestPracticeDraft: mockRequestPracticeDraft,
}))

const { useWeaknessAddPageData } = await import('./useWeaknessAddPageData.js')

describe('useWeaknessAddPageData', () => {
  beforeEach(() => {
    mockFetchWeaknessAddPageData.mockReset()
    mockSubmitPracticeRecord.mockReset()
    mockRequestPracticeDraft.mockReset()
  })

  it('starts in a loading state before the add page payload resolves', () => {
    mockFetchWeaknessAddPageData.mockResolvedValue({
      currentProfile: { id: 'profile-1' },
      subjects: [],
      recentSubmissions: [],
    })

    const { result } = renderHook(() => useWeaknessAddPageData('user-1'))

    expect(result.current.loading).toBe(true)
    expect(result.current.submitPracticeRecord).toBe(mockSubmitPracticeRecord)
    expect(result.current.requestPracticeDraft).toBe(mockRequestPracticeDraft)
  })

  it('exposes the loaded payload and a refresh function after the request resolves', async () => {
    mockFetchWeaknessAddPageData.mockResolvedValue({
      currentProfile: { id: 'profile-1', profile_name: 'shi' },
      subjects: [{ id: 'math', subjectName: '数学' }],
      recentSubmissions: [{ id: 'submission-1', title: '函数练习' }],
    })

    const { result } = renderHook(() => useWeaknessAddPageData('user-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.currentProfile).toMatchObject({
      id: 'profile-1',
      profile_name: 'shi',
    })
    expect(result.current.subjects).toHaveLength(1)
    expect(result.current.recentSubmissions).toHaveLength(1)
    expect(typeof result.current.refresh).toBe('function')
  })
})
