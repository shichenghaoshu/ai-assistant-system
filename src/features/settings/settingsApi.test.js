import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const {
  loadOrCreateSettings,
  updateSettingsValue,
  updateSettingsValues,
  setClipboardPromptDismissed,
  readClipboardPromptDismissed,
  setCompletionSoundMirror,
} = await import('./settingsApi.js')

describe('settingsApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initializes default preferences when no row exists', async () => {
    const createdRow = {
      id: 'pref-1',
      profile_id: 'profile-1',
      achievement_rewards_enabled: true,
      auto_streak_bonus_enabled: true,
      study_session_bonus_enabled: false,
      completion_sound_enabled: true,
    }

    mockFrom
      .mockImplementationOnce(() => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          insert: vi.fn(() => chain),
          single: vi.fn(() => chain),
        }

        return chain
      })
      .mockImplementationOnce(() => ({
        insert: vi.fn(() => {
          const chain = {
            select: vi.fn(() => chain),
            single: vi.fn(async () => ({ data: createdRow, error: null })),
          }

          return chain
        }),
      }))

    const result = await loadOrCreateSettings('profile-1')

    expect(result).toMatchObject(createdRow)
  })

  it('rejects when loading settings fails', async () => {
    mockFrom.mockImplementationOnce(() => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => ({ data: null, error: new Error('query failed') })),
      }

      return chain
    })

    await expect(loadOrCreateSettings('profile-1')).rejects.toThrow('query failed')
  })

  it('updates a settings field with a fresh timestamp', async () => {
    const updatedRow = {
      id: 'pref-1',
      profile_id: 'profile-1',
      completion_sound_enabled: false,
    }

    mockFrom.mockImplementationOnce(() => {
      const chain = {
        update: vi.fn((payload) => {
          expect(payload).toMatchObject({
            completion_sound_enabled: false,
          })
          expect(typeof payload.updated_at).toBe('string')
          return chain
        }),
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: updatedRow, error: null })),
      }

      return chain
    })

    const result = await updateSettingsValue('profile-1', 'completion_sound_enabled', false)

    expect(result).toMatchObject(updatedRow)
  })

  it('updates multiple reward-rule fields together', async () => {
    const updatedRow = {
      id: 'pref-1',
      profile_id: 'profile-1',
      base_stars_enabled: true,
      base_stars_value: 8,
      weekend_bonus_enabled: true,
      weekend_multiplier: 1.5,
    }

    mockFrom.mockImplementationOnce(() => {
      const chain = {
        update: vi.fn((payload) => {
          expect(payload).toMatchObject({
            base_stars_enabled: true,
            base_stars_value: 8,
            weekend_bonus_enabled: true,
            weekend_multiplier: 1.5,
          })
          expect(typeof payload.updated_at).toBe('string')
          return chain
        }),
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: updatedRow, error: null })),
      }

      return chain
    })

    const result = await updateSettingsValues('profile-1', {
      base_stars_enabled: true,
      base_stars_value: 8,
      weekend_bonus_enabled: true,
      weekend_multiplier: 1.5,
    })

    expect(result).toMatchObject(updatedRow)
  })

  it('persists clipboard prompt state in local storage', () => {
    setClipboardPromptDismissed('profile-1', true)

    expect(readClipboardPromptDismissed('profile-1')).toBe(true)

    setClipboardPromptDismissed('profile-1', false)

    expect(readClipboardPromptDismissed('profile-1')).toBe(false)
  })

  it('swallows storage failures when mirroring completion sound', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(() => setCompletionSoundMirror('profile-1', true)).not.toThrow()
  })

  it('returns a safe default when clipboard storage read fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(readClipboardPromptDismissed('profile-1')).toBe(false)
  })

  it('reports clipboard persistence failure without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(setClipboardPromptDismissed('profile-1', true)).toBe(false)
  })
})
