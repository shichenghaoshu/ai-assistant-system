import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExamsAddPage from './ExamsAddPage.jsx'

const { mockUseExamAddPageData } = vi.hoisted(() => ({
  mockUseExamAddPageData: vi.fn(),
}))

vi.mock('../features/exams/useExamsPageData.js', () => ({
  useExamAddPageData: mockUseExamAddPageData,
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

describe('ExamsAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseExamAddPageData.mockReset()
  })

  it('renders the exam entry form and submits a multi-subject bundle', () => {
    const saveExamSubmission = vi.fn()

    mockUseExamAddPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [{ id: 'subject-1', subject_name: '数学' }],
      sessions: [],
      recentRecords: [],
      saving: false,
      saveExamSubmission,
    })

    render(
      <MemoryRouter>
        <ExamsAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('添加考试成绩')).toBeInTheDocument()
    expect(screen.getByText('基本信息')).toBeInTheDocument()
    expect(screen.getByText('成绩详情')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('这是多科目考试，需要记录总分排名'))

    fireEvent.change(screen.getByLabelText('考试名称 *'), { target: { value: '第一次月考' } })
    fireEvent.change(screen.getByLabelText('考试类型 *'), { target: { value: '月考' } })
    fireEvent.change(screen.getByLabelText('学期 *'), { target: { value: '2025-2026学年上学期' } })
    fireEvent.change(screen.getByLabelText('考试日期 *'), { target: { value: '2026-03-26' } })
    fireEvent.change(screen.getByLabelText('科目 1'), { target: { value: '数学' } })
    fireEvent.change(screen.getByLabelText('得分 1'), { target: { value: '95' } })
    fireEvent.change(screen.getByLabelText('满分 1'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: '保存考试成绩' }))

    expect(saveExamSubmission).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({
        exam_name: '第一次月考',
        exam_type: '月考',
        semester: '2025-2026学年上学期',
        exam_date: '2026-03-26',
      }),
      expect.arrayContaining([
        expect.objectContaining({
          subject: '数学',
          score: '95',
          full_score: '100',
        }),
      ]),
      true,
    )
  })

  it('shows a loading state while the current profile is loading', () => {
    mockUseExamAddPageData.mockReturnValue({
      loading: false,
      profileLoading: true,
      profileError: null,
      error: null,
      currentProfile: null,
      subjects: [],
      sessions: [],
      recentRecords: [],
      saving: false,
      saveExamSubmission: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ExamsAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载考试数据...')).toBeInTheDocument()
  })

  it('shows a profile error state before the page form renders', () => {
    mockUseExamAddPageData.mockReturnValue({
      loading: false,
      profileLoading: false,
      profileError: new Error('boom'),
      error: null,
      currentProfile: null,
      subjects: [],
      sessions: [],
      recentRecords: [],
      saving: false,
      saveExamSubmission: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ExamsAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载考试数据，请稍后重试。')).toBeInTheDocument()
  })
})
