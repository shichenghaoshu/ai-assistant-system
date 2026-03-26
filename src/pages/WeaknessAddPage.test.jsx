import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WeaknessAddPage from './WeaknessAddPage.jsx'

const { mockUseWeaknessAddPageData } = vi.hoisted(() => ({
  mockUseWeaknessAddPageData: vi.fn(),
}))

vi.mock('../features/weakness/useWeaknessAddPageData.js', () => ({
  useWeaknessAddPageData: mockUseWeaknessAddPageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'user-1',
        email: '488322412@qq.com',
      },
    },
  }),
}))

describe('WeaknessAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseWeaknessAddPageData.mockReset()
  })

  it('shows a loading state while add-page data is being fetched', () => {
    mockUseWeaknessAddPageData.mockReturnValue({
      loading: true,
      error: null,
      currentProfile: null,
      subjects: [],
      recentSubmissions: [],
      submitPracticeRecord: vi.fn(),
      requestPracticeDraft: vi.fn(),
      refresh: vi.fn(),
    })

    render(
      <MemoryRouter>
        <WeaknessAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载练习记录表单...')).toBeInTheDocument()
  })

  it('renders an empty state when no current profile is available', () => {
    mockUseWeaknessAddPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: null,
      subjects: [],
      recentSubmissions: [],
      submitPracticeRecord: vi.fn(),
      requestPracticeDraft: vi.fn(),
    })

    render(
      <MemoryRouter>
        <WeaknessAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂无可用档案')).toBeInTheDocument()
  })

  it('renders the submission form and sends the record payload on submit', async () => {
    const submitPracticeRecord = vi.fn().mockResolvedValue({
      id: 'submission-1',
    })
    const requestPracticeDraft = vi.fn()
    const refresh = vi.fn()

    mockUseWeaknessAddPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [
        {
          id: 'math',
          subject_name: '数学',
        },
      ],
      recentSubmissions: [],
      submitPracticeRecord,
      requestPracticeDraft,
      refresh,
    })

    render(
      <MemoryRouter>
        <WeaknessAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('学科'), { target: { value: 'math' } })
    fireEvent.change(screen.getByLabelText('练习名称'), { target: { value: '函数练习' } })
    fireEvent.change(screen.getByLabelText('练习日期'), { target: { value: '2026-03-26' } })
    fireEvent.change(screen.getByLabelText('总题数'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('正确题数'), { target: { value: '16' } })
    fireEvent.change(screen.getByLabelText('备注'), { target: { value: '刷题记录' } })
    fireEvent.click(screen.getByRole('button', { name: '提交练习记录' }))

    await waitFor(() => {
      expect(submitPracticeRecord).toHaveBeenCalled()
    })
    expect(refresh).toHaveBeenCalled()
    expect(screen.getByText('练习记录已保存')).toBeInTheDocument()
  })

  it('shows an error banner when ai draft generation fails', async () => {
    const requestPracticeDraft = vi.fn().mockRejectedValue(new Error('draft failed'))

    mockUseWeaknessAddPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [
        {
          id: 'math',
          subject_name: '数学',
        },
      ],
      recentSubmissions: [],
      submitPracticeRecord: vi.fn(),
      requestPracticeDraft,
      refresh: vi.fn(),
    })

    render(
      <MemoryRouter>
        <WeaknessAddPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('AI 文本草稿'), {
      target: { value: '函数与导数练习' },
    })
    fireEvent.click(screen.getByRole('button', { name: '生成 AI 草稿' }))

    await waitFor(() => {
      expect(screen.getByText('draft failed')).toBeInTheDocument()
    })
  })
})
