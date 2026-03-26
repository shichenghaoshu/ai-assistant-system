import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockUseCurrentProfile,
  mockLoadOrCreateSettings,
  mockUpdateSettingsValue,
  mockUpdateSettingsValues,
  mockReadClipboardPromptDismissed,
  mockSetClipboardPromptDismissed,
  mockSetCompletionSoundMirror,
} = vi.hoisted(() => ({
  mockUseCurrentProfile: vi.fn(),
  mockLoadOrCreateSettings: vi.fn(),
  mockUpdateSettingsValue: vi.fn(),
  mockUpdateSettingsValues: vi.fn(),
  mockReadClipboardPromptDismissed: vi.fn(() => false),
  mockSetClipboardPromptDismissed: vi.fn(),
  mockSetCompletionSoundMirror: vi.fn(),
}))

vi.mock('../account/useCurrentProfile.js', () => ({
  useCurrentProfile: mockUseCurrentProfile,
}))

vi.mock('./settingsApi.js', () => ({
  loadOrCreateSettings: mockLoadOrCreateSettings,
  updateSettingsValue: mockUpdateSettingsValue,
  updateSettingsValues: mockUpdateSettingsValues,
  readClipboardPromptDismissed: mockReadClipboardPromptDismissed,
  setClipboardPromptDismissed: mockSetClipboardPromptDismissed,
  setCompletionSoundMirror: mockSetCompletionSoundMirror,
}))

const { useSettingsPageData } = await import('./useSettingsPageData.js')

describe('useSettingsPageData', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    mockUseCurrentProfile.mockReset()
    mockLoadOrCreateSettings.mockReset()
    mockUpdateSettingsValue.mockReset()
    mockUpdateSettingsValues.mockReset()
    mockReadClipboardPromptDismissed.mockReset()
    mockReadClipboardPromptDismissed.mockReturnValue(false)
    mockSetClipboardPromptDismissed.mockReset()
    mockSetCompletionSoundMirror.mockReset()
  })

  it('loads preferences for the current profile', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      achievement_rewards_enabled: true,
      auto_streak_bonus_enabled: true,
      study_session_bonus_enabled: false,
      completion_sound_enabled: true,
    })

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockLoadOrCreateSettings).toHaveBeenCalledWith('profile-1')
    expect(result.current.currentProfile?.profile_name).toBe('shi')
    expect(result.current.preferences?.completion_sound_enabled).toBe(true)
  })

  it('updates completion sound and mirrors local storage', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: true,
    })

    mockUpdateSettingsValue.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: false,
    })

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updatePreference('completion_sound_enabled', false)

    expect(mockUpdateSettingsValue).toHaveBeenCalledWith('profile-1', 'completion_sound_enabled', false)
    expect(mockSetCompletionSoundMirror).toHaveBeenCalledWith('profile-1', false)

    await waitFor(() => expect(result.current.preferences?.completion_sound_enabled).toBe(false))
    expect(result.current.banner?.message).toBe('设置已保存')
  })

  it('keeps loading state successful when mirrored storage reads or writes fail', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: true,
    })

    mockSetCompletionSoundMirror.mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    mockReadClipboardPromptDismissed.mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.preferences?.completion_sound_enabled).toBe(true)
  })

  it('surfaces settings save failures when the backend update rejects', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: true,
    })
    mockUpdateSettingsValue.mockRejectedValue(new Error('update failed'))

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.updatePreference('completion_sound_enabled', false)

    await waitFor(() => expect(result.current.banner?.variant).toBe('error'))
    expect(result.current.banner?.message).toBe('update failed')
    expect(result.current.preferences?.completion_sound_enabled).toBe(true)
  })

  it('saves reward rules as a single settings update', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      base_stars_enabled: true,
      base_stars_value: 5,
    })
    mockUpdateSettingsValues.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      base_stars_enabled: true,
      base_stars_value: 8,
      weekend_bonus_enabled: true,
      weekend_multiplier: 1.5,
    })

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.saveRewardRules({
      base_stars_enabled: true,
      base_stars_value: 8,
      weekend_bonus_enabled: true,
      weekend_multiplier: 1.5,
    })

    expect(mockUpdateSettingsValues).toHaveBeenCalledWith('profile-1', {
      base_stars_enabled: true,
      base_stars_value: 8,
      weekend_bonus_enabled: true,
      weekend_multiplier: 1.5,
    })
    await waitFor(() => expect(result.current.preferences?.base_stars_value).toBe(8))
    expect(result.current.banner?.message).toBe('设置已保存')
  })

  it('does not flip clipboard state when persistence fails', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        is_default: true,
        avatar_color: '#3B82F6',
      },
      error: null,
    })

    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: true,
    })
    mockSetClipboardPromptDismissed.mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { result } = renderHook(() => useSettingsPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    result.current.dismissClipboardPrompt()

    await waitFor(() => expect(result.current.banner?.variant).toBe('error'))
    expect(result.current.clipboardPromptDismissed).toBe(false)
    expect(result.current.banner?.message).toBe('保存粘贴板提示状态失败')
  })
})
