import { useEffect, useState } from 'react'

import { supabase } from '../../auth/session.js'
import { fetchCurrentProfile } from '../account/useCurrentProfile.js'

const initialState = {
  loading: true,
  error: null,
  profile: null,
  metrics: {
    plans: 0,
    tasks: 0,
    habits: 0,
    redemptions: 0,
  },
  recentPlans: [],
  recentTasks: [],
  todayTasks: [],
}

function withDefaultCount(count) {
  return typeof count === 'number' ? count : 0
}

function getLocalDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

export function useDashboardPageData(accountId) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!accountId) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
          })
        }
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        const profile = await fetchCurrentProfile(accountId)

        if (!profile) {
          if (active) {
            setState({
              ...initialState,
              loading: false,
            })
          }
          return
        }

        const [
          plansResult,
          tasksResult,
          todayTasksResult,
          planCountResult,
          taskCountResult,
          habitCountResult,
          redemptionCountResult,
        ] = await Promise.all([
          supabase
            .from('learning_plans')
            .select('id,plan_name,category,repeat_type,updated_at,created_at,start_time,end_time')
            .eq('profile_id', profile.id)
            .order('updated_at', { ascending: false })
            .limit(4),
          supabase
            .from('plan_tasks')
            .select(
              'id,plan_id,task_date,is_completed,completed_count,target_count,total_duration_seconds,session_count,created_at',
            )
            .eq('profile_id', profile.id)
            .order('task_date', { ascending: false })
            .limit(6),
          supabase
            .from('plan_tasks')
            .select(
              'id,plan_id,task_date,is_completed,completed_count,target_count,total_duration_seconds,session_count,created_at',
            )
            .eq('profile_id', profile.id)
            .eq('task_date', getLocalDateKey())
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('learning_plans')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id),
          supabase
            .from('plan_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id),
          supabase
            .from('behavior_habits')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id),
          supabase
            .from('redemption_records')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', accountId),
        ])

        const queryError =
          plansResult.error ||
          tasksResult.error ||
          todayTasksResult.error ||
          planCountResult.error ||
          taskCountResult.error ||
          habitCountResult.error ||
          redemptionCountResult.error

        if (queryError) {
          throw queryError
        }

        const recentTasks = tasksResult.data ?? []
        const todayTasks = todayTasksResult.data ?? []
        const relatedPlanIds = [...new Set([...recentTasks, ...todayTasks].map((task) => task.plan_id).filter(Boolean))]
        const planNamesById = {}

        if (relatedPlanIds.length > 0) {
          const { data: taskPlans, error: taskPlansError } = await supabase
            .from('learning_plans')
            .select('id,plan_name,category')
            .in('id', relatedPlanIds)

          if (taskPlansError) {
            throw taskPlansError
          }

          for (const plan of taskPlans ?? []) {
            planNamesById[plan.id] = plan
          }
        }

        if (active) {
          setState({
            loading: false,
            error: null,
            profile,
            metrics: {
              plans: withDefaultCount(planCountResult.count),
              tasks: withDefaultCount(taskCountResult.count),
              habits: withDefaultCount(habitCountResult.count),
              redemptions: withDefaultCount(redemptionCountResult.count),
            },
            recentPlans: plansResult.data ?? [],
            recentTasks: recentTasks.map((task) => ({
              ...task,
              plan: planNamesById[task.plan_id] ?? null,
            })),
            todayTasks: todayTasks.map((task) => ({
              ...task,
              plan: planNamesById[task.plan_id] ?? null,
            })),
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error,
          })
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [accountId])

  return state
}
