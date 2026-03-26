import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: null } })),
      })),
    },
  },
}))

const { clearProfileData, deleteProfile, updateProfile } = await import('./usersApi.js')

describe('usersApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('updates a profile with the edited fields', async () => {
    const updatedProfile = {
      id: 'profile-1',
      account_id: 'user-1',
      profile_name: 'new name',
      avatar_color: '#10B981',
      is_default: false,
      display_order: 2,
      max_owned_classes: 4,
      max_class_members: 12,
    }

    mockFrom.mockImplementationOnce(() => {
      const chain = {
        update: vi.fn((payload) => {
          expect(payload).toMatchObject({
            profile_name: 'new name',
            avatar_color: '#10B981',
            is_default: false,
            display_order: 2,
            max_owned_classes: 4,
            max_class_members: 12,
          })
          return chain
        }),
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: updatedProfile, error: null })),
      }

      return chain
    })

    const result = await updateProfile('profile-1', {
      profile_name: 'new name',
      avatar_color: '#10B981',
      is_default: false,
      display_order: 2,
      max_owned_classes: 4,
      max_class_members: 12,
    })

    expect(result).toMatchObject(updatedProfile)
  })

  it('clears profile-owned records before deleting the profile row', async () => {
    mockFrom.mockImplementation(() => {
      const chain = {
        delete: vi.fn(() => chain),
        eq: vi.fn(async () => ({ error: null })),
      }

      return chain
    })

    await clearProfileData('profile-1')

    expect(mockFrom.mock.calls.map(([table]) => table)).toEqual(
      expect.arrayContaining([
        'learning_plans',
        'plan_tasks',
        'behavior_habits',
        'user_preferences',
        'exam_records',
      ]),
    )
  })

  it('deletes the profile after clearing dependent records', async () => {
    mockFrom.mockImplementation(() => {
      const chain = {
        delete: vi.fn(() => chain),
        eq: vi.fn(async () => ({ error: null })),
        select: vi.fn(() => chain),
      }

      return chain
    })

    await deleteProfile('profile-1')

    expect(mockFrom.mock.calls.map(([table]) => table)).toEqual(
      expect.arrayContaining([
        'learning_plans',
        'plan_tasks',
        'behavior_habits',
        'user_preferences',
        'exam_records',
        'profiles',
      ]),
    )
  })
})
