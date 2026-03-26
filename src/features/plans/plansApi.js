import { supabase } from '../../auth/session.js'
import { fetchCurrentProfile } from '../account/useCurrentProfile.js'
import {
  buildTaskPayloads,
  deriveDraftFromPrompt,
  joinTaskDatesText,
  normalizePlanInput,
  parseBatchPlanInputText,
} from './planUtils.js'

const AI_API_BASE = '/api/ai'
const PLANS_SELECT =
  'id,profile_id,plan_name,category,repeat_type,start_time,end_time,created_at,updated_at'
const TASKS_SELECT =
  'id,plan_id,profile_id,task_date,is_completed,completed_count,target_count,total_duration_seconds,session_count,created_at'

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''))
}

function groupTasksByPlanId(tasks) {
  return (tasks ?? []).reduce((acc, task) => {
    if (!task?.plan_id) {
      return acc
    }

    if (!acc[task.plan_id]) {
      acc[task.plan_id] = []
    }

    acc[task.plan_id].push(task)
    return acc
  }, {})
}

function enrichPlan(plan, tasks) {
  const planTasks = tasks ?? []
  const completedTaskCount = planTasks.filter((task) => task.is_completed).length
  const nextTask = planTasks.find((task) => !task.is_completed) ?? planTasks[0] ?? null

  return {
    ...plan,
    tasks: planTasks,
    taskCount: planTasks.length,
    completedTaskCount,
    progressLabel: planTasks.length > 0 ? `${completedTaskCount}/${planTasks.length}` : '0/0',
    latestTaskDate: planTasks[0]?.task_date ?? null,
    nextTaskDate: nextTask?.task_date ?? null,
  }
}

async function getPlanById(profileId, planId) {
  const { data, error } = await supabase
    .from('learning_plans')
    .select(PLANS_SELECT)
    .eq('profile_id', profileId)
    .eq('id', planId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ?? null
}

async function replacePlanTasks(profileId, planId, taskDatesText) {
  const tasks = buildTaskPayloads(profileId, planId, taskDatesText)

  await supabase.from('plan_tasks').delete().eq('profile_id', profileId).eq('plan_id', planId)

  if (tasks.length === 0) {
    return []
  }

  const { data, error } = await supabase.from('plan_tasks').insert(tasks).select(TASKS_SELECT)

  if (error) {
    throw error
  }

  return data ?? []
}

async function requestJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || `请求失败：${response.status}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('响应不是有效 JSON')
  }
}

function localPlanDraft(prompt) {
  return deriveDraftFromPrompt(prompt)
}

export async function fetchPlansManagePageData(accountId) {
  if (!accountId) {
    return {
      currentProfile: null,
      summary: {
        totalPlans: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
      plans: [],
    }
  }

  const currentProfile = await fetchCurrentProfile(accountId)

  if (!currentProfile) {
    return {
      currentProfile: null,
      summary: {
        totalPlans: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
      plans: [],
    }
  }

  const [plansResult, tasksResult] = await Promise.all([
    supabase
      .from('learning_plans')
      .select(PLANS_SELECT)
      .eq('profile_id', currentProfile.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('plan_tasks')
      .select(TASKS_SELECT)
      .eq('profile_id', currentProfile.id)
      .order('task_date', { ascending: false }),
  ])

  const queryError = plansResult.error || tasksResult.error

  if (queryError) {
    throw queryError
  }

  const taskGroups = groupTasksByPlanId(tasksResult.data)
  const plans = (plansResult.data ?? []).map((plan) => enrichPlan(plan, taskGroups[plan.id] ?? []))
  const tasks = tasksResult.data ?? []

  return {
    currentProfile,
    summary: {
      totalPlans: plans.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.is_completed).length,
    },
    plans,
  }
}

export async function fetchPlanEditorData(accountId, planId) {
  if (!accountId || !planId) {
    return {
      currentProfile: null,
      plan: null,
      tasks: [],
    }
  }

  const currentProfile = await fetchCurrentProfile(accountId)

  if (!currentProfile) {
    return {
      currentProfile: null,
      plan: null,
      tasks: [],
    }
  }

  const [plan, tasksResult] = await Promise.all([
    getPlanById(currentProfile.id, planId),
    supabase
      .from('plan_tasks')
      .select(TASKS_SELECT)
      .eq('profile_id', currentProfile.id)
      .eq('plan_id', planId)
      .order('task_date', { ascending: true }),
  ])

  if (tasksResult.error) {
    throw tasksResult.error
  }

  return {
    currentProfile,
    plan,
    tasks: tasksResult.data ?? [],
  }
}

export async function createPlanWithTasks(profileId, input) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  const normalized = normalizePlanInput(input)
  const { taskDatesText, ...rest } = normalized

  const { data: plan, error: planError } = await supabase
    .from('learning_plans')
    .insert(
      compactObject({
        profile_id: profileId,
        ...rest,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    )
    .select(PLANS_SELECT)
    .single()

  if (planError) {
    throw planError
  }

  const tasks = await replacePlanTasks(profileId, plan.id, taskDatesText)

  return {
    plan,
    tasks,
  }
}

export async function updatePlanWithTasks(profileId, planId, input) {
  if (!profileId) {
    throw new Error('missing profile id')
  }

  if (!planId) {
    throw new Error('missing plan id')
  }

  const normalized = normalizePlanInput(input)
  const { taskDatesText, ...rest } = normalized

  const { data: plan, error: planError } = await supabase
    .from('learning_plans')
    .update(
      compactObject({
        ...rest,
        updated_at: new Date().toISOString(),
      }),
    )
    .eq('profile_id', profileId)
    .eq('id', planId)
    .select(PLANS_SELECT)
    .single()

  if (planError) {
    throw planError
  }

  const tasks = await replacePlanTasks(profileId, planId, taskDatesText)

  return {
    plan,
    tasks,
  }
}

export async function createPlansFromDrafts(profileId, drafts) {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return {
      createdPlans: [],
    }
  }

  const createdPlans = []

  for (const draft of drafts) {
    const result = await createPlanWithTasks(profileId, draft)
    createdPlans.push(result.plan)
  }

  return {
    createdPlans,
  }
}

export async function generatePlanDraft(profileId, prompt) {
  const draft = localPlanDraft(prompt)
  const payload = {
    profile_id: profileId,
    prompt,
  }

  try {
    const response = await requestJson(`${AI_API_BASE}/plan-draft`, payload)
    const remoteDraft = response?.draft ?? response?.data?.draft ?? response

    if (remoteDraft && typeof remoteDraft === 'object') {
      return {
        draft: normalizePlanInput({
          ...draft,
          ...remoteDraft,
        }),
        source: 'remote',
        warning: null,
      }
    }
  } catch (error) {
    return {
      draft,
      source: 'local',
      warning: error?.message || 'AI 接口暂不可用，已生成本地草稿',
    }
  }

  return {
    draft,
    source: 'local',
    warning: 'AI 接口未返回草稿，已使用本地草稿',
  }
}

export async function parseBatchPlanInput(profileId, rawText) {
  const localDrafts = parseBatchPlanInputText(rawText)

  try {
    const response = await requestJson(`${AI_API_BASE}/parse-text`, {
      profile_id: profileId,
      text: rawText,
    })

    const remoteDrafts = Array.isArray(response?.drafts) ? response.drafts : Array.isArray(response?.data?.drafts) ? response.data.drafts : null

    if (remoteDrafts) {
      return {
        drafts: remoteDrafts.map((draft) => normalizePlanInput(draft)),
        source: 'remote',
        warning: null,
      }
    }
  } catch (error) {
    return {
      drafts: localDrafts,
      source: 'local',
      warning: error?.message || '批量解析接口暂不可用，已使用本地解析',
    }
  }

  return {
    drafts: localDrafts,
    source: 'local',
    warning: localDrafts.length > 0 ? null : '未解析到任何计划，请检查文本格式',
  }
}

export { joinTaskDatesText }
