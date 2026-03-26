import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import {
  createAchievement,
  deleteAchievement as deleteAchievementRecord,
  fetchAchievementsManageData,
  saveAchievement as updateAchievementRecord,
} from './rewardsApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  achievements: [],
  selectedAchievementId: null,
  savingId: null,
  deletingId: null,
  banner: null,
}

export function useAchievementsManagePageData(accountId) {
  const profileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadAchievements() {
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
        const data = await fetchAchievementsManageData(profileState.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            currentProfile: profileState.profile,
            achievements: data.achievements,
            selectedAchievementId: data.achievements[0]?.id ?? null,
            savingId: null,
            deletingId: null,
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

    loadAchievements()

    return () => {
      active = false
    }
  }, [profileState.error, profileState.loading, profileState.profile])

  async function selectAchievement(achievementId) {
    setState((current) => ({
      ...current,
      selectedAchievementId: achievementId,
      banner: null,
    }))
  }

  async function saveAchievement(payload) {
    if (!state.currentProfile) {
      return null
    }

    const isEditing = Boolean(payload?.id)

    setState((current) => ({
      ...current,
      savingId: payload?.id ?? 'new',
      banner: null,
    }))

    try {
      const saved = isEditing ? await updateAchievementRecord(payload.id, payload) : await createAchievement(payload)

      setState((current) => {
        const nextAchievements = isEditing
          ? current.achievements.map((achievement) => (achievement.id === saved.id ? { ...achievement, ...saved } : achievement))
          : [saved, ...current.achievements]

        return {
          ...current,
          loading: false,
          savingId: null,
          achievements: nextAchievements,
          selectedAchievementId: saved.id,
          banner: {
            variant: 'success',
            message: isEditing ? '成就已保存' : '成就已创建',
          },
        }
      })

      return saved
    } catch (error) {
      setState((current) => ({
        ...current,
        savingId: null,
        banner: {
          variant: 'error',
          message: error?.message || '保存成就失败，请稍后重试',
        },
      }))

      throw error
    }
  }

  async function deleteAchievement(achievementId) {
    if (!achievementId) {
      return false
    }

    setState((current) => ({
      ...current,
      deletingId: achievementId,
      banner: null,
    }))

    try {
      await deleteAchievementRecord(achievementId)

      setState((current) => ({
        ...current,
        deletingId: null,
        achievements: current.achievements.filter((achievement) => achievement.id !== achievementId),
        selectedAchievementId: current.selectedAchievementId === achievementId ? current.achievements[0]?.id ?? null : current.selectedAchievementId,
        banner: {
          variant: 'success',
          message: '成就已删除',
        },
      }))

      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        deletingId: null,
        banner: {
          variant: 'error',
          message: error?.message || '删除成就失败，请稍后重试',
        },
      }))

      throw error
    }
  }

  return {
    ...state,
    selectAchievement,
    saveAchievement,
    deleteAchievement,
  }
}
