import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HabitsCheckinPage from './HabitsCheckinPage.jsx'

const { mockUseHabitsCheckinPageData } = vi.hoisted(() => ({
  mockUseHabitsCheckinPageData: vi.fn(),
}))

vi.mock('../features/habits/useHabitsCheckinPageData.js', () => ({
  useHabitsCheckinPageData: mockUseHabitsCheckinPageData,
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

describe('HabitsCheckinPage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockUseHabitsCheckinPageData.mockReset()
  })

  it('renders loading and empty states', () => {
    mockUseHabitsCheckinPageData.mockReturnValue({
      loading: true,
      error: null,
      currentProfile: null,
      habits: [],
      savedCheckins: {},
      saveCheckins: vi.fn(),
      clearCheckins: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载打卡数据...')).toBeInTheDocument()
  })

  it('saves the current check-in counts', () => {
    const saveCheckins = vi.fn()

    mockUseHabitsCheckinPageData.mockReturnValue({
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
          is_active: true,
          icon_name: 'sun',
          color_scheme: 'orange',
        },
      ],
      savedCheckins: {
        'habit-1': 1,
      },
      saveCheckins,
      clearCheckins: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('早起 今日打卡次数'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: '保存今日打卡' }))

    expect(saveCheckins).toHaveBeenCalledWith({
      'habit-1': 3,
    })
  })

  it('merges loaded saved check-ins with local edits before saving', () => {
    const saveCheckins = vi.fn()

    mockUseHabitsCheckinPageData.mockReturnValue({
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
          is_active: true,
          icon_name: 'sun',
          color_scheme: 'orange',
        },
        {
          id: 'habit-2',
          habit_name: '阅读',
          habit_description: '每日阅读 20 分钟',
          habit_type: 'daily_once',
          points_per_checkin: 1,
          max_daily_count: 1,
          is_active: true,
          icon_name: 'book',
          color_scheme: 'blue',
        },
      ],
      savedCheckins: {
        'habit-1': 1,
        'habit-2': 2,
      },
      saveCheckins,
      clearCheckins: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('早起 今日打卡次数'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: '保存今日打卡' }))

    expect(saveCheckins).toHaveBeenCalledWith({
      'habit-1': 3,
      'habit-2': 2,
    })
  })

  it('shows an error when saving returns false', async () => {
    const saveCheckins = vi.fn().mockResolvedValue(false)

    mockUseHabitsCheckinPageData.mockReturnValue({
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
          is_active: true,
          icon_name: 'sun',
          color_scheme: 'orange',
        },
      ],
      savedCheckins: {},
      saveCheckins,
      clearCheckins: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '保存今日打卡' }))

    expect(await screen.findByText('保存失败')).toBeInTheDocument()
    expect(screen.queryByText('今日打卡已保存')).not.toBeInTheDocument()
  })

  it('shows an error when clearing returns false', async () => {
    const clearCheckins = vi.fn().mockResolvedValue(false)

    mockUseHabitsCheckinPageData.mockReturnValue({
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
          is_active: true,
          icon_name: 'sun',
          color_scheme: 'orange',
        },
      ],
      savedCheckins: {
        'habit-1': 1,
      },
      saveCheckins: vi.fn(),
      clearCheckins,
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '清空今日打卡' }))

    expect(await screen.findByText('清空失败')).toBeInTheDocument()
    expect(screen.queryByText('今日打卡已清空')).not.toBeInTheDocument()
  })

  it('shows checked habits from saved state', () => {
    mockUseHabitsCheckinPageData.mockReturnValue({
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
          is_active: true,
          icon_name: 'sun',
          color_scheme: 'orange',
        },
      ],
      savedCheckins: {
        'habit-1': 1,
      },
      saveCheckins: vi.fn(),
      clearCheckins: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HabitsCheckinPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('已打卡 1 次')).toBeInTheDocument()
  })
})
