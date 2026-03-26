import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SettingsPage from './SettingsPage.jsx'

const { mockUseSettingsPageData } = vi.hoisted(() => ({
  mockUseSettingsPageData: vi.fn(),
}))

vi.mock('../features/settings/useSettingsPageData.js', () => ({
  useSettingsPageData: mockUseSettingsPageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'user-1',
        email: '488322412@qq.com',
      },
    },
  }),
}))

function createPageState(overrides = {}) {
  return {
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
    updatePreference: vi.fn(),
    saveRewardRules: vi.fn(),
    dismissClipboardPrompt: vi.fn(),
    restoreClipboardPrompt: vi.fn(),
    ...overrides,
  }
}

describe('SettingsPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseSettingsPageData.mockReset()
  })

  it('renders the loading state while settings are being fetched', () => {
    mockUseSettingsPageData.mockReturnValue(
      createPageState({
        loading: true,
        currentProfile: null,
        preferences: null,
      }),
    )

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('renders the error state when loading settings fails', () => {
    mockUseSettingsPageData.mockReturnValue(
      createPageState({
        error: new Error('boom'),
        currentProfile: null,
        preferences: null,
      }),
    )

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('获取设置失败，请稍后重试。')).toBeInTheDocument()
  })

  it('renders the settings surface with real preference sections', () => {
    mockUseSettingsPageData.mockReturnValue(createPageState())

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('系统设置')).toBeInTheDocument()
    expect(screen.getByText('奖励系统设置')).toBeInTheDocument()
    expect(screen.getByText('自定义积分奖励规则')).toBeInTheDocument()
    expect(screen.getByText('音效设置')).toBeInTheDocument()
    expect(screen.getByText('粘贴板识别提示')).toBeInTheDocument()
    expect(screen.getByText('设置说明')).toBeInTheDocument()
    expect(screen.getByLabelText('基础积分')).toHaveValue(5)
  })

  it('calls through to the settings updater when toggles change', () => {
    const updatePreference = vi.fn()

    mockUseSettingsPageData.mockReturnValue(
      createPageState({
        updatePreference,
      }),
    )

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '成就系统奖励' }))

    expect(updatePreference).toHaveBeenCalledWith('achievement_rewards_enabled', false)
  })

  it('saves custom reward rules through the form', () => {
    const saveRewardRules = vi.fn()

    mockUseSettingsPageData.mockReturnValue(
      createPageState({
        saveRewardRules,
      }),
    )

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('基础积分'), {
      target: { value: '8' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存积分规则' }))

    expect(saveRewardRules).toHaveBeenCalledWith(
      expect.objectContaining({
        base_stars_value: 8,
      }),
    )
  })
})
