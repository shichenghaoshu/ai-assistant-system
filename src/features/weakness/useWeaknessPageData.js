import { useEffect, useState } from 'react'

import { fetchWeaknessPageData } from './weaknessApi.js'

const initialState = {
  loading: true,
  error: null,
  currentProfile: null,
  subjects: [],
  knowledgePoints: [],
  weaknessReports: [],
  recentSubmissions: [],
  subjectSummaries: [],
  summary: {
    subjectCount: 0,
    knowledgePointCount: 0,
    practiceSubmissionCount: 0,
    weaknessReportCount: 0,
  },
}

export function useWeaknessPageData(accountId) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let active = true

    async function loadWeaknessPage() {
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
        const data = await fetchWeaknessPageData(accountId)

        if (active) {
          setState({
            loading: false,
            error: null,
            currentProfile: data.currentProfile,
            subjects: data.subjects,
            knowledgePoints: data.knowledgePoints,
            weaknessReports: data.weaknessReports,
            recentSubmissions: data.recentSubmissions,
            subjectSummaries: data.subjectSummaries,
            summary: data.summary,
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

    loadWeaknessPage()

    return () => {
      active = false
    }
  }, [accountId])

  return state
}
