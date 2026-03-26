import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountPasswordPage from './AccountPasswordPage.jsx'

const { mockUseAccountPasswordPageData } = vi.hoisted(() => ({
  mockUseAccountPasswordPageData: vi.fn(),
}))

vi.mock('../features/system-tools/useAccountPasswordPageData.js', () => ({
  useAccountPasswordPageData: mockUseAccountPasswordPageData,
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

describe('AccountPasswordPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseAccountPasswordPageData.mockReset()
  })

  it('renders the password change form and submits a new password', () => {
    const changePassword = vi.fn()

    mockUseAccountPasswordPageData.mockReturnValue({
      loading: false,
      error: null,
      updating: false,
      banner: null,
      userEmail: 'saved@example.com',
      changePassword,
    })

    render(
      <MemoryRouter>
        <AccountPasswordPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'NewPassword123!' } })
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'NewPassword123!' } })
    fireEvent.click(screen.getByRole('button', { name: '更新密码' }))

    expect(changePassword).toHaveBeenCalledWith('NewPassword123!')
  })
})
