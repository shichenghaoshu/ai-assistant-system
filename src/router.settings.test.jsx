import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

const { mockUseAuthSession } = vi.hoisted(() => ({
  mockUseAuthSession: vi.fn(),
}))
const { mockUseSettingsPageData } = vi.hoisted(() => ({
  mockUseSettingsPageData: vi.fn(),
}))

vi.mock('./auth/session.js', async () => {
  const actual = await vi.importActual('./auth/session.js')

  return {
    ...actual,
    useAuthSession: mockUseAuthSession,
  }
})

vi.mock('./features/settings/useSettingsPageData.js', () => ({
  useSettingsPageData: mockUseSettingsPageData,
}))

import { createAppRoutes } from './router.jsx'

describe('/settings route', () => {
  let router

  beforeEach(() => {
    mockUseAuthSession.mockReturnValue({
      loading: false,
      session: {
        user: {
          id: 'user-1',
          email: '488322412@qq.com',
        },
      },
    })
    mockUseSettingsPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      preferences: {
        achievement_rewards_enabled: true,
        auto_streak_bonus_enabled: true,
        study_session_bonus_enabled: false,
        completion_sound_enabled: true,
        base_stars_enabled: true,
        base_stars_value: 5,
        time_bonus_30min_enabled: true,
        time_bonus_30min_value: 2,
        time_bonus_60min_enabled: false,
        time_bonus_60min_value: null,
        early_bird_bonus_enabled: false,
        early_bird_multiplier: null,
        early_bird_start_hour: null,
        early_bird_end_hour: null,
        weekend_bonus_enabled: false,
        weekend_multiplier: null,
        completion_bonus_enabled: false,
        completion_multiplier: null,
        daily_completion_bonus_value: null,
      },
      banner: null,
      clipboardPromptDismissed: false,
      savingField: null,
      updatePreference: vi.fn(),
      saveRewardRules: vi.fn(),
      dismissClipboardPrompt: vi.fn(),
      restoreClipboardPrompt: vi.fn(),
    })
    router = null
  })

  afterEach(() => {
    cleanup()
    router?.dispose?.()
  })

  async function renderRoute(pathname) {
    router = createMemoryRouter(createAppRoutes(), {
      initialEntries: [pathname],
    })
    render(<RouterProvider router={router} />)
  }

  it('renders the real settings page instead of the generic route placeholder', async () => {
    await renderRoute('/settings')

    expect(await screen.findByText('奖励系统设置')).toBeInTheDocument()
    expect(screen.getByText('奖励系统设置')).toBeInTheDocument()
    expect(screen.queryByText('该路径还没有加入本地路由表。')).not.toBeInTheDocument()
  })
})
