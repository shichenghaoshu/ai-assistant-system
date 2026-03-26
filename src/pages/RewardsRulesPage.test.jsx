import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RewardsRulesPage from './RewardsRulesPage.jsx'

const { mockUseRewardsRulesPageData } = vi.hoisted(() => ({
  mockUseRewardsRulesPageData: vi.fn(),
}))

vi.mock('../features/rewards/useRewardsRulesPageData.js', () => ({
  useRewardsRulesPageData: mockUseRewardsRulesPageData,
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

describe('RewardsRulesPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseRewardsRulesPageData.mockReset()
  })

  it('renders loading and error states', () => {
    mockUseRewardsRulesPageData.mockReturnValue({
      loading: true,
      error: null,
      currentProfile: null,
      preferences: null,
      saving: false,
      banner: null,
      saveRules: vi.fn(),
    })

    render(
      <MemoryRouter>
        <RewardsRulesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('renders the editable reward rules surface', () => {
    const saveRules = vi.fn()
    mockUseRewardsRulesPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      preferences: {
        base_stars_enabled: true,
        base_stars_value: 5,
        time_bonus_30min_enabled: true,
        time_bonus_30min_value: 2,
        time_bonus_60min_enabled: false,
        time_bonus_60min_value: null,
      },
      saving: false,
      banner: null,
      saveRules,
    })

    render(
      <MemoryRouter>
        <RewardsRulesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('奖励规则设置')).toBeInTheDocument()
    expect(screen.getByLabelText('基础积分')).toHaveValue(5)
    fireEvent.click(screen.getByRole('button', { name: '保存规则' }))
    expect(saveRules).toHaveBeenCalled()
  })

  it('shows an empty state when there is no current profile', () => {
    mockUseRewardsRulesPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: null,
      preferences: null,
      saving: false,
      banner: null,
      saveRules: vi.fn(),
    })

    render(
      <MemoryRouter>
        <RewardsRulesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂无可用档案')).toBeInTheDocument()
  })
})
