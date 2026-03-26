import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlanBatchAddPage from './PlanBatchAddPage.jsx'

const { mockCreatePlansFromDrafts, mockParseBatchPlanInput, mockUseCurrentProfile } = vi.hoisted(() => ({
  mockCreatePlansFromDrafts: vi.fn(),
  mockParseBatchPlanInput: vi.fn(),
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
  createPlansFromDrafts: mockCreatePlansFromDrafts,
  parseBatchPlanInput: mockParseBatchPlanInput,
}))

describe('PlanBatchAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockCreatePlansFromDrafts.mockReset()
    mockParseBatchPlanInput.mockReset()
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
        <PlanBatchAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载批量添加页面...')).toBeInTheDocument()
  })

  it('renders an empty state when there is no current profile', () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: null,
      error: null,
    })

    render(
      <MemoryRouter>
        <PlanBatchAddPage />
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
        <PlanBatchAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载批量添加页面，请稍后重试。')).toBeInTheDocument()
  })

  it('parses batch input and creates plans from the draft list', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockParseBatchPlanInput.mockResolvedValue({
      source: 'local',
      drafts: [
        {
          plan_name: '数学复习',
          category: '复习',
          repeat_type: '每天',
          taskDatesText: '2026-03-26',
        },
        {
          plan_name: '英语单词',
          category: '记忆',
          repeat_type: '每周',
          taskDatesText: '2026-03-27',
        },
      ],
    })

    mockCreatePlansFromDrafts.mockResolvedValue({
      createdPlans: [
        { id: 'plan-1', plan_name: '数学复习' },
        { id: 'plan-2', plan_name: '英语单词' },
      ],
    })

    render(
      <MemoryRouter>
        <PlanBatchAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('批量文本'), {
      target: {
        value: '数学复习 | 复习 | 每天\n英语单词 | 记忆 | 每周',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '解析计划' }))

    await screen.findByText('2 个待创建计划')
    expect(mockParseBatchPlanInput).toHaveBeenCalledWith('profile-1', '数学复习 | 复习 | 每天\n英语单词 | 记忆 | 每周')

    fireEvent.click(screen.getByRole('button', { name: '批量创建' }))

    await waitFor(() =>
      expect(mockCreatePlansFromDrafts).toHaveBeenCalledWith(
        'profile-1',
        expect.arrayContaining([
          expect.objectContaining({ plan_name: '数学复习' }),
          expect.objectContaining({ plan_name: '英语单词' }),
        ]),
      ),
    )
  })

  it('shows an error banner when batch parsing fails', async () => {
    mockUseCurrentProfile.mockReturnValue({
      loading: false,
      profile: {
        id: 'profile-1',
        profile_name: 'shi',
        is_default: true,
      },
      error: null,
    })

    mockParseBatchPlanInput.mockRejectedValue(new Error('parse failed'))

    render(
      <MemoryRouter>
        <PlanBatchAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('批量文本'), {
      target: {
        value: '数学复习 | 复习 | 每天',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '解析计划' }))

    await screen.findByText('parse failed')
  })
})
