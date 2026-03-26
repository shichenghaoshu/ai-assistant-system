import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockUpdateUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdateUser: vi.fn(),
}))

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      updateUser: mockUpdateUser,
    },
  },
}))

const { buildExportSnapshot, importSnapshot, parseImportSnapshot, updateAccountPassword } = await import('./systemToolsApi.js')

describe('systemToolsApi', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockUpdateUser.mockReset()
  })

  it('builds an export snapshot from the current account profile', () => {
    expect(buildExportSnapshot).toBeTypeOf('function')
  })

  it('exposes a password change helper', () => {
    expect(updateAccountPassword).toBeTypeOf('function')
  })

  it('exposes an import helper', () => {
    expect(importSnapshot).toBeTypeOf('function')
  })

  it('rejects malformed import snapshots', () => {
    expect(() => parseImportSnapshot(JSON.stringify({ learning_plans: {} }))).toThrow(
      '导入文件字段 learning_plans 格式无效',
    )
  })

  it('rewrites imported record identities to the current account and profile', async () => {
    const rowsByTable = {}

    mockFrom.mockImplementation((tableName) => ({
      upsert: vi.fn((rows) => {
        rowsByTable[tableName] = rows
        return {
          data: rows,
          error: null,
        }
      }),
    }))

    const result = await importSnapshot(
      {
        profiles: [
          {
            id: 'profile-old',
            profile_name: 'shi',
            is_default: true,
          },
        ],
        learning_plans: [
          {
            id: 'plan-old',
            profile_id: 'profile-old',
            plan_name: '数学复习',
          },
        ],
        plan_tasks: [
          {
            id: 'task-old',
            profile_id: 'profile-old',
            plan_id: 'plan-old',
            task_date: '2026-03-26',
          },
        ],
        achievements: [
          {
            id: 'achievement-old',
            name: '晨间打卡',
          },
        ],
        user_achievements: [
          {
            id: 'user-achievement-old',
            profile_id: 'profile-old',
            achievement_id: 'achievement-old',
          },
        ],
        redemption_records: [
          {
            id: 'redeem-old',
            user_id: 'account-old',
            code: 'ABC123',
          },
        ],
        user_preferences: [
          {
            profile_id: 'profile-old',
            completion_sound_enabled: true,
          },
        ],
      },
      {
        accountId: 'account-1',
        profileId: 'profile-1',
      },
    )

    expect(result.map((item) => item.count)).toEqual([1, 1, 1, 0, 1, 0, 1, 1, 1])
    expect(rowsByTable.profiles[0]).toMatchObject({
      profile_name: 'shi',
      account_id: 'account-1',
    })
    expect(rowsByTable.profiles[0].id).not.toBe('profile-old')
    expect(rowsByTable.learning_plans[0].profile_id).toBe(rowsByTable.profiles[0].id)
    expect(rowsByTable.plan_tasks[0].plan_id).toBe(rowsByTable.learning_plans[0].id)
    expect(rowsByTable.plan_tasks[0].profile_id).toBe(rowsByTable.profiles[0].id)
    expect(rowsByTable.achievements[0].id).not.toBe('achievement-old')
    expect(rowsByTable.user_achievements[0].profile_id).toBe(rowsByTable.profiles[0].id)
    expect(rowsByTable.user_achievements[0].achievement_id).toBe(rowsByTable.achievements[0].id)
    expect(rowsByTable.redemption_records[0].id).not.toBe('redeem-old')
    expect(rowsByTable.redemption_records[0].user_id).toBe('account-1')
    expect(rowsByTable.user_preferences[0].profile_id).toBe(rowsByTable.profiles[0].id)
  })
})
