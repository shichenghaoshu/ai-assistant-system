import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UsersPage from './UsersPage.jsx'

const { mockUseUsersPageData } = vi.hoisted(() => ({
  mockUseUsersPageData: vi.fn(),
}))

vi.mock('../features/users/useUsersPageData.js', () => ({
  useUsersPageData: mockUseUsersPageData,
}))

vi.mock('../auth/session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: {
      user: {
        id: 'user-1',
        email: '488322412@qq.com',
      },
    },
  }),
}))

function createPageState(overrides = {}) {
  return {
    loading: false,
    error: null,
    accountEmail: '488322412@qq.com',
    profiles: [],
    refresh: vi.fn(),
    updateProfile: vi.fn(),
    clearProfileData: vi.fn(),
    deleteProfile: vi.fn(),
    ...overrides,
  }
}

function createProfile() {
  return {
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
  }
}

describe('UsersPage', () => {
  beforeEach(() => {
    cleanup()
    mockUseUsersPageData.mockReset()
  })

  it('shows a loading state while the page data is being fetched', () => {
    mockUseUsersPageData.mockReturnValue(
      createPageState({
        loading: true,
        profiles: [],
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('正在加载档案数据...')).toBeInTheDocument()
  })

  it('shows an error state when the page data fails to load', () => {
    mockUseUsersPageData.mockReturnValue(
      createPageState({
        error: new Error('boom'),
        profiles: [],
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('暂时无法加载档案数据，请稍后重试。')).toBeInTheDocument()
  })

  it('renders the users directory with counts and per-profile limits', () => {
    mockUseUsersPageData.mockReturnValue(
      createPageState({
        profiles: [createProfile()],
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('账号档案列表')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('shi')).toBeInTheDocument()
    expect(screen.getByText('1 个档案 | 1 个账户')).toBeInTheDocument()
    expect(screen.getByText('最多可拥有 3 个班级')).toBeInTheDocument()
    expect(screen.getByText('单班最多 10 人')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑档案' })).toBeEnabled()
    expect(screen.getByPlaceholderText('搜索档案名称或邮箱...')).toBeInTheDocument()
  })

  it('opens the editor and saves profile changes', () => {
    const updateProfile = vi.fn()

    mockUseUsersPageData.mockReturnValue(
      createPageState({
        profiles: [createProfile()],
        updateProfile,
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '编辑档案' }))

    expect(screen.getByRole('dialog', { name: '编辑档案' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('档案名称'), {
      target: { value: 'new-name' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    expect(updateProfile).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({
        profile_name: 'new-name',
      }),
    )
  })

  it('confirms clearing data before calling the clear-data action', () => {
    const clearProfileData = vi.fn()

    mockUseUsersPageData.mockReturnValue(
      createPageState({
        profiles: [createProfile()],
        clearProfileData,
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '清空数据' }))

    expect(screen.getByRole('dialog', { name: '清空档案数据' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '确认清空' }))

    expect(clearProfileData).toHaveBeenCalledWith('profile-1')
  })

  it('confirms deleting the profile before calling the delete action', () => {
    const deleteProfile = vi.fn()

    mockUseUsersPageData.mockReturnValue(
      createPageState({
        profiles: [createProfile()],
        deleteProfile,
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '删除档案' }))

    expect(screen.getByRole('dialog', { name: '删除档案' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '确认删除' }))

    expect(deleteProfile).toHaveBeenCalledWith('profile-1')
  })

  it('shows a filtered empty state when the search removes all profiles', () => {
    mockUseUsersPageData.mockReturnValue(
      createPageState({
        profiles: [createProfile()],
      }),
    )

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('搜索档案名称或邮箱...'), {
      target: { value: 'not-found' },
    })

    expect(screen.getAllByText('没有找到匹配的档案')).toHaveLength(2)
    expect(screen.queryByText('暂无档案')).not.toBeInTheDocument()
    expect(screen.queryByText('shi')).not.toBeInTheDocument()
  })
})
