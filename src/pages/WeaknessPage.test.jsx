import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WeaknessPage from './WeaknessPage.jsx'

const { mockUseWeaknessPageData } = vi.hoisted(() => ({
  mockUseWeaknessPageData: vi.fn(),
}))

vi.mock('../features/weakness/useWeaknessPageData.js', () => ({
  useWeaknessPageData: mockUseWeaknessPageData,
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

describe('WeaknessPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseWeaknessPageData.mockReset()
  })

  it('shows a loading state while weakness analysis is being fetched', () => {
    mockUseWeaknessPageData.mockReturnValue({
      loading: true,
      error: null,
      currentProfile: null,
      summary: {
        subjectCount: 0,
        knowledgePointCount: 0,
        practiceSubmissionCount: 0,
        weaknessReportCount: 0,
      },
      weaknessReports: [],
      recentSubmissions: [],
      subjectSummaries: [],
    })

    render(
      <MemoryRouter>
        <WeaknessPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载薄弱知识数据...')).toBeInTheDocument()
  })

  it('shows the weakness analysis surface with summary cards and empty state messaging', () => {
    mockUseWeaknessPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      summary: {
        subjectCount: 1,
        knowledgePointCount: 2,
        practiceSubmissionCount: 3,
        weaknessReportCount: 1,
      },
      weaknessReports: [
        {
          id: 'report-1',
          title: '函数',
          subjectName: '数学',
          weaknessScore: 0.86,
          errorCount: 8,
          practiceCount: 3,
        },
      ],
      recentSubmissions: [],
      subjectSummaries: [
        {
          subjectName: '数学',
          weaknessCount: 1,
          submissionCount: 3,
        },
      ],
    })

    render(
      <MemoryRouter>
        <WeaknessPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('薄弱知识分析')).toBeInTheDocument()
    expect(screen.getByText('函数')).toBeInTheDocument()
    expect(screen.getByText('练习记录')).toBeInTheDocument()
    expect(screen.getAllByText('去提交练习记录')).toHaveLength(2)
    expect(screen.getByText('1 个薄弱点')).toBeInTheDocument()
    expect(screen.getByText('3 次练习')).toBeInTheDocument()
  })

  it('renders an error state when weakness data fails to load', () => {
    mockUseWeaknessPageData.mockReturnValue({
      loading: false,
      error: new Error('boom'),
      currentProfile: null,
      summary: {
        subjectCount: 0,
        knowledgePointCount: 0,
        practiceSubmissionCount: 0,
        weaknessReportCount: 0,
      },
      weaknessReports: [],
      recentSubmissions: [],
      subjectSummaries: [],
    })

    render(
      <MemoryRouter>
        <WeaknessPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载薄弱知识数据，请稍后重试。')).toBeInTheDocument()
  })
})
