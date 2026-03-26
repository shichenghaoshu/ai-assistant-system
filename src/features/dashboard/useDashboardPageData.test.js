import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockFetchCurrentProfile } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetchCurrentProfile: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
  },
}))

vi.mock('../account/useCurrentProfile.js', () => ({
  fetchCurrentProfile: mockFetchCurrentProfile,
}))

const { useDashboardPageData } = await import('./useDashboardPageData.js')

function buildListChain(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => response),
    in: vi.fn(async () => response),
  }

  return chain
}

function buildCountChain(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(async () => response),
  }

  return chain
}

describe('useDashboardPageData', () => {
  beforeEach(() => {
    cleanup()
    mockFrom.mockReset()
    mockFetchCurrentProfile.mockReset()
  })

  it('loads today tasks alongside the regular dashboard metrics', async () => {
    mockFetchCurrentProfile.mockResolvedValue({
      id: 'profile-1',
      account_id: 'user-1',
      profile_name: 'shi',
      is_default: true,
    })

    mockFrom
      .mockImplementationOnce(() =>
        buildListChain({
          data: [
            {
              id: 'plan-1',
              plan_name: '数学练习',
              category: '数学',
              repeat_type: '每天',
              updated_at: '2026-03-26T09:00:00+08:00',
              created_at: '2026-03-25T09:00:00+08:00',
            },
          ],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildListChain({
          data: [
            {
              id: 'task-1',
              plan_id: 'plan-1',
              task_date: '2026-03-25',
              is_completed: false,
              completed_count: 1,
              target_count: 3,
              total_duration_seconds: 600,
              session_count: 2,
              created_at: '2026-03-25T09:30:00+08:00',
            },
          ],
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        buildListChain({
          data: [
            {
              id: 'task-today-1',
              plan_id: 'plan-1',
              task_date: '2026-03-26',
              is_completed: false,
              completed_count: 0,
              target_count: 1,
              total_duration_seconds: 0,
              session_count: 0,
              created_at: '2026-03-26T09:00:00+08:00',
            },
          ],
          error: null,
        }),
      )
      .mockImplementationOnce(() => buildCountChain({ count: 1, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 1, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() => buildCountChain({ count: 0, error: null }))
      .mockImplementationOnce(() =>
        buildListChain({
          data: [
            {
              id: 'plan-1',
              plan_name: '数学练习',
              category: '数学',
            },
          ],
          error: null,
        }),
      )

    const { result } = renderHook(() => useDashboardPageData('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.profile?.profile_name).toBe('shi')
    expect(result.current.metrics).toMatchObject({
      plans: 1,
      tasks: 1,
      habits: 0,
      redemptions: 0,
    })
    expect(result.current.todayTasks).toHaveLength(1)
    expect(result.current.todayTasks[0]).toMatchObject({
      id: 'task-today-1',
      plan: {
        id: 'plan-1',
        plan_name: '数学练习',
      },
    })
  })
})
