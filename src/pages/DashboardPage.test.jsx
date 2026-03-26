import { act, cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardPage from './DashboardPage.jsx'

const { mockUseDashboardPageData } = vi.hoisted(() => ({
  mockUseDashboardPageData: vi.fn(),
}))

vi.mock('../features/dashboard/useDashboardPageData.js', () => ({
  useDashboardPageData: mockUseDashboardPageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'user-1',
        email: 'saved@example.com',
      },
    },
  }),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseDashboardPageData.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the real dashboard shell with honest empty states', () => {
    mockUseDashboardPageData.mockReturnValue({
      loading: false,
      error: null,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      metrics: {
        plans: 0,
        tasks: 0,
        habits: 0,
        redemptions: 0,
      },
      recentPlans: [],
      recentTasks: [],
      todayTasks: [],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('shi')).toBeInTheDocument()
    expect(screen.getByText('当前还没有学习计划')).toBeInTheDocument()
    expect(screen.getByText('当前还没有任务记录')).toBeInTheDocument()

    const emptyPlanCard = screen.getByText('当前还没有学习计划').closest('article')
    const addPlanLink = within(emptyPlanCard ?? screen.getByText('当前还没有学习计划').parentElement).getByRole(
      'link',
      { name: '去添加学习计划' },
    )

    expect(addPlanLink).toHaveAttribute('href', '/plans/add')
  })

  it('renders today tasks and a working focus timer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T10:00:00+08:00'))

    mockUseDashboardPageData.mockReturnValue({
      loading: false,
      error: null,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      metrics: {
        plans: 1,
        tasks: 1,
        habits: 0,
        redemptions: 0,
      },
      recentPlans: [],
      recentTasks: [],
      todayTasks: [
        {
          id: 'task-1',
          task_date: '2026-03-26',
          is_completed: false,
          plan: {
            id: 'plan-1',
            plan_name: '数学练习',
            category: '数学',
          },
        },
      ],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('今天的任务')).toHaveLength(1)
    expect(screen.getAllByText('数学练习')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '开始专注' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.getByText('00:00')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: '开始专注' }).click()
    })

    expect(screen.getByRole('button', { name: '暂停专注' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.getByText('00:02')).toBeInTheDocument()

    vi.useRealTimers()
  })
})
