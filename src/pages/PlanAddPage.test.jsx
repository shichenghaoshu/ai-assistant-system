import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlanAddPage from './PlanAddPage.jsx'

const { mockCreatePlanWithTasks, mockUseCurrentProfile } = vi.hoisted(() => ({
  mockCreatePlanWithTasks: vi.fn(),
  mockUseCurrentProfile: vi.fn(),
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

vi.mock('../features/account/useCurrentProfile.js', () => ({
  useCurrentProfile: mockUseCurrentProfile,
}))

vi.mock('../features/plans/plansApi.js', () => ({
  createPlanWithTasks: mockCreatePlanWithTasks,
}))

describe('PlanAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockCreatePlanWithTasks.mockReset()
    mockUseCurrentProfile.mockReset()
  })

  it('renders a loading state while the current profile is loading', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: true,
      profile: null,
      error: null,
    })

    render(
      <MemoryRouter>
        <PlanAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载计划表单...')).toBeInTheDocument()
  })

  it('renders an empty state when there is no current profile', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: null,
      error: null,
    })

    render(
      <MemoryRouter>
        <PlanAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂无可用档案')).toBeInTheDocument()
  })

  it('renders an error state when the current profile fails to load', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: null,
      error: new Error('boom'),
    })

    render(
      <MemoryRouter>
        <PlanAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载计划创建信息，请稍后重试。')).toBeInTheDocument()
  })

  it('submits a new plan with its task list', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockCreatePlanWithTasks.mockResolvedValue({
      plan: {
        id: 'plan-1',
        plan_name: '数学复习',
      },
      tasks: [],
    })

    render(
      <MemoryRouter>
        <PlanAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('计划名称'), { target: { value: '数学复习' } })
    fireEvent.change(screen.getByLabelText('分类'), { target: { value: '复习' } })
    fireEvent.change(screen.getByLabelText('重复规则'), { target: { value: '每天' } })
    fireEvent.change(screen.getByLabelText('开始时间'), { target: { value: '2026-03-26T08:00' } })
    fireEvent.change(screen.getByLabelText('结束时间'), { target: { value: '2026-03-26T09:00' } })
    fireEvent.change(screen.getByLabelText('任务安排'), { target: { value: '2026-03-26\n2026-03-27' } })
    fireEvent.click(screen.getByRole('button', { name: '保存计划' }))

    await waitFor(() =>
      expect(mockCreatePlanWithTasks).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          plan_name: '数学复习',
          category: '复习',
          repeat_type: '每天',
          start_time: '2026-03-26T08:00',
          end_time: '2026-03-26T09:00',
          taskDatesText: '2026-03-26\n2026-03-27',
        }),
      ),
    )

    await screen.findByText('学习计划已保存')
  })
})
