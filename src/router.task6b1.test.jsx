import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

const { mockUseAuthSession } = vi.hoisted(() => ({
  mockUseAuthSession: vi.fn(),
}))

vi.mock('./auth/session.js', async () => {
  const actual = await vi.importActual('./auth/session.js')

  return {
    ...actual,
    useAuthSession: mockUseAuthSession,
  }
})

vi.mock('./features/users/useUsersPageData.js', () => ({
  useUsersPageData: vi.fn(() => ({
    loading: false,
    error: null,
    accountEmail: '488322412@qq.com',
    profiles: [
      {
        id: 'profile-1',
        account_id: 'user-1',
        profile_name: 'shi',
        avatar_color: '#3B82F6',
        avatar_path: null,
        is_default: true,
        display_order: 0,
        created_at: '2026-03-25T13:59:02.500284+08:00',
        max_owned_classes: 3,
        max_class_members: 10,
        counts: {
          learningPlans: 0,
          planTasks: 0,
          behaviorHabits: 0,
          userPreferences: 0,
          examRecords: 0,
        },
      },
    ],
  })),
}), { virtual: true })

import { createAppRoutes } from './router.jsx'

describe('Task 6B1 route replacements', () => {
  let router

  beforeEach(() => {
    mockUseAuthSession.mockReturnValue({
      loading: false,
      session: {
        user: {
          id: 'user-1',
          email: '488322412@qq.com',
        },
      },
    })
    router = null
  })

  afterEach(() => {
    cleanup()
    router?.dispose?.()
  })

  async function renderRoute(pathname) {
    router = createMemoryRouter(createAppRoutes(), {
      initialEntries: [pathname],
    })
    render(<RouterProvider router={router} />)
  }

  it('renders the users page with profile records instead of the generic route placeholder', async () => {
    await renderRoute('/users')

    expect(await screen.findByText('账号档案列表')).toBeInTheDocument()
    expect(screen.getByText('档案管理')).toBeInTheDocument()
    expect(screen.queryByText('该路径还没有加入本地路由表。')).not.toBeInTheDocument()
  })
})
