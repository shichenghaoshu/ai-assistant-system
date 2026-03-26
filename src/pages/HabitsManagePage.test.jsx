import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HabitsManagePage from './HabitsManagePage.jsx'

const { mockUseHabitsManagePageData } = vi.hoisted(() => ({
  mockUseHabitsManagePageData: vi.fn(),
}))

vi.mock('../features/habits/useHabitsManagePageData.js', () => ({
  useHabitsManagePageData: mockUseHabitsManagePageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'account-1',
        email: 'saved@example.com',
      },
    },
  }),
}))

describe('HabitsManagePage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockUseHabitsManagePageData.mockReset()
  })

  it('renders loading, error, and empty states', () => {
    mockUseHabitsManagePageData.mockReturnValue({
      loading: true,
      error: null,
      currentProfile: null,
      habits: [],
      summary: null,
      banner: null,
      createHabit: vi.fn(),
      updateHabit: vi.fn(),
      deleteHabit: vi.fn(),
      toggleHabitActive: vi.fn(),
      moveHabit: vi.fn(),
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载行为习惯数据...')).toBeInTheDocument()
  })

  it('renders an empty state after loading when no habits exist', () => {
    mockUseHabitsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: '我的计划',
      },
      habits: [],
      summary: {
        totalHabits: 0,
        activeHabits: 0,
        inactiveHabits: 0,
        positivePoints: 0,
        negativePoints: 0,
      },
      banner: null,
      createHabit: vi.fn(),
      updateHabit: vi.fn(),
      deleteHabit: vi.fn(),
      toggleHabitActive: vi.fn(),
      moveHabit: vi.fn(),
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('当前还没有行为习惯')).toBeInTheDocument()
  })

  it('creates a habit from the editor form', () => {
    const createHabit = vi.fn()

    mockUseHabitsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: '我的计划',
      },
      habits: [],
      summary: {
        totalHabits: 0,
        activeHabits: 0,
        inactiveHabits: 0,
        positivePoints: 0,
        negativePoints: 0,
      },
      banner: null,
      createHabit,
      updateHabit: vi.fn(),
      deleteHabit: vi.fn(),
      toggleHabitActive: vi.fn(),
      moveHabit: vi.fn(),
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('习惯名称'), { target: { value: '每日阅读' } })
    fireEvent.change(screen.getByLabelText('积分'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: '保存习惯' }))

    expect(createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        habit_name: '每日阅读',
        points_per_checkin: '3',
      }),
    )
  })

  it('renders existing habits and allows editing', () => {
    const updateHabit = vi.fn()

    mockUseHabitsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: '我的计划',
      },
      habits: [
        {
          id: 'habit-1',
          habit_name: '早起',
          habit_description: '每天 6 点前起床',
          habit_type: 'daily_once',
          points_per_checkin: 2,
          max_daily_count: 1,
          requires_approval: false,
          icon_name: 'sun',
          color_scheme: 'orange',
          is_active: true,
          display_order: 0,
        },
      ],
      summary: {
        totalHabits: 1,
        activeHabits: 1,
        inactiveHabits: 0,
        positivePoints: 2,
        negativePoints: 0,
      },
      banner: null,
      createHabit: vi.fn(),
      updateHabit,
      deleteHabit: vi.fn(),
      toggleHabitActive: vi.fn(),
      moveHabit: vi.fn(),
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '早起' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '编辑' }))
    fireEvent.change(screen.getByLabelText('习惯名称'), { target: { value: '早睡早起' } })
    fireEvent.click(screen.getByRole('button', { name: '保存习惯' }))

    expect(updateHabit).toHaveBeenCalledWith(
      'habit-1',
      expect.objectContaining({
        habit_name: '早睡早起',
      }),
    )
  })

  it('shows an error when reordering fails', async () => {
    const moveHabit = vi.fn().mockRejectedValue(new Error('move failed'))

    mockUseHabitsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: '我的计划',
      },
      habits: [
        {
          id: 'habit-1',
          habit_name: '早起',
          habit_description: '每天 6 点前起床',
          habit_type: 'daily_once',
          points_per_checkin: 2,
          max_daily_count: 1,
          requires_approval: false,
          icon_name: 'sun',
          color_scheme: 'orange',
          is_active: true,
          display_order: 0,
        },
        {
          id: 'habit-2',
          habit_name: '阅读',
          habit_description: '每日阅读 20 分钟',
          habit_type: 'daily_once',
          points_per_checkin: 1,
          max_daily_count: 1,
          requires_approval: false,
          icon_name: 'book',
          color_scheme: 'blue',
          is_active: true,
          display_order: 1,
        },
      ],
      summary: {
        totalHabits: 2,
        activeHabits: 2,
        inactiveHabits: 0,
        positivePoints: 3,
        negativePoints: 0,
      },
      banner: null,
      createHabit: vi.fn(),
      updateHabit: vi.fn(),
      deleteHabit: vi.fn(),
      toggleHabitActive: vi.fn(),
      moveHabit,
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: '上移' })[1])

    expect(await screen.findByText('move failed')).toBeInTheDocument()
  })

  it('shows an error when toggling active state fails', async () => {
    const toggleHabitActive = vi.fn().mockRejectedValue(new Error('toggle failed'))

    mockUseHabitsManagePageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: '我的计划',
      },
      habits: [
        {
          id: 'habit-1',
          habit_name: '早起',
          habit_description: '每天 6 点前起床',
          habit_type: 'daily_once',
          points_per_checkin: 2,
          max_daily_count: 1,
          requires_approval: false,
          icon_name: 'sun',
          color_scheme: 'orange',
          is_active: true,
          display_order: 0,
        },
      ],
      summary: {
        totalHabits: 1,
        activeHabits: 1,
        inactiveHabits: 0,
        positivePoints: 2,
        negativePoints: 0,
      },
      banner: null,
      createHabit: vi.fn(),
      updateHabit: vi.fn(),
      deleteHabit: vi.fn(),
      toggleHabitActive,
      moveHabit: vi.fn(),
      importDefaultHabits: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsManagePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '停用' }))

    expect(await screen.findByText('toggle failed')).toBeInTheDocument()
  })
})
