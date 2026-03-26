import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ImportPage from './ImportPage.jsx'

const { mockUseImportPageData } = vi.hoisted(() => ({
  mockUseImportPageData: vi.fn(),
}))

vi.mock('../features/system-tools/useImportPageData.js', () => ({
  useImportPageData: mockUseImportPageData,
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

describe('ImportPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseImportPageData.mockReset()
  })

  it('parses an import file and submits it', () => {
    const parseImportFile = vi.fn()
    const importSnapshot = vi.fn()

    mockUseImportPageData.mockReturnValue({
      loading: false,
      error: null,
      parsing: false,
      importing: false,
      banner: null,
      parsedSnapshot: {
        learning_plans: [{ id: 'plan-1' }],
      },
      currentProfile: {
        id: 'profile-1',
        profile_name: 'shi',
      },
      parseImportFile,
      importSnapshot,
    })

    render(
      <MemoryRouter>
        <ImportPage />
      </MemoryRouter>,
    )

    const file = new File(['{"learning_plans":[{"id":"plan-1"}]}'], 'snapshot.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('导入文件'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: '开始导入' }))

    expect(parseImportFile).toHaveBeenCalled()
    expect(importSnapshot).toHaveBeenCalled()
  })

  it('shows an empty state when there is no current profile', () => {
    mockUseImportPageData.mockReturnValue({
      loading: false,
      error: null,
      parsing: false,
      importing: false,
      banner: null,
      parsedSnapshot: null,
      currentProfile: null,
      parseImportFile: vi.fn(),
      importSnapshot: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ImportPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂无可用档案')).toBeInTheDocument()
  })
})
