import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchWeaknessAddPageData, requestPracticeDraft, submitPracticeRecord } from './weaknessApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  subjects: [],
  knowledgePoints: [],
  recentSubmissions: [],
}

export function useWeaknessAddPageData(accountId) {
  const [state, setState] = useState(initialState)
  const isMountedRef = useRef(true)

  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    [],
  )

  const refresh = useCallback(async () => {
    if (!accountId) {
      const nextState = {
        ...initialState,
        loading: false,
      }

      if (isMountedRef.current) {
        setState(nextState)
      }

      return nextState
    }

    if (isMountedRef.current) {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))
    }

    try {
      const data = await fetchWeaknessAddPageData(accountId)
      const nextState = {
        loading: false,
        error: null,
        currentProfile: data.currentProfile,
        subjects: data.subjects,
        knowledgePoints: data.knowledgePoints,
        recentSubmissions: data.recentSubmissions,
      }

      if (isMountedRef.current) {
        setState(nextState)
      }

      return nextState
    } catch (error) {
      const nextState = {
        ...initialState,
        loading: false,
        error,
      }

      if (isMountedRef.current) {
        setState(nextState)
      }

      throw error
    }
  }, [accountId])

  useEffect(() => {
    async function loadWeaknessAddPage() {
      try {
        await refresh()
      } catch (error) {
        if (isMountedRef.current) {
          setState({
            ...initialState,
            loading: false,
            error,
          })
        }
      }
    }

    loadWeaknessAddPage()
  }, [accountId, refresh])

  return {
    ...state,
    submitPracticeRecord,
    requestPracticeDraft,
    refresh,
  }
}
