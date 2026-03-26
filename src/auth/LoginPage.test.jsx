import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LoginPage from './LoginPage.jsx'

const { mockNavigate, mockSignUp, mockRedeemMembershipCode } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSignUp: vi.fn(),
  mockRedeemMembershipCode: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('./session.js', () => ({
  getRememberedEmail: vi.fn(() => 'saved@example.com'),
  redeemMembershipCode: mockRedeemMembershipCode,
  resetPasswordForEmail: vi.fn(),
  signIn: vi.fn(),
  signUp: mockSignUp,
  verifyOtpAndResetPassword: vi.fn(),
  subscribeAuth: vi.fn(() => () => {}),
  useAuthSession: () => ({
    loading: false,
    session: null,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    mockNavigate.mockReset()
    mockSignUp.mockReset()
    mockRedeemMembershipCode.mockReset()
  })

  it('prefills the remembered email in the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('邮箱')).toHaveValue('saved@example.com')
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('opens recovery reset mode on /auth/reset-password', () => {
    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <Routes>
          <Route path="/auth/reset-password" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '重置密码' })).toBeInTheDocument()
    expect(screen.getByText('请输入收到的验证码和新密码')).toBeInTheDocument()
    expect(screen.getByText('验证码')).toBeInTheDocument()
  })

  it('shows redeem failure and does not redirect immediately after signup', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    mockRedeemMembershipCode.mockResolvedValue({
      success: false,
      error: new Error('已完成注册，但兑换失败，请稍后重试或检查兑换码是否正确'),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('tab', { name: '注册' }))
    fireEvent.change(screen.getByLabelText('用户名'), { target: { value: '测试用户' } })
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^密码$/), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('兑换码（可选）'), { target: { value: 'VIP123' } })
    fireEvent.click(screen.getByRole('checkbox', { name: '我已阅读并同意用户协议和隐私政策' }))
    fireEvent.click(screen.getByRole('button', { name: '注册' }))

    await screen.findByText('已完成注册，但兑换失败，请稍后重试或检查兑换码是否正确')
    expect(screen.getByRole('button', { name: '继续前往主页' })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
      expect(mockRedeemMembershipCode).toHaveBeenCalledWith('VIP123')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
