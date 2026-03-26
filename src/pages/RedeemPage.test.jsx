import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RedeemPage from './RedeemPage.jsx'

const { mockRedeemMembershipCode, mockUseRedeemPageData, mockRefresh } = vi.hoisted(() => ({
  mockRedeemMembershipCode: vi.fn(),
  mockUseRedeemPageData: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('../features/redeem/useRedeemPageData.js', () => ({
  useRedeemPageData: mockUseRedeemPageData,
}))

vi.mock('../auth/session.js', () => ({
  redeemMembershipCode: mockRedeemMembershipCode,
  formatAuthError: vi.fn((error) => error?.message ?? '操作失败，请重试'),
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

describe('RedeemPage', () => {
  beforeEach(() => {
    mockRedeemMembershipCode.mockReset()
    mockUseRedeemPageData.mockReset()
    mockRefresh.mockReset()
  })

  it('submits the code on click and refreshes side data after success', async () => {
    mockUseRedeemPageData.mockReturnValue({
      loading: false,
      error: null,
      membershipTypes: [],
      redemptionRecords: [],
      refresh: mockRefresh,
    })
    mockRedeemMembershipCode.mockResolvedValue({
      success: true,
      data: {
        message: '兑换成功',
      },
    })

    render(
      <MemoryRouter>
        <RedeemPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('会员兑换码'), { target: { value: 'VIP-123' } })
    fireEvent.click(screen.getByRole('button', { name: '立即兑换' }))

    await screen.findByText('兑换成功')

    await waitFor(() => {
      expect(mockRedeemMembershipCode).toHaveBeenCalledWith('VIP-123')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
