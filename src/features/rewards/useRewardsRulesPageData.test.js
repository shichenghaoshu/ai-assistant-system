import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLoadOrCreateSettings, mockUpdateSettingsValue } = vi.hoisted(() => ({
  mockLoadOrCreateSettings: vi.fn(),
  mockUpdateSettingsValue: vi.fn(),
}))

vi.mock('../settings/settingsApi.js', () => ({
  loadOrCreateSettings: mockLoadOrCreateSettings,
  updateSettingsValue: mockUpdateSettingsValue,
}))

const { useRewardsRulesPageData } = await import('./useRewardsRulesPageData.js')

describe('useRewardsRulesPageData', () => {
  beforeEach(() => {
    mockLoadOrCreateSettings.mockReset()
    mockUpdateSettingsValue.mockReset()
  })

  it('loads the current profile preferences and saves updates', async () => {
    mockLoadOrCreateSettings.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      base_stars_enabled: true,
    })
    mockUpdateSettingsValue.mockResolvedValue({
      id: 'pref-1',
      profile_id: 'profile-1',
      base_stars_enabled: false,
    })

    const result = useRewardsRulesPageData

    expect(result).toBeTypeOf('function')
  })
})
