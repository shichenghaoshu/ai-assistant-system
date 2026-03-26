import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InstallGuidePage from './InstallGuidePage.jsx'

const { mockUseInstallGuidePageData } = vi.hoisted(() => ({
  mockUseInstallGuidePageData: vi.fn(),
}))

vi.mock('../features/system-tools/useInstallGuidePageData.js', () => ({
  useInstallGuidePageData: mockUseInstallGuidePageData,
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

describe('InstallGuidePage', () => {
  beforeEach(() => {
    cleanup()
    mockUseInstallGuidePageData.mockReset()
  })

  it('renders install guidance and the install action state', () => {
    mockUseInstallGuidePageData.mockReturnValue({
      loading: false,
      error: null,
      canInstall: true,
      installLabel: '安装到桌面',
      install: vi.fn(),
    })

    render(
      <MemoryRouter>
        <InstallGuidePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('安装应用到桌面')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '安装到桌面' })).toBeInTheDocument()
  })
})
