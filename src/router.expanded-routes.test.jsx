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

vi.mock('./pages/PlansManagePage.jsx', () => ({
  default: () => <div>PlansManagePage Mock</div>,
}))
vi.mock('./pages/PlanAddPage.jsx', () => ({
  default: () => <div>PlanAddPage Mock</div>,
}))
vi.mock('./pages/PlanAiAddPage.jsx', () => ({
  default: () => <div>PlanAiAddPage Mock</div>,
}))
vi.mock('./pages/PlanBatchAddPage.jsx', () => ({
  default: () => <div>PlanBatchAddPage Mock</div>,
}))
vi.mock('./pages/PlanEditPage.jsx', () => ({
  default: () => <div>PlanEditPage Mock</div>,
}))
vi.mock('./pages/HabitsManagePage.jsx', () => ({
  default: () => <div>HabitsManagePage Mock</div>,
}))
vi.mock('./pages/HabitsCheckinPage.jsx', () => ({
  default: () => <div>HabitsCheckinPage Mock</div>,
}))
vi.mock('./pages/ExamsAddPage.jsx', () => ({
  default: () => <div>ExamsAddPage Mock</div>,
}))
vi.mock('./pages/ExamsAiAddPage.jsx', () => ({
  default: () => <div>ExamsAiAddPage Mock</div>,
}))
vi.mock('./pages/ExamsEditPage.jsx', () => ({
  default: () => <div>ExamsEditPage Mock</div>,
}))
vi.mock('./pages/ExamsSubjectsPage.jsx', () => ({
  default: () => <div>ExamsSubjectsPage Mock</div>,
}))
vi.mock('./pages/WeaknessPage.jsx', () => ({
  default: () => <div>WeaknessPage Mock</div>,
}))
vi.mock('./pages/WeaknessAddPage.jsx', () => ({
  default: () => <div>WeaknessAddPage Mock</div>,
}))
vi.mock('./pages/RewardsRulesPage.jsx', () => ({
  default: () => <div>RewardsRulesPage Mock</div>,
}))
vi.mock('./pages/AchievementsManagePage.jsx', () => ({
  default: () => <div>AchievementsManagePage Mock</div>,
}))
vi.mock('./pages/AccountPasswordPage.jsx', () => ({
  default: () => <div>AccountPasswordPage Mock</div>,
}))
vi.mock('./pages/ExportPage.jsx', () => ({
  default: () => <div>ExportPage Mock</div>,
}))
vi.mock('./pages/ImportPage.jsx', () => ({
  default: () => <div>ImportPage Mock</div>,
}))
vi.mock('./pages/InstallGuidePage.jsx', () => ({
  default: () => <div>InstallGuidePage Mock</div>,
}))

import { createAppRoutes } from './router.jsx'

const routeCases = [
  ['/plans/manage', 'PlansManagePage Mock'],
  ['/plans/add', 'PlanAddPage Mock'],
  ['/plans/ai-add', 'PlanAiAddPage Mock'],
  ['/plans/batch-add', 'PlanBatchAddPage Mock'],
  ['/plans/edit', 'PlanEditPage Mock'],
  ['/habits/manage', 'HabitsManagePage Mock'],
  ['/habits/checkin', 'HabitsCheckinPage Mock'],
  ['/exams/add', 'ExamsAddPage Mock'],
  ['/exams/ai-add', 'ExamsAiAddPage Mock'],
  ['/exams/edit', 'ExamsEditPage Mock'],
  ['/exams/subjects', 'ExamsSubjectsPage Mock'],
  ['/weakness', 'WeaknessPage Mock'],
  ['/weakness/add', 'WeaknessAddPage Mock'],
  ['/rewards/rules', 'RewardsRulesPage Mock'],
  ['/rewards/achievements/manage', 'AchievementsManagePage Mock'],
  ['/settings/account-password', 'AccountPasswordPage Mock'],
  ['/export', 'ExportPage Mock'],
  ['/import', 'ImportPage Mock'],
  ['/install-guide', 'InstallGuidePage Mock'],
]

describe('expanded route replacements', () => {
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

  it.each(routeCases)('renders %s with its concrete page component', async (pathname, marker) => {
    await renderRoute(pathname)

    expect(await screen.findByText(marker)).toBeInTheDocument()
    expect(screen.queryByText('该路径还没有加入本地路由表。')).not.toBeInTheDocument()
  })
})
