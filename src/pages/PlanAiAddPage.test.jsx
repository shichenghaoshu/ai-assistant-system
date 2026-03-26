import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlanAiAddPage from './PlanAiAddPage.jsx'

const { mockCreatePlanWithTasks, mockGeneratePlanDraft, mockUseCurrentProfile } = vi.hoisted(() => ({
  mockCreatePlanWithTasks: vi.fn(),
  mockGeneratePlanDraft: vi.fn(),
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
  generatePlanDraft: mockGeneratePlanDraft,
}))

describe('PlanAiAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockCreatePlanWithTasks.mockReset()
    mockGeneratePlanDraft.mockReset()
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
        <PlanAiAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载 AI 计划页面...')).toBeInTheDocument()
  })

  it('renders an empty state when there is no current profile', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: null,
      error: null,
    })

    render(
      <MemoryRouter>
        <PlanAiAddPage />
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
        <PlanAiAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载 AI 计划页面，请稍后重试。')).toBeInTheDocument()
  })

  it('generates a draft and saves it as a plan', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockGeneratePlanDraft.mockResolvedValue({
      source: 'ai',
      warning: null,
      draft: {
        plan_name: '周末语文冲刺',
        category: '语文',
        repeat_type: '每天',
        start_time: '2026-03-26T08:00',
        end_time: '2026-03-26T09:00',
        taskDatesText: '2026-03-26\n2026-03-27',
      },
    })

    mockCreatePlanWithTasks.mockResolvedValue({
      plan: {
        id: 'plan-1',
        plan_name: '周末语文冲刺',
      },
      tasks: [],
    })

    render(
      <MemoryRouter>
        <PlanAiAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('AI 需求描述'), {
      target: { value: '周末帮我安排两天语文复习' },
    })
    fireEvent.click(screen.getByRole('button', { name: '生成草稿' }))

    await screen.findByText('周末语文冲刺')
    expect(mockGeneratePlanDraft).toHaveBeenCalledWith('profile-1', '周末帮我安排两天语文复习')

    fireEvent.click(screen.getByRole('button', { name: '保存计划' }))

    await waitFor(() =>
      expect(mockCreatePlanWithTasks).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          plan_name: '周末语文冲刺',
        }),
      ),
    )
  })

  it('shows an error banner when draft generation fails', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockGeneratePlanDraft.mockRejectedValue(new Error('draft failed'))

    render(
      <MemoryRouter>
        <PlanAiAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('AI 需求描述'), {
      target: { value: '周末帮我安排两天语文复习' },
    })
    fireEvent.click(screen.getByRole('button', { name: '生成草稿' }))

    await screen.findByText('draft failed')
  })
})
