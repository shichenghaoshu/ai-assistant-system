import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import {
  clearTodayCheckins,
  fetchHabitsForProfile,
  loadTodayCheckins,
  saveTodayCheckins,
  summarizeHabits,
} from './habitsApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  habits: [],
  savedCheckins: {},
  summary: {
    totalHabits: 0,
    activeHabits: 0,
    inactiveHabits: 0,
    positivePoints: 0,
    negativePoints: 0,
  },
}

export function useHabitsCheckinPageData(accountId) {
  const currentProfileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadCheckins() {
      if (currentProfileState.loading) {
        return
      }

      if (!currentProfileState.profile) {
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
        currentProfile: currentProfileState.profile,
      }))

      try {
        const habits = await fetchHabitsForProfile(currentProfileState.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            currentProfile: currentProfileState.profile,
            habits,
            savedCheckins: loadTodayCheckins(currentProfileState.profile.id),
            summary: summarizeHabits(habits),
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            currentProfile: currentProfileState.profile,
            error,
          })
        }
      }
    }

    loadCheckins()

    return () => {
      active = false
    }
  }, [currentProfileState.loading, currentProfileState.profile, currentProfileState.error])

  async function saveCheckins(entries) {
    if (!currentProfileState.profile) {
      return false
    }

    const nextEntries = entries ?? {}
    const saved = saveTodayCheckins(currentProfileState.profile.id, nextEntries)

    if (saved) {
      setState((current) => ({
        ...current,
        savedCheckins: nextEntries,
      }))
    }

    return saved
  }

  async function clearCheckins() {
    if (!currentProfileState.profile) {
      return false
    }

    const cleared = clearTodayCheckins(currentProfileState.profile.id)

    if (cleared) {
      setState((current) => ({
        ...current,
        savedCheckins: {},
      }))
    }

    return cleared
  }

  return {
    ...state,
    saveCheckins,
    clearCheckins,
  }
}
