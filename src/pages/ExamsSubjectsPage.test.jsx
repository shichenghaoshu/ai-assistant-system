import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExamsSubjectsPage from './ExamsSubjectsPage.jsx'

const { mockUseExamSubjectsPageData } = vi.hoisted(() => ({
  mockUseExamSubjectsPageData: vi.fn(),
}))

vi.mock('../features/exams/useExamsPageData.js', () => ({
  useExamSubjectsPageData: mockUseExamSubjectsPageData,
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

describe('ExamsSubjectsPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseExamSubjectsPageData.mockReset()
  })

  it('renders the subject list and creates a new subject', () => {
    const saveExamSubject = vi.fn()

    mockUseExamSubjectsPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [
        {
          id: 'subject-1',
          subject_name: '数学',
          subject_color: 'from-blue-400 to-cyan-500',
          icon_name: 'BookOpen',
          display_order: 0,
          is_active: true,
        },
      ],
      saveExamSubject,
      toggleExamSubject: vi.fn(),
      deleteExamSubject: vi.fn(),
      saving: false,
    })

    render(
      <MemoryRouter>
        <ExamsSubjectsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('科目管理')).toBeInTheDocument()
    expect(screen.getByText('数学')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '添加科目' }))
    fireEvent.change(screen.getByLabelText('科目名称'), { target: { value: '科学' } })
    fireEvent.click(screen.getByRole('button', { name: '添加' }))

    expect(saveExamSubject).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({
        subject_name: '科学',
      }),
    )
  })

  it('shows an empty state when there are no exam subjects', () => {
    mockUseExamSubjectsPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      subjects: [],
      saveExamSubject: vi.fn(),
      toggleExamSubject: vi.fn(),
      deleteExamSubject: vi.fn(),
      saving: false,
    })

    render(
      <MemoryRouter>
        <ExamsSubjectsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('还没有设置任何科目')).toBeInTheDocument()
  })
})
