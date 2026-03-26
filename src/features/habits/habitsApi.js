import { supabase } from '../../auth/session.js'

export const HABIT_TYPE_OPTIONS = [
  { value: 'daily_once', label: '每日一次', description: '每天只能打卡一次' },
  { value: 'daily_multiple', label: '每日多次', description: '一天可以打卡多次' },
  { value: 'weekly', label: '每周多次', description: '一周内可以打卡多次' },
]

export const ICON_OPTIONS = [
  'star',
  'book',
  'book-open',
  'calendar',
  'pen-tool',
  'user-check',
  'target',
  'droplet',
  'package',
  'utensils',
  'clock',
  'moon',
  'home',
  'heart',
  'zap',
  'file-text',
  'edit',
  'calculator',
  'headphones',
  'check-circle',
  'award',
  'trophy',
  'smile',
  'user-plus',
  'volume-x',
  'lightbulb',
  'shield',
  'alert-circle',
  'x-circle',
  'alert-triangle',
  'trash-2',
  'phone',
  'frown',
  'alert-octagon',
  'x-octagon',
]

export const COLOR_OPTIONS = ['blue', 'indigo', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'rose', 'pink', 'purple']

export const DEFAULT_HABIT_TEMPLATES = [
  {
    habit_name: '认真完成各科作业',
    habit_description: '按时认真完成各科作业',
    habit_type: 'daily_once',
    points_per_checkin: 2,
    icon_name: 'book',
    color_scheme: 'green',
  },
  {
    habit_name: '复习今日所学内容',
    habit_description: '当天复习学习的内容',
    habit_type: 'daily_once',
    points_per_checkin: 2,
    icon_name: 'book-open',
    color_scheme: 'blue',
  },
  {
    habit_name: '预习明日要学课程',
    habit_description: '提前预习第二天的课程',
    habit_type: 'daily_once',
    points_per_checkin: 3,
    icon_name: 'calendar',
    color_scheme: 'purple',
  },
  {
    habit_name: '每日练字15分钟',
    habit_description: '练习书法15分钟',
    habit_type: 'daily_once',
    points_per_checkin: 2,
    icon_name: 'pen-tool',
    color_scheme: 'orange',
  },
  {
    habit_name: '坐姿、握笔姿势标准',
    habit_description: '保持正确的坐姿和握笔姿势',
    habit_type: 'daily_once',
    points_per_checkin: 2,
    icon_name: 'user-check',
    color_scheme: 'green',
  },
  {
    habit_name: '课外书阅读30分钟',
    habit_description: '每天阅读课外书30分钟',
    habit_type: 'daily_once',
    points_per_checkin: 5,
    icon_name: 'book-open',
    color_scheme: 'purple',
  },
  {
    habit_name: '整理书包、课桌',
    habit_description: '保持书包和课桌整洁',
    habit_type: 'daily_multiple',
    max_daily_count: 2,
    points_per_checkin: 1,
    icon_name: 'package',
    color_scheme: 'orange',
  },
  {
    habit_name: '按时睡觉、起床',
    habit_description: '按时作息不拖延',
    habit_type: 'daily_once',
    points_per_checkin: 2,
    icon_name: 'moon',
    color_scheme: 'purple',
  },
]

function canUseWindow() {
  return typeof window !== 'undefined'
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeType(value) {
  const valueString = String(value ?? 'daily_once')
  return HABIT_TYPE_OPTIONS.some((option) => option.value === valueString) ? valueString : 'daily_once'
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return Boolean(value)
}

function normalizeText(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback
  }

  return String(value).trim()
}

export function normalizeHabitRecord(record) {
  return {
    ...record,
    habit_name: normalizeText(record?.habit_name),
    habit_description: normalizeText(record?.habit_description),
    habit_type: normalizeType(record?.habit_type),
    max_daily_count: toNumber(record?.max_daily_count, 1),
    points_per_checkin: toNumber(record?.points_per_checkin, 0),
    requires_approval: normalizeBoolean(record?.requires_approval),
    is_active: normalizeBoolean(record?.is_active, true),
    display_order: toNumber(record?.display_order, 0),
  }
}

function sortHabitRecords(records) {
  return [...records].sort((left, right) => {
    const orderDiff = toNumber(left?.display_order, 0) - toNumber(right?.display_order, 0)

    if (orderDiff !== 0) {
      return orderDiff
    }

    const createdAtDiff = Date.parse(left?.created_at ?? '') - Date.parse(right?.created_at ?? '')

    if (Number.isFinite(createdAtDiff) && createdAtDiff !== 0) {
      return createdAtDiff
    }

    return String(left?.id ?? '').localeCompare(String(right?.id ?? ''))
  })
}

export function summarizeHabits(habits) {
  const normalized = Array.isArray(habits) ? habits : []
  const totalHabits = normalized.length
  const activeHabits = normalized.filter((habit) => Boolean(habit?.is_active)).length
  const inactiveHabits = totalHabits - activeHabits
  const positivePoints = normalized
    .filter((habit) => toNumber(habit?.points_per_checkin, 0) > 0)
    .reduce((sum, habit) => sum + toNumber(habit?.points_per_checkin, 0), 0)
  const negativePoints = normalized
    .filter((habit) => toNumber(habit?.points_per_checkin, 0) < 0)
    .reduce((sum, habit) => sum + Math.abs(toNumber(habit?.points_per_checkin, 0)), 0)

  return {
    totalHabits,
    activeHabits,
    inactiveHabits,
    positivePoints,
    negativePoints,
  }
}

export function getHabitTypeLabel(habitType) {
  return HABIT_TYPE_OPTIONS.find((option) => option.value === habitType)?.label ?? habitType ?? '未分类'
}

function getNextDisplayOrder(currentHabits) {
  if (!Array.isArray(currentHabits) || currentHabits.length === 0) {
    return 0
  }

  return Math.max(...currentHabits.map((habit) => toNumber(habit?.display_order, 0))) + 1
}

function normalizeHabitWriteFields(values = {}) {
  const payload = {}

  if ('habit_name' in values) {
    payload.habit_name = normalizeText(values.habit_name)
  }

  if ('habit_description' in values) {
    payload.habit_description = normalizeText(values.habit_description)
  }

  if ('habit_type' in values) {
    payload.habit_type = normalizeType(values.habit_type)
  }

  if ('max_daily_count' in values) {
    const normalizedType = normalizeType(values.habit_type)
    const count = toNumber(values.max_daily_count, 1)
    payload.max_daily_count = normalizedType === 'daily_multiple' || normalizedType === 'weekly' ? count : 1
  }

  if ('points_per_checkin' in values) {
    payload.points_per_checkin = toNumber(values.points_per_checkin, 0)
  }

  if ('requires_approval' in values) {
    payload.requires_approval = normalizeBoolean(values.requires_approval, false)
  }

  if ('icon_name' in values) {
    payload.icon_name = normalizeText(values.icon_name, 'star') || 'star'
  }

  if ('color_scheme' in values) {
    payload.color_scheme = normalizeText(values.color_scheme, 'blue') || 'blue'
  }

  if ('is_active' in values) {
    payload.is_active = normalizeBoolean(values.is_active, true)
  }

  return payload
}

export async function fetchHabitsForProfile(profileId) {
  if (!profileId) {
    return []
  }

  const { data, error } = await supabase
    .from('behavior_habits')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    throw error
  }

  return sortHabitRecords((data ?? []).map(normalizeHabitRecord))
}

export async function createHabit(profile, values, currentHabits = []) {
  if (!profile?.id || !profile?.account_id) {
    throw new Error('missing profile')
  }

  const habitCount = getNextDisplayOrder(currentHabits)
  const payload = {
    user_id: profile.account_id,
    profile_id: profile.id,
    display_order: habitCount,
    updated_at: new Date().toISOString(),
    ...normalizeHabitWriteFields({
      habit_name: values.habit_name ?? '',
      habit_description: values.habit_description ?? '',
      habit_type: values.habit_type ?? 'daily_once',
      max_daily_count: values.max_daily_count,
      points_per_checkin: values.points_per_checkin,
      requires_approval: values.requires_approval,
      icon_name: values.icon_name ?? 'star',
      color_scheme: values.color_scheme ?? 'blue',
      is_active: values.is_active ?? true,
    }),
  }

  const { data, error } = await supabase.from('behavior_habits').insert(payload).select('*').single()

  if (error) {
    throw error
  }

  return normalizeHabitRecord(data)
}

export async function updateHabit(habitId, values) {
  if (!habitId) {
    throw new Error('missing habit id')
  }

  const payload = {
    ...normalizeHabitWriteFields(values),
    updated_at: new Date().toISOString(),
  }

  const query = supabase.from('behavior_habits').update(payload).eq('id', habitId)
  const { data, error } = typeof query.select === 'function' ? await query.select('*').single() : await query

  if (error) {
    throw error
  }

  return data ? normalizeHabitRecord(data) : null
}

export async function deleteHabit(habitId) {
  if (!habitId) {
    throw new Error('missing habit id')
  }

  const { error } = await supabase.from('behavior_habits').delete().eq('id', habitId)

  if (error) {
    throw error
  }
}

export async function saveHabitOrder(habits) {
  const orderedHabits = Array.isArray(habits) ? habits : []

  for (const [index, habit] of orderedHabits.entries()) {
    const { error } = await supabase
      .from('behavior_habits')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', habit.id)

    if (error) {
      throw error
    }
  }

  return orderedHabits
}

export async function importDefaultHabits(profile, currentHabits = []) {
  if (!profile?.id || !profile?.account_id) {
    throw new Error('missing profile')
  }

  const existingKeys = new Set(
    currentHabits.map((habit) => `${normalizeText(habit?.habit_name).toLowerCase()}::${normalizeType(habit?.habit_type)}`),
  )

  const nextDisplayOrder = getNextDisplayOrder(currentHabits)
  const rows = DEFAULT_HABIT_TEMPLATES.filter((template) => {
    const key = `${normalizeText(template.habit_name).toLowerCase()}::${normalizeType(template.habit_type)}`
    return !existingKeys.has(key)
  }).map((template, index) => ({
    user_id: profile.account_id,
    profile_id: profile.id,
    display_order: nextDisplayOrder + index,
    updated_at: new Date().toISOString(),
    habit_name: template.habit_name,
    habit_description: template.habit_description,
    habit_type: template.habit_type,
    max_daily_count: template.max_daily_count ?? 1,
    points_per_checkin: template.points_per_checkin ?? 0,
    requires_approval: Boolean(template.requires_approval),
    icon_name: template.icon_name ?? 'star',
    color_scheme: template.color_scheme ?? 'blue',
    is_active: template.is_active ?? true,
  }))

  if (rows.length === 0) {
    return []
  }

  const { data, error } = await supabase.from('behavior_habits').insert(rows).select('*')

  if (error) {
    throw error
  }

  return (data ?? []).map(normalizeHabitRecord)
}

function getDateKey(dateLike = new Date()) {
  if (typeof dateLike === 'string') {
    return dateLike
  }

  const date = dateLike instanceof Date ? dateLike : new Date()
  return new Intl.DateTimeFormat('en-CA').format(date)
}

function getTodayCheckinStorageKey(profileId, dateLike) {
  return `habit_checkins_${profileId}_${getDateKey(dateLike)}`
}

export function loadTodayCheckins(profileId, dateLike = new Date()) {
  if (!canUseWindow() || !profileId) {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(getTodayCheckinStorageKey(profileId, dateLike))
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveTodayCheckins(profileId, entries, dateLike = new Date()) {
  if (!canUseWindow() || !profileId) {
    return false
  }

  try {
    window.localStorage.setItem(getTodayCheckinStorageKey(profileId, dateLike), JSON.stringify(entries ?? {}))
    return true
  } catch {
    return false
  }
}

export function clearTodayCheckins(profileId, dateLike = new Date()) {
  if (!canUseWindow() || !profileId) {
    return false
  }

  try {
    window.localStorage.removeItem(getTodayCheckinStorageKey(profileId, dateLike))
    return true
  } catch {
    return false
  }
}
