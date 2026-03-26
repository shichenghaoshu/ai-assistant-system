import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AchievementsManagePage from './AchievementsManagePage.jsx'

const { mockUseAchievementsManagePageData } = vi.hoisted(() => ({
  mockUseAchievementsManagePageData: vi.fn(),
}))

vi.mock('../features/rewards/useAchievementsManagePageData.js', () => ({
  useAchievementsManagePageData: mockUseAchievementsManagePageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'user-1',
        email: 'saved@example.com',
      },
    },
  }),
}))

describe('AchievementsManagePage', () => {
  beforeEach(() => {
    cleanup()
    mockUseAchievementsManagePageData.mockReset()
  })

  it('renders the achievements list and selection flow', () => {
    const selectAchievement = vi.fn()
    const saveAchievement = vi.fn()

    mockUseAchievementsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      achievements: [
        {
          id: 'ach-1',
          name: '晨间打卡',
          description: '连续早起',
          reward_stars: 3,
          is_active: true,
          sort_order: 1,
        },
      ],
      selectedAchievementId: 'ach-1',
      selectAchievement,
      saveAchievement,
      deletingId: null,
      savingId: null,
      banner: null,
    })

    render(
      <MemoryRouter>
        <AchievementsManagePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('管理成就')).toBeInTheDocument()
    expect(screen.getByText('晨间打卡')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '保存成就' }))
    expect(saveAchievement).toHaveBeenCalled()
  })
})
