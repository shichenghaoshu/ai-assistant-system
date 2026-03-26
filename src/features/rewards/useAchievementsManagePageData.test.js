import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetchAchievementsManagePageData } = vi.hoisted(() => ({
  mockFetchAchievementsManagePageData: vi.fn(),
}))

vi.mock('./rewardsApi.js', () => ({
  fetchAchievementsManagePageData: mockFetchAchievementsManagePageData,
}))

const { useAchievementsManagePageData } = await import('./useAchievementsManagePageData.js')

describe('useAchievementsManagePageData', () => {
  beforeEach(() => {
    mockFetchAchievementsManagePageData.mockReset()
  })

  it('exposes a hook function for the achievements management page', () => {
    expect(useAchievementsManagePageData).toBeTypeOf('function')
  })
})
