import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MembershipPage from './MembershipPage.jsx'

const { mockUseMembershipPageData } = vi.hoisted(() => ({
  mockUseMembershipPageData: vi.fn(),
}))

vi.mock('../features/membership/useMembershipPageData.js', () => ({
  useMembershipPageData: mockUseMembershipPageData,
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

describe('MembershipPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseMembershipPageData.mockReset()
  })

  it('shows a non-fatal fallback when membership rpc is unavailable', () => {
    mockUseMembershipPageData.mockReturnValue({
      loading: false,
      error: null,
      membership: null,
      membershipUnavailable: true,
      membershipTypes: [
        {
          id: 'trial',
          display_name: '体验会员',
          description: '7天体验',
          duration_days: 7,
          features: ['基础功能'],
        },
      ],
      redemptionRecords: [],
    })

    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法读取会员状态')).toBeInTheDocument()
    expect(screen.getByText('体验会员')).toBeInTheDocument()
    expect(screen.getByText('还没有兑换记录')).toBeInTheDocument()
  })

  it('shows an explicit empty state when there is no active membership', () => {
    mockUseMembershipPageData.mockReturnValue({
      loading: false,
      error: null,
      membership: null,
      membershipUnavailable: false,
      membershipTypes: [],
      redemptionRecords: [],
    })

    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('当前未激活会员')).toBeInTheDocument()
    expect(screen.queryByText('暂时无法读取会员状态')).not.toBeInTheDocument()
  })
})
