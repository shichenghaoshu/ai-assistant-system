import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import { downloadJsonSnapshot, fetchExportSnapshot } from './systemToolsApi.js'

const initialState = {
  loading: true,
  error: null,
  snapshot: null,
  counts: {},
  accountEmail: '',
}

export function useExportPageData(accountId, accountEmail = '') {
  const profileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadExportSnapshot() {
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
            accountEmail,
          })
        }
        return
      }

      if (!profileState.profile) {
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
        accountEmail,
      }))

      try {
        const { snapshot, counts } = await fetchExportSnapshot(accountId, profileState.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            snapshot,
            counts,
            accountEmail,
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

    loadExportSnapshot()

    return () => {
      active = false
    }
  }, [accountEmail, accountId, profileState.error, profileState.loading, profileState.profile])

  function downloadExport() {
    if (!state.snapshot) {
      return false
    }

    return downloadJsonSnapshot(state.snapshot, `xxjh-export-${profileState.profile?.id ?? 'account'}.json`)
  }

  return {
    ...state,
    currentProfile: profileState.profile,
    downloadExport,
  }
}
