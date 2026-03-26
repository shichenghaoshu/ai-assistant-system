import { createBrowserRouter, Navigate } from 'react-router-dom'

import AuthGate from './auth/AuthGate.jsx'
import LoginPage from './auth/LoginPage.jsx'
import AppShell from './layout/AppShell.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MembershipPage from './pages/MembershipPage.jsx'
import RedeemPage from './pages/RedeemPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import PlansManagePage from './pages/PlansManagePage.jsx'
import PlanAddPage from './pages/PlanAddPage.jsx'
import PlanAiAddPage from './pages/PlanAiAddPage.jsx'
import PlanBatchAddPage from './pages/PlanBatchAddPage.jsx'
import PlanEditPage from './pages/PlanEditPage.jsx'
import HabitsManagePage from './pages/HabitsManagePage.jsx'
import HabitsCheckinPage from './pages/HabitsCheckinPage.jsx'
import ExamsAddPage from './pages/ExamsAddPage.jsx'
import ExamsAiAddPage from './pages/ExamsAiAddPage.jsx'
import ExamsEditPage from './pages/ExamsEditPage.jsx'
import ExamsSubjectsPage from './pages/ExamsSubjectsPage.jsx'
import WeaknessPage from './pages/WeaknessPage.jsx'
import WeaknessAddPage from './pages/WeaknessAddPage.jsx'
import RewardsRulesPage from './pages/RewardsRulesPage.jsx'
import AchievementsManagePage from './pages/AchievementsManagePage.jsx'
import AccountPasswordPage from './pages/AccountPasswordPage.jsx'
import ExportPage from './pages/ExportPage.jsx'
import ImportPage from './pages/ImportPage.jsx'
import InstallGuidePage from './pages/InstallGuidePage.jsx'
import RoutePage from './pages/RoutePage.jsx'
import { flatRoutes } from './routes/appRoutes.jsx'

const routeOverrides = {
  '/dashboard': <DashboardPage />,
  '/plans/manage': <PlansManagePage />,
  '/plans/add': <PlanAddPage />,
  '/plans/ai-add': <PlanAiAddPage />,
  '/plans/batch-add': <PlanBatchAddPage />,
  '/plans/edit': <PlanEditPage />,
  '/habits/manage': <HabitsManagePage />,
  '/habits/checkin': <HabitsCheckinPage />,
  '/rewards/rules': <RewardsRulesPage />,
  '/rewards/achievements/manage': <AchievementsManagePage />,
  '/exams/add': <ExamsAddPage />,
  '/exams/ai-add': <ExamsAiAddPage />,
  '/exams/edit': <ExamsEditPage />,
  '/exams/subjects': <ExamsSubjectsPage />,
  '/weakness': <WeaknessPage />,
  '/weakness/add': <WeaknessAddPage />,
  '/membership': <MembershipPage />,
  '/redeem': <RedeemPage />,
  '/settings': <SettingsPage />,
  '/settings/account-password': <AccountPasswordPage />,
  '/users': <UsersPage />,
  '/export': <ExportPage />,
  '/import': <ImportPage />,
  '/install-guide': <InstallGuidePage />,
}

function createRouteChildren() {
  return [
    ...flatRoutes.map((route) => ({
      path: route.path.slice(1),
      element: routeOverrides[route.path] ?? <RoutePage path={route.path} />,
    })),
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ]
}

export function createAppRouter() {
  return createBrowserRouter(createAppRoutes())
}

export function createAppRoutes() {
  return [
    {
      path: '/auth',
      element: <LoginPage />,
    },
    {
      path: '/auth/reset-password',
      element: <LoginPage />,
    },
    {
      element: <AuthGate />,
      children: [
        {
          path: '/',
          element: <AppShell />,
          children: [
            {
              index: true,
              element: <Navigate to="/dashboard" replace />,
            },
            ...createRouteChildren(),
          ],
        },
      ],
    },
  ]
}

export const router = createAppRouter()
