import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlansManagePage from './PlansManagePage.jsx'

const { mockFetchPlansManagePageData } = vi.hoisted(() => ({
  mockFetchPlansManagePageData: vi.fn(),
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

vi.mock('../features/plans/plansApi.js', () => ({
  fetchPlansManagePageData: mockFetchPlansManagePageData,
}))

describe('PlansManagePage', () => {
  beforeEach(() => {
    mockFetchPlansManagePageData.mockReset()
  })

  it('renders a loading state while plans are loading', () => {
    mockFetchPlansManagePageData.mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <PlansManagePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载计划管理数据...')).toBeInTheDocument()
  })

  it('renders an error state when loading fails', async () => {
    mockFetchPlansManagePageData.mockRejectedValue(new Error('boom'))

    render(
      <MemoryRouter>
        <PlansManagePage />
      </MemoryRouter>,
    )

    await screen.findByText('暂时无法加载计划管理数据，请稍后重试。')
  })

  it('renders plans and filters them by name', async () => {
    mockFetchPlansManagePageData.mockResolvedValue({
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      summary: {
        totalPlans: 2,
        totalTasks: 3,
        completedTasks: 1,
      },
      plans: [
        {
          id: 'plan-1',
          plan_name: '数学复习',
          category: '复习',
          repeat_type: '每天',
          taskCount: 2,
          completedTaskCount: 1,
          updated_at: '2026-03-25T10:00:00.000Z',
        },
        {
          id: 'plan-2',
          plan_name: '英语单词',
          category: '记忆',
          repeat_type: '每周',
          taskCount: 1,
          completedTaskCount: 0,
          updated_at: '2026-03-24T10:00:00.000Z',
        },
      ],
    })

    render(
      <MemoryRouter>
        <PlansManagePage />
      </MemoryRouter>,
    )

    await screen.findByText('数学复习')

    expect(screen.getByText('2 个计划', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('3 个任务', { selector: 'strong' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('搜索计划名称或分类...'), {
      target: { value: '数学' },
    })

    expect(screen.getByText('数学复习')).toBeInTheDocument()
    expect(screen.queryByText('英语单词')).not.toBeInTheDocument()
  })

  it('shows an honest empty state when there are no plans', async () => {
    mockFetchPlansManagePageData.mockResolvedValue({
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      summary: {
        totalPlans: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
      plans: [],
    })

    render(
      <MemoryRouter>
        <PlansManagePage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('当前还没有学习计划')).toBeInTheDocument())
  })
})
