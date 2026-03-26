import { supabase } from '../../auth/session.js'

function canUseWindow() {
  return typeof window !== 'undefined'
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function createLocalId(prefix) {
  const randomSuffix = canUseWindow() && window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${randomSuffix}`
}

function omitKeys(row, keys) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key)))
}

function toExportRows(data) {
  return Array.isArray(data) ? data : []
}

const IMPORT_TABLES = [
  { tableName: 'profiles', conflictKey: 'id', idField: 'id', prefix: 'profile' },
  { tableName: 'learning_plans', conflictKey: 'id', idField: 'id', prefix: 'plan', profileField: 'profile_id' },
  { tableName: 'plan_tasks', conflictKey: 'id', idField: 'id', prefix: 'task', profileField: 'profile_id', parentField: 'plan_id' },
  { tableName: 'behavior_habits', conflictKey: 'id', idField: 'id', prefix: 'habit', profileField: 'profile_id' },
  { tableName: 'user_preferences', conflictKey: 'profile_id', idField: null, prefix: 'preferences', profileField: 'profile_id' },
  { tableName: 'exam_records', conflictKey: 'id', idField: 'id', prefix: 'exam', profileField: 'profile_id' },
  { tableName: 'achievements', conflictKey: 'id', idField: 'id', prefix: 'achievement' },
  {
    tableName: 'user_achievements',
    conflictKey: 'id',
    idField: 'id',
    prefix: 'user-achievement',
    profileField: 'profile_id',
    parentField: 'achievement_id',
  },
  { tableName: 'redemption_records', conflictKey: 'id', idField: 'id', prefix: 'redemption', userField: 'user_id' },
]

function normalizeImportSnapshotShape(payload) {
  if (!isPlainObject(payload)) {
    throw new Error('导入文件格式无效')
  }

  const knownKeys = IMPORT_TABLES.map((item) => item.tableName)
  const snapshot = {}
  let sawKnownKey = false

  for (const key of knownKeys) {
    if (!(key in payload)) {
      snapshot[key] = []
      continue
    }

    sawKnownKey = true

    if (!Array.isArray(payload[key])) {
      throw new Error(`导入文件字段 ${key} 格式无效`)
    }

    snapshot[key] = payload[key]
  }

  if (!sawKnownKey) {
    throw new Error('导入文件结构无效')
  }

  return snapshot
}

function buildImportRecordMaps(snapshot) {
  const profileIdMap = new Map()
  const achievementIdMap = new Map()
  const planIdMap = new Map()

  for (const row of snapshot.profiles ?? []) {
    const oldId = row?.id
    if (!oldId) {
      continue
    }
    profileIdMap.set(String(oldId), createLocalId('profile'))
  }

  for (const row of snapshot.achievements ?? []) {
    const oldId = row?.id
    if (!oldId) {
      continue
    }
    achievementIdMap.set(String(oldId), createLocalId('achievement'))
  }

  for (const row of snapshot.learning_plans ?? []) {
    const oldId = row?.id
    if (!oldId) {
      continue
    }
    planIdMap.set(String(oldId), createLocalId('plan'))
  }

  return {
    profileIdMap,
    achievementIdMap,
    planIdMap,
  }
}

function remapProfileId(profileIdMap, value, fallbackProfileId) {
  if (value && profileIdMap.has(String(value))) {
    return profileIdMap.get(String(value))
  }

  return fallbackProfileId ?? null
}

function prepareImportedRows(tableName, rows, { accountId, profileId, profileIdMap, achievementIdMap, planIdMap }) {
  return rows.map((row) => {
    if (!isPlainObject(row)) {
      return row
    }

    switch (tableName) {
      case 'profiles': {
        const oldId = row.id
        const nextRow = omitKeys(row, ['id', 'account_id'])
        const nextId = oldId && profileIdMap.get(String(oldId)) ? profileIdMap.get(String(oldId)) : createLocalId('profile')

        if (oldId && !profileIdMap.has(String(oldId))) {
          profileIdMap.set(String(oldId), nextId)
        }

        return {
          ...nextRow,
          id: nextId,
          account_id: accountId,
        }
      }
      case 'learning_plans': {
        const oldId = row.id
        const nextId = oldId && planIdMap.get(String(oldId)) ? planIdMap.get(String(oldId)) : createLocalId('plan')

        if (oldId && !planIdMap.has(String(oldId))) {
          planIdMap.set(String(oldId), nextId)
        }

        return {
          ...omitKeys(row, ['id', 'profile_id']),
          id: nextId,
          profile_id: remapProfileId(profileIdMap, row.profile_id, profileId),
        }
      }
      case 'plan_tasks': {
        const oldPlanId = row.plan_id
        let nextPlanId = null

        if (oldPlanId) {
          nextPlanId = planIdMap.get(String(oldPlanId))

          if (!nextPlanId) {
            nextPlanId = createLocalId('plan')
            planIdMap.set(String(oldPlanId), nextPlanId)
          }
        }

        return {
          ...omitKeys(row, ['id', 'profile_id', 'plan_id']),
          id: createLocalId('task'),
          profile_id: remapProfileId(profileIdMap, row.profile_id, profileId),
          plan_id: nextPlanId,
        }
      }
      case 'behavior_habits':
      case 'exam_records': {
        return {
          ...omitKeys(row, ['id', 'profile_id']),
          id: createLocalId(tableName === 'behavior_habits' ? 'habit' : 'exam'),
          profile_id: remapProfileId(profileIdMap, row.profile_id, profileId),
        }
      }
      case 'user_preferences': {
        return {
          ...omitKeys(row, ['profile_id']),
          profile_id: remapProfileId(profileIdMap, row.profile_id, profileId),
        }
      }
      case 'achievements': {
        const oldId = row.id
        const nextId = oldId && achievementIdMap.get(String(oldId)) ? achievementIdMap.get(String(oldId)) : createLocalId('achievement')

        if (oldId && !achievementIdMap.has(String(oldId))) {
          achievementIdMap.set(String(oldId), nextId)
        }

        return {
          ...omitKeys(row, ['id']),
          id: nextId,
        }
      }
      case 'user_achievements': {
        const oldAchievementId = row.achievement_id
        let nextAchievementId = null

        if (oldAchievementId) {
          nextAchievementId = achievementIdMap.get(String(oldAchievementId))

          if (!nextAchievementId) {
            nextAchievementId = createLocalId('achievement')
            achievementIdMap.set(String(oldAchievementId), nextAchievementId)
          }
        }

        return {
          ...omitKeys(row, ['id', 'profile_id', 'achievement_id']),
          id: createLocalId('user-achievement'),
          profile_id: remapProfileId(profileIdMap, row.profile_id, profileId),
          achievement_id: nextAchievementId,
        }
      }
      case 'redemption_records': {
        return {
          ...omitKeys(row, ['id', 'user_id']),
          id: createLocalId('redemption'),
          user_id: accountId,
        }
      }
      default:
        return { ...row }
    }
  })
}

async function queryTable(tableName, builder) {
  const { data, error } = await builder

  if (error) {
    throw error
  }

  return toExportRows(data)
}

export async function fetchExportSnapshot(accountId, profileId) {
  const [profiles, learningPlans, planTasks, behaviorHabits, userPreferences, examRecords, achievements, userAchievements, redemptionRecords] =
    await Promise.all([
      accountId
        ? queryTable('profiles', supabase.from('profiles').select('*').eq('account_id', accountId))
        : Promise.resolve([]),
      profileId ? queryTable('learning_plans', supabase.from('learning_plans').select('*').eq('profile_id', profileId)) : Promise.resolve([]),
      profileId ? queryTable('plan_tasks', supabase.from('plan_tasks').select('*').eq('profile_id', profileId)) : Promise.resolve([]),
      profileId ? queryTable('behavior_habits', supabase.from('behavior_habits').select('*').eq('profile_id', profileId)) : Promise.resolve([]),
      profileId ? queryTable('user_preferences', supabase.from('user_preferences').select('*').eq('profile_id', profileId)) : Promise.resolve([]),
      profileId ? queryTable('exam_records', supabase.from('exam_records').select('*').eq('profile_id', profileId)) : Promise.resolve([]),
      queryTable('achievements', supabase.from('achievements').select('*').order('sort_order', { ascending: true })),
      profileId
        ? queryTable('user_achievements', supabase.from('user_achievements').select('*').eq('profile_id', profileId))
        : Promise.resolve([]),
      accountId
        ? queryTable('redemption_records', supabase.from('redemption_records').select('*').eq('user_id', accountId))
        : Promise.resolve([]),
    ])

  const snapshot = {
    profiles,
    learning_plans: learningPlans,
    plan_tasks: planTasks,
    behavior_habits: behaviorHabits,
    user_preferences: userPreferences,
    exam_records: examRecords,
    achievements,
    user_achievements: userAchievements,
    redemption_records: redemptionRecords,
  }

  return {
    snapshot,
    counts: Object.fromEntries(
      Object.entries(snapshot).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
    ),
  }
}

export const buildExportSnapshot = fetchExportSnapshot

export function downloadJsonSnapshot(snapshot, filename = 'xxjh-export.json') {
  if (!canUseWindow()) {
    return false
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()

  URL.revokeObjectURL(url)
  return true
}

export async function updateAccountPassword(newPassword) {
  const password = String(newPassword ?? '').trim()

  if (password.length < 8) {
    throw new Error('密码至少需要 8 位')
  }

  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw error
  }

  return data
}

export function parseImportSnapshot(text) {
  const payload = typeof text === 'string' ? JSON.parse(text) : text

  const snapshot = normalizeImportSnapshotShape(payload)

  return Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, toExportRows(value)]))
}

export async function importSnapshot(snapshot, { accountId, profileId } = {}) {
  if (!accountId || !profileId) {
    throw new Error('缺少当前账号或档案')
  }

  if (!isPlainObject(snapshot)) {
    throw new Error('导入数据无效')
  }

  const normalizedSnapshot = normalizeImportSnapshotShape(snapshot)
  const recordMaps = buildImportRecordMaps(normalizedSnapshot)

  const results = []

  for (const tableConfig of IMPORT_TABLES) {
    const rows = normalizedSnapshot[tableConfig.tableName] ?? []
    const normalizedRows = prepareImportedRows(tableConfig.tableName, rows, {
      accountId,
      profileId,
      ...recordMaps,
    })

    if (normalizedRows.length === 0) {
      results.push({ tableName: tableConfig.tableName, count: 0 })
      continue
    }

    const { data, error } = await supabase.from(tableConfig.tableName).upsert(normalizedRows, {
      onConflict: tableConfig.conflictKey,
    })

    if (error) {
      throw error
    }

    results.push({
      tableName: tableConfig.tableName,
      count: Array.isArray(data) ? data.length : normalizedRows.length,
    })
  }

  return results
}
