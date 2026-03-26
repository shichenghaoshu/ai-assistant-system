import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import { fetchRewardsRules, saveRewardsRules } from './rewardsApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  preferences: null,
  saving: false,
  banner: null,
}

export function useRewardsRulesPageData(accountId) {
  const profileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadPreferences() {
      if (profileState.loading) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: true,
            error: null,
          }))
        }
        return
      }

      if (profileState.error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error: profileState.error,
          })
        }
        return
      }

      if (!profileState.profile) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            currentProfile: null,
          })
        }
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        currentProfile: profileState.profile,
      }))

      try {
        const preferences = await fetchRewardsRules(profileState.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            currentProfile: profileState.profile,
            preferences,
            saving: false,
            banner: null,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            currentProfile: profileState.profile,
            error,
          })
        }
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [profileState.error, profileState.loading, profileState.profile])

  async function saveRules(nextValues) {
    if (!state.currentProfile?.id) {
      return null
    }

    setState((current) => ({
      ...current,
      saving: true,
      banner: null,
    }))

    try {
      const preferences = await saveRewardsRules(state.currentProfile.id, nextValues)

      setState((current) => ({
        ...current,
        loading: false,
        saving: false,
        error: null,
        preferences,
        banner: {
          variant: 'success',
          message: '奖励规则已保存',
        },
      }))

      return preferences
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        banner: {
          variant: 'error',
          message: error?.message || '保存失败，请稍后重试',
        },
      }))

      throw error
    }
  }

  return {
    ...state,
    saveRules,
  }
}
