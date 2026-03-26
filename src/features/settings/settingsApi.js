import { supabase } from '../../auth/session.js'

export const SETTINGS_DEFAULTS = {
  achievement_rewards_enabled: true,
  auto_streak_bonus_enabled: true,
  study_session_bonus_enabled: false,
  completion_sound_enabled: true,
}

const PREFERENCES_SELECT = '*'

function canUseWindow() {
  return typeof window !== 'undefined'
}

export function soundSettingStorageKey(profileId) {
  return `sound_setting_${profileId}`
}

export function clipboardPromptStorageKey(profileId) {
  return `settings_clipboard_prompt_dismissed_${profileId}`
}

export function setCompletionSoundMirror(profileId, enabled) {
  if (!canUseWindow() || !profileId) {
    return false
  }

  try {
    window.localStorage.setItem(soundSettingStorageKey(profileId), String(Boolean(enabled)))
    return true
  } catch {
    return false
  }
}

export function readClipboardPromptDismissed(profileId) {
  if (!canUseWindow() || !profileId) {
    return false
  }

  try {
    return window.localStorage.getItem(clipboardPromptStorageKey(profileId)) === '1'
  } catch {
    return false
  }
}

export function setClipboardPromptDismissed(profileId, dismissed) {
  if (!canUseWindow() || !profileId) {
    return false
  }

  try {
    if (dismissed) {
      window.localStorage.setItem(clipboardPromptStorageKey(profileId), '1')
      return true
    }

    window.localStorage.removeItem(clipboardPromptStorageKey(profileId))
    return true
  } catch {
    return false
  }
}

export async function loadOrCreateSettings(profileId) {
  if (!profileId) {
    return null
  }

  const query = supabase.from('user_preferences').select(PREFERENCES_SELECT).eq('profile_id', profileId)
  const { data, error } = await query.maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const { data: inserted, error: insertError } = await supabase
    .from('user_preferences')
    .insert({
      profile_id: profileId,
      ...SETTINGS_DEFAULTS,
    })
    .select(PREFERENCES_SELECT)
    .single()

  if (insertError) {
    throw insertError
  }

  return inserted
}

export async function updateSettingsValue(profileId, field, value) {
  return updateSettingsValues(profileId, {
    [field]: value,
  })
}

export async function updateSettingsValues(profileId, values) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', profileId)
    .select(PREFERENCES_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data
}
