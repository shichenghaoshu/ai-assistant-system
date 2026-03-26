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
  DEFAULT_HABIT_TEMPLATES,
  createHabit,
  deleteHabit,
  fetchHabitsForProfile,
  importDefaultHabits,
  loadTodayCheckins,
  saveHabitOrder,
  saveTodayCheckins,
  summarizeHabits,
  updateHabit,
} = await import('./habitsApi.js')

function makeQueryChain(response) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => response),
    single: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
    in: vi.fn(() => chain),
  }

  return chain
}

describe('habitsApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    window.localStorage.clear()
  })

  it('loads habits for a profile and summarizes them', async () => {
    const unsorted = [
      {
        id: 'habit-2',
        habit_name: '多喝水',
        habit_type: 'daily_multiple',
        display_order: 2,
        points_per_checkin: 1,
        is_active: false,
        created_at: '2026-03-26T10:10:00.000Z',
      },
      {
        id: 'habit-1',
        habit_name: '早起',
        habit_type: 'daily_once',
        display_order: 0,
        points_per_checkin: 2,
        is_active: true,
        created_at: '2026-03-26T09:10:00.000Z',
      },
    ]

    mockFrom.mockImplementationOnce(() => makeQueryChain({ data: unsorted, error: null }))

    const habits = await fetchHabitsForProfile('profile-1')

    expect(mockFrom).toHaveBeenCalledWith('behavior_habits')
    expect(habits[0].id).toBe('habit-1')
    expect(habits[1].id).toBe('habit-2')
    expect(summarizeHabits(habits)).toEqual({
      totalHabits: 2,
      activeHabits: 1,
      inactiveHabits: 1,
      positivePoints: 3,
      negativePoints: 0,
    })
  })

  it('creates a habit with the current profile identity and next display order', async () => {
    const inserted = {
      id: 'habit-3',
      habit_name: '每日阅读',
      habit_type: 'daily_once',
      display_order: 3,
    }

    mockFrom.mockImplementationOnce(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: inserted, error: null })),
        })),
      })),
    }))

    const result = await createHabit(
      {
        id: 'profile-1',
        account_id: 'account-1',
      },
      {
        habit_name: '每日阅读',
        habit_description: '每天读书 20 分钟',
        habit_type: 'daily_once',
        max_daily_count: '',
        points_per_checkin: '2',
        requires_approval: true,
        icon_name: 'book-open',
        color_scheme: 'blue',
        is_active: false,
      },
      [
        { id: 'habit-1', display_order: 0 },
        { id: 'habit-2', display_order: 2 },
      ],
    )

    expect(result).toMatchObject(inserted)
    expect(result).toMatchObject({
      habit_description: '',
      max_daily_count: 1,
      points_per_checkin: 0,
      requires_approval: false,
      is_active: true,
    })
    expect(mockFrom).toHaveBeenCalledWith('behavior_habits')
    const insertPayload = mockFrom.mock.results[0].value.insert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      user_id: 'account-1',
      profile_id: 'profile-1',
      habit_name: '每日阅读',
      habit_description: '每天读书 20 分钟',
      habit_type: 'daily_once',
      max_daily_count: 1,
      points_per_checkin: 2,
      requires_approval: true,
      icon_name: 'book-open',
      color_scheme: 'blue',
      is_active: false,
      display_order: 3,
    })
  })

  it('updates the habit order one row at a time', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null })),
    }))

    mockFrom.mockImplementation(() => ({
      update,
    }))

    await saveHabitOrder([
      { id: 'habit-2', display_order: 0 },
      { id: 'habit-1', display_order: 1 },
    ])

    expect(update).toHaveBeenNthCalledWith(1, { display_order: 0, updated_at: expect.any(String) })
    expect(update).toHaveBeenNthCalledWith(2, { display_order: 1, updated_at: expect.any(String) })
  })

  it('imports only missing default templates', async () => {
    const existingTemplate = DEFAULT_HABIT_TEMPLATES[0]
    const insert = vi.fn(() => ({
      select: vi.fn(async () => ({ data: [{ id: 'habit-new' }], error: null })),
    }))

    mockFrom.mockImplementation(() => ({
      insert,
    }))

    const result = await importDefaultHabits(
      {
        id: 'profile-1',
        account_id: 'account-1',
      },
      [
        {
          habit_name: existingTemplate.habit_name,
          habit_type: existingTemplate.habit_type,
          display_order: 0,
        },
      ],
    )

    expect(result).toEqual([
      expect.objectContaining({
        id: 'habit-new',
        habit_description: '',
        max_daily_count: 1,
        points_per_checkin: 0,
        requires_approval: false,
        is_active: true,
      }),
    ])
    const payload = insert.mock.calls[0][0]
    expect(payload.some((item) => item.habit_name === existingTemplate.habit_name)).toBe(false)
    expect(payload.every((item) => item.profile_id === 'profile-1' && item.user_id === 'account-1')).toBe(true)
  })

  it('stores today check-ins per profile and date', () => {
    saveTodayCheckins('profile-1', { 'habit-1': 2, 'habit-2': 0 }, '2026-03-26')

    expect(loadTodayCheckins('profile-1', '2026-03-26')).toEqual({
      'habit-1': 2,
      'habit-2': 0,
    })
  })

  it('updates and deletes a habit by id', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ data: { id: 'habit-1' }, error: null })),
    }))
    const deleteMethod = vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null })),
    }))

    mockFrom
      .mockImplementationOnce(() => ({
        update,
      }))
      .mockImplementationOnce(() => ({
        delete: deleteMethod,
      }))

    await updateHabit('habit-1', {
      habit_name: '早睡早起',
      is_active: true,
    })

    await deleteHabit('habit-1')

    expect(update).toHaveBeenCalled()
    expect(deleteMethod).toHaveBeenCalled()
  })
})
