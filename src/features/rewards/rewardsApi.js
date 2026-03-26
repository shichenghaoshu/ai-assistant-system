import { supabase } from '../../auth/session.js'
import { loadOrCreateSettings, updateSettingsValue } from '../settings/settingsApi.js'

const REWARD_RULE_FIELDS = [
  'base_stars_enabled',
  'base_stars_value',
  'time_bonus_30min_enabled',
  'time_bonus_30min_value',
  'time_bonus_60min_enabled',
  'time_bonus_60min_value',
  'early_bird_bonus_enabled',
  'early_bird_multiplier',
  'early_bird_start_hour',
  'early_bird_end_hour',
  'weekend_bonus_enabled',
  'weekend_multiplier',
  'completion_bonus_enabled',
  'completion_multiplier',
  'daily_completion_bonus_value',
]

function toFiniteNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : null
}

function normalizeBoolean(value) {
  return Boolean(value)
}

function normalizeRuleValue(field, value) {
  if (field.endsWith('_enabled')) {
    return normalizeBoolean(value)
  }

  return toFiniteNumber(value)
}

export async function fetchRewardsRules(profileId) {
  return loadOrCreateSettings(profileId)
}

export async function saveRewardsRules(profileId, nextValues) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const updates = Object.entries(nextValues ?? {}).filter(([field]) => REWARD_RULE_FIELDS.includes(field))

  if (updates.length === 0) {
    return loadOrCreateSettings(profileId)
  }

  let latest = null

  for (const [field, value] of updates) {
    // Keep updates narrow so the page mirrors the settings data contract.
    latest = await updateSettingsValue(profileId, field, normalizeRuleValue(field, value))
  }

  return latest
}

function getAchievementDisplayName(achievement) {
  return achievement?.display_name || achievement?.name || '未命名成就'
}

function getAchievementRewardStars(achievement) {
  const value = achievement?.reward_stars ?? achievement?.stars ?? achievement?.star_count ?? 0
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export async function fetchAchievementsManageData(profileId) {
  const achievementsQuery = supabase.from('achievements').select('*').order('sort_order', { ascending: true })
  const userAchievementsQuery = profileId
    ? supabase.from('user_achievements').select('id,achievement_id,profile_id,earned_at,created_at').eq('profile_id', profileId)
    : Promise.resolve({ data: [], error: null })

  const [{ data: achievements, error: achievementsError }, { data: userAchievements, error: userAchievementsError }] =
    await Promise.all([achievementsQuery, userAchievementsQuery])

  if (achievementsError) {
    throw achievementsError
  }

  if (userAchievementsError) {
    throw userAchievementsError
  }

  const earnedCountMap = new Map()

  for (const row of userAchievements ?? []) {
    const key = row?.achievement_id ?? row?.achievementId
    if (!key) {
      continue
    }

    earnedCountMap.set(key, (earnedCountMap.get(key) ?? 0) + 1)
  }

  const normalizedAchievements = Array.isArray(achievements)
    ? achievements.map((achievement) => ({
        ...achievement,
        display_name: getAchievementDisplayName(achievement),
        reward_stars: getAchievementRewardStars(achievement),
        earned_count: earnedCountMap.get(achievement.id) ?? 0,
      }))
    : []

  return {
    achievements: normalizedAchievements,
    profileId,
  }
}

function sanitizeAchievementPayload(payload) {
  return {
    name: String(payload?.name ?? '').trim(),
    description: String(payload?.description ?? '').trim(),
    reward_stars: toFiniteNumber(payload?.reward_stars) ?? 0,
    sort_order: toFiniteNumber(payload?.sort_order) ?? 0,
    is_active: Boolean(payload?.is_active ?? true),
  }
}

export async function createAchievement(payload) {
  const insertPayload = sanitizeAchievementPayload(payload)
  const { data, error } = await supabase.from('achievements').insert(insertPayload).select('*').single()

  if (error) {
    throw error
  }

  return data
}

export async function saveAchievement(achievementId, payload) {
  if (!achievementId) {
    throw new Error('missing achievement id')
  }

  const patch = sanitizeAchievementPayload(payload)
  const { data, error } = await supabase.from('achievements').update(patch).eq('id', achievementId).select('*').single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteAchievement(achievementId) {
  if (!achievementId) {
    throw new Error('missing achievement id')
  }

  const { error } = await supabase.from('achievements').delete().eq('id', achievementId)

  if (error) {
    throw error
  }

  return true
}
