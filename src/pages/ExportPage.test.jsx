import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ExportPage from './ExportPage.jsx'

const { mockUseExportPageData } = vi.hoisted(() => ({
  mockUseExportPageData: vi.fn(),
}))

vi.mock('../features/system-tools/useExportPageData.js', () => ({
  useExportPageData: mockUseExportPageData,
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

describe('ExportPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseExportPageData.mockReset()
  })

  it('renders the export snapshot preview and triggers a download', () => {
    const downloadExport = vi.fn()

    mockUseExportPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      accountEmail: 'saved@example.com',
      snapshot: {
        learning_plans: [{ id: 'plan-1' }],
      },
      counts: {
        learningPlans: 1,
      },
      downloadExport,
    })

    render(
      <MemoryRouter>
        <ExportPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('数据导出')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下载 JSON' }))
    expect(downloadExport).toHaveBeenCalled()
  })

  it('shows an empty state when there is no current profile', () => {
    mockUseExportPageData.mockReturnValue({
      loading: false,
      error: null,
      currentProfile: null,
      accountEmail: 'saved@example.com',
      snapshot: null,
      counts: {},
      downloadExport: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ExportPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂无可用档案')).toBeInTheDocument()
  })
})
