import { useCallback, useEffect, useState } from 'react'

import { clearProfileData, deleteProfile, fetchUsersPageData, updateProfile } from './usersApi.js'

const initialState = {
  loading: true,
  error: null,
  accountEmail: '',
  profiles: [],
}

export function useUsersPageData(accountId, accountEmail = '') {
  const [state, setState] = useState(initialState)
  const [refreshSeed, setRefreshSeed] = useState(0)

  useEffect(() => {
    let active = true

    async function loadUsersPage() {
      if (!accountId) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            accountEmail,
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
        const pageData = await fetchUsersPageData(accountId, accountEmail)

        if (active) {
          setState({
            loading: false,
            error: null,
            accountEmail: pageData.accountEmail,
            profiles: pageData.profiles,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error,
            accountEmail,
          })
        }
      }
    }

    loadUsersPage()

    return () => {
      active = false
    }
  }, [accountId, accountEmail, refreshSeed])

  const refresh = useCallback(() => {
    setRefreshSeed((current) => current + 1)
  }, [])

  const saveProfile = useCallback(
    async (profileId, changes) => {
      const result = await updateProfile(profileId, changes)
      refresh()
      return result
    },
    [refresh],
  )

  const clearProfile = useCallback(
    async (profileId) => {
      const result = await clearProfileData(profileId)
      refresh()
      return result
    },
    [refresh],
  )

  const removeProfile = useCallback(
    async (profileId) => {
      const result = await deleteProfile(profileId)
      refresh()
      return result
    },
    [refresh],
  )

  return {
    ...state,
    refresh,
    updateProfile: saveProfile,
    clearProfileData: clearProfile,
    deleteProfile: removeProfile,
  }
}
