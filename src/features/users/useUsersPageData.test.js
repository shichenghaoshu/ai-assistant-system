import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
  },
}))

const { fetchUsersPageData } = await import('./usersApi.js')

function buildCountChain(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(async () => response),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    in: vi.fn(() => chain),
  }

  return chain
}

describe('fetchUsersPageData', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('loads profiles and per-profile counts for the current account', async () => {
    const profiles = [
      {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        avatar_color: '#3B82F6',
        avatar_path: null,
        is_default: true,
        display_order: 0,
        created_at: '2026-03-25T13:59:02.500284+08:00',
        max_owned_classes: 3,
        max_class_members: 10,
      },
    ]

    mockFrom
      .mockImplementationOnce(() => {
        const response = { data: profiles, error: null }
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          order: vi.fn(async () => response),
          in: vi.fn(() => chain),
        }
        return chain
      })
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))

    const result = await fetchUsersPageData('user-1', '488322412@qq.com')

    expect(result.accountEmail).toBe('488322412@qq.com')
    expect(result.profiles).toHaveLength(1)
    expect(result.profiles[0]).toMatchObject({
      id: 'profile-1',
      counts: {
        learningPlans: 0,
        planTasks: 0,
        behaviorHabits: 0,
        userPreferences: 0,
        examRecords: 0,
      },
    })
  })
})
