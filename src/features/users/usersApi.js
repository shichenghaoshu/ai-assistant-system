import { supabase } from '../../auth/session.js'

const profileSelect =
  'id,account_id,profile_name,avatar_color,avatar_path,is_default,display_order,created_at,max_owned_classes,max_class_members'

export const PROFILE_SCOPED_TABLES = [
  'learning_plans',
  'plan_tasks',
  'behavior_habits',
  'user_preferences',
  'exam_records',
]

function getAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return null
  }

  try {
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

async function countProfileRecords(table, profileId) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('profile_id', profileId)

  if (error) {
    throw error
  }

  return typeof count === 'number' ? count : 0
}

async function fetchProfileCounts(profileId) {
  const [learningPlans, planTasks, behaviorHabits, userPreferences, examRecords] = await Promise.all([
    countProfileRecords('learning_plans', profileId),
    countProfileRecords('plan_tasks', profileId),
    countProfileRecords('behavior_habits', profileId),
    countProfileRecords('user_preferences', profileId),
    countProfileRecords('exam_records', profileId),
  ])

  return {
    learningPlans,
    planTasks,
    behaviorHabits,
    userPreferences,
    examRecords,
  }
}

function pickDefinedFields(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))
}

export async function fetchUsersPageData(accountId, accountEmail = '') {
  if (!accountId) {
    return {
      accountEmail,
      profiles: [],
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('account_id', accountId)
    .order('display_order', { ascending: true })

  if (error) {
    throw error
  }

  const profiles = Array.isArray(data) ? data : []
  const enrichedProfiles = await Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      avatar_url: getAvatarUrl(profile.avatar_path),
      counts: await fetchProfileCounts(profile.id),
    })),
  )

  return {
    accountEmail,
    profiles: enrichedProfiles,
  }
}

export async function updateProfile(profileId, changes) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const payload = {
    ...pickDefinedFields(changes ?? {}),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select(profileSelect)
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    avatar_url: getAvatarUrl(data?.avatar_path),
  }
}

export async function clearProfileData(profileId) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  await Promise.all(
    PROFILE_SCOPED_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).delete().eq('profile_id', profileId)

      if (error) {
        throw error
      }
    }),
  )

  return true
}

export async function deleteProfile(profileId) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  await clearProfileData(profileId)

  const { error } = await supabase.from('profiles').delete().eq('id', profileId)

  if (error) {
    throw error
  }

  return true
}
