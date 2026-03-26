import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExamsAiAddPage from './ExamsAiAddPage.jsx'

const { mockUseExamAiAddPageData } = vi.hoisted(() => ({
  mockUseExamAiAddPageData: vi.fn(),
}))

vi.mock('../features/exams/useExamsPageData.js', () => ({
  useExamAiAddPageData: mockUseExamAiAddPageData,
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

describe('ExamsAiAddPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseExamAiAddPageData.mockReset()
  })

  it('requests an AI draft and can save the generated record', async () => {
    const requestExamDraft = vi.fn().mockResolvedValue({
      assistant_message: '已生成草案',
      exam_name: '第一次月考',
      exam_type: '月考',
      semester: '2025-2026学年上学期',
      exam_date: '2026-03-26',
      subject: '数学',
      score: '95',
      full_score: '100',
      notes: '有进步',
    })
    const saveExamSubmission = vi.fn()

    mockUseExamAiAddPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [{ id: 'subject-1', subject_name: '数学' }],
      requestExamDraft,
      saveExamSubmission,
      draft: null,
      saving: false,
      generating: false,
    })

    render(
      <MemoryRouter>
        <ExamsAiAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('AI添加考试成绩')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('描述成绩信息，可上传试卷...'), {
      target: { value: '数学95分，第一次月考' },
    })
    fireEvent.click(screen.getByRole('button', { name: '生成草案' }))

    await waitFor(() => expect(requestExamDraft).toHaveBeenCalled())

    expect(screen.getAllByText('已生成草案').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '保存草案成绩' }))

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
      false,
    )
  })

  it('shows a profile loading state before the assistant form renders', () => {
    mockUseExamAiAddPageData.mockReturnValue({
      loading: false,
      profileLoading: true,
      profileError: null,
      error: null,
      currentProfile: null,
      subjects: [],
      requestExamDraft: vi.fn(),
      saveExamSubmission: vi.fn(),
      draft: null,
      saving: false,
      generating: false,
    })

    render(
      <MemoryRouter>
        <ExamsAiAddPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载考试数据...')).toBeInTheDocument()
  })
})
