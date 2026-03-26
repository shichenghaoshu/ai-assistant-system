import { useEffect, useState } from 'react'

import { supabase } from '../../auth/session.js'

const initialState = {
  loading: true,
  profile: null,
  error: null,
}

function getCreatedAtTimestamp(profile) {
  const timestamp = Date.parse(profile?.created_at ?? '')
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

export function selectCurrentProfile(profiles) {
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return null
  }

  return [...profiles].sort((left, right) => {
    if (Boolean(left?.is_default) !== Boolean(right?.is_default)) {
      return left?.is_default ? -1 : 1
    }

    const createdAtDiff = getCreatedAtTimestamp(right) - getCreatedAtTimestamp(left)

    if (createdAtDiff !== 0) {
      return createdAtDiff
    }

    return String(left?.id ?? '').localeCompare(String(right?.id ?? ''))
  })[0]
}

export async function fetchCurrentProfile(accountId) {
  if (!accountId) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,account_id,profile_name,is_default,avatar_color,created_at')
    .eq('account_id', accountId)

  if (error) {
    throw error
  }

  return selectCurrentProfile(data)
}

export function useCurrentProfile(accountId) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!accountId) {
        if (active) {
          setState({
            loading: false,
            profile: null,
            error: null,
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

        if (active) {
          setState({
            loading: false,
            profile,
            error: null,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            profile: null,
            error,
          })
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [accountId])

  return state
}
