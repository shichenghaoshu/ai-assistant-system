import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExamsEditPage from './ExamsEditPage.jsx'

const { mockUseExamEditPageData } = vi.hoisted(() => ({
  mockUseExamEditPageData: vi.fn(),
}))

vi.mock('../features/exams/useExamsPageData.js', () => ({
  useExamEditPageData: mockUseExamEditPageData,
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

describe('ExamsEditPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseExamEditPageData.mockReset()
  })

  it('loads the selected record and submits updates', () => {
    const saveExamRecord = vi.fn()

    mockUseExamEditPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      record: {
        id: 'record-1',
        subject: '数学',
        exam_name: '第一次月考',
        exam_type: '月考',
        semester: '2025-2026学年上学期',
        exam_date: '2026-03-26',
        score: 90,
        full_score: 100,
        notes: 'needs work',
      },
      subjects: [{ id: 'subject-1', subject_name: '数学' }],
      saveExamRecord,
      saving: false,
    })

    render(
      <MemoryRouter initialEntries={['/exams/edit?id=record-1']}>
        <ExamsEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('编辑考试成绩')).toBeInTheDocument()
    expect(screen.getByLabelText('得分')).toHaveValue('90')

    fireEvent.change(screen.getByLabelText('得分'), { target: { value: '97' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    expect(saveExamRecord).toHaveBeenCalledWith(
      'profile-1',
      'record-1',
      expect.objectContaining({
        score: '97',
      }),
    )
  })

  it('shows a profile error state before the editor renders', () => {
    mockUseExamEditPageData.mockReturnValue({
      loading: false,
      profileLoading: false,
      profileError: new Error('boom'),
      error: null,
      currentProfile: null,
      record: null,
      subjects: [],
      saveExamRecord: vi.fn(),
      saving: false,
    })

    render(
      <MemoryRouter initialEntries={['/exams/edit?id=record-1']}>
        <ExamsEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载考试记录，请稍后重试。')).toBeInTheDocument()
  })
})
