import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlanEditPage from './PlanEditPage.jsx'

const { mockFetchPlanEditorData, mockUpdatePlanWithTasks, mockUseCurrentProfile } = vi.hoisted(() => ({
  mockFetchPlanEditorData: vi.fn(),
  mockUpdatePlanWithTasks: vi.fn(),
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
  fetchPlanEditorData: mockFetchPlanEditorData,
  updatePlanWithTasks: mockUpdatePlanWithTasks,
}))

describe('PlanEditPage', () => {
  beforeEach(() => {
    cleanup()
    mockFetchPlanEditorData.mockReset()
    mockUpdatePlanWithTasks.mockReset()
    mockUseCurrentProfile.mockReset()
  })

  it('renders a loading state while the current profile is loading', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: true,
      profile: null,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/plans/edit?id=plan-1']}>
        <PlanEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载计划编辑页面...')).toBeInTheDocument()
  })

  it('renders an empty state when no plan id is present', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/plans/edit']}>
        <PlanEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('缺少计划ID')).toBeInTheDocument()
  })

  it('renders an error state when the current profile fails to load', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: null,
      error: new Error('boom'),
    })

    render(
      <MemoryRouter initialEntries={['/plans/edit?id=plan-1']}>
        <PlanEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载计划编辑页面，请稍后重试。')).toBeInTheDocument()
  })

  it('renders an error state when loading the plan fails', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockFetchPlanEditorData.mockRejectedValue(new Error('boom'))

    render(
      <MemoryRouter initialEntries={['/plans/edit?id=plan-1']}>
        <PlanEditPage />
      </MemoryRouter>,
    )

    await screen.findByText('暂时无法加载计划编辑页面，请稍后重试。')
  })

  it('loads a plan and saves updates', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockFetchPlanEditorData.mockResolvedValue({
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      plan: {
        id: 'plan-1',
        plan_name: '数学复习',
        category: '复习',
        repeat_type: '每天',
        start_time: '2026-03-26T08:00',
        end_time: '2026-03-26T09:00',
      },
      tasks: [
        {
          id: 'task-1',
          task_date: '2026-03-26',
          is_completed: false,
        },
      ],
    })

    mockUpdatePlanWithTasks.mockResolvedValue({
      plan: {
        id: 'plan-1',
        plan_name: '数学强化',
      },
      tasks: [],
    })

    render(
      <MemoryRouter initialEntries={['/plans/edit?id=plan-1']}>
        <PlanEditPage />
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('数学复习')
    expect(screen.getByText('1 条任务记录')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('计划名称'), {
      target: { value: '数学强化' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    await waitFor(() => expect(mockFetchPlanEditorData).toHaveBeenCalledWith('user-1', 'plan-1'))
    await waitFor(() =>
      expect(mockUpdatePlanWithTasks).toHaveBeenCalledWith(
        'profile-1',
        'plan-1',
        expect.objectContaining({
          plan_name: '数学强化',
        }),
      ),
    )
    expect(screen.getByText('学习计划已更新')).toBeInTheDocument()
  })
})
