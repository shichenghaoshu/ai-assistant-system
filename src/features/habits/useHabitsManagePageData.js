import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import {
  createHabit,
  deleteHabit,
  fetchHabitsForProfile,
  importDefaultHabits,
  saveHabitOrder,
  summarizeHabits,
  updateHabit,
} from './habitsApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  habits: [],
  summary: {
    totalHabits: 0,
    activeHabits: 0,
    inactiveHabits: 0,
    positivePoints: 0,
    negativePoints: 0,
  },
}

export function useHabitsManagePageData(accountId) {
  const currentProfileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadHabits() {
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

    loadHabits()

    return () => {
      active = false
    }
  }, [currentProfileState.loading, currentProfileState.profile, currentProfileState.error])

  async function refresh() {
    if (!currentProfileState.profile) {
      return
    }

    const habits = await fetchHabitsForProfile(currentProfileState.profile.id)
    setState({
      loading: false,
      error: null,
      currentProfile: currentProfileState.profile,
      habits,
      summary: summarizeHabits(habits),
    })
  }

  async function createNewHabit(values) {
    const habit = await createHabit(currentProfileState.profile, values, state.habits)
    await refresh()
    return habit
  }

  async function saveHabit(habitId, values) {
    const habit = await updateHabit(habitId, values)
    await refresh()
    return habit
  }

  async function removeHabit(habitId) {
    await deleteHabit(habitId)
    await refresh()
  }

  async function moveHabit(habitId, direction) {
    const currentIndex = state.habits.findIndex((habit) => habit.id === habitId)
    const nextIndex = currentIndex + direction

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.habits.length) {
      return
    }

    const nextHabits = [...state.habits]
    const [moved] = nextHabits.splice(currentIndex, 1)
    nextHabits.splice(nextIndex, 0, moved)

    await saveHabitOrder(nextHabits)
    await refresh()
  }

  async function toggleHabitActive(habitId, isActive) {
    await updateHabit(habitId, { is_active: isActive })
    await refresh()
  }

  async function importDefaults() {
    await importDefaultHabits(currentProfileState.profile, state.habits)
    await refresh()
  }

  return {
    ...state,
    refresh,
    createHabit: createNewHabit,
    updateHabit: saveHabit,
    deleteHabit: removeHabit,
    moveHabit,
    toggleHabitActive,
    importDefaultHabits: importDefaults,
  }
}
