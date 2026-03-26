import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import {
  deleteExamSubject,
  fetchExamPageData,
  fetchExamRecord,
  requestExamDraft,
  saveExamSubmission,
  saveExamSubject,
  toggleExamSubject,
  updateExamRecord,
} from './examsApi.js'

const emptyCatalogState = {
  loading: true,
  error: null,
  subjects: [],
  sessions: [],
  records: [],
}

const emptySubjectsState = {
  loading: true,
  error: null,
  subjects: [],
}

function useExamCatalog(accountId) {
  const currentProfile = useCurrentProfile(accountId)
  const [state, setState] = useState(emptyCatalogState)

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      if (!currentProfile.profile?.id) {
        if (active) {
          setState({
            ...emptyCatalogState,
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
        const catalog = await fetchExamPageData(currentProfile.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            ...catalog,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...emptyCatalogState,
            loading: false,
            error,
          })
        }
      }
    }

    loadCatalog()

    return () => {
      active = false
    }
  }, [currentProfile.profile?.id])

  return {
    currentProfile: currentProfile.profile,
    profileLoading: currentProfile.loading,
    profileError: currentProfile.error,
    recentRecords: state.records,
    ...state,
  }
}

export function useExamAddPageData(accountId) {
  const catalog = useExamCatalog(accountId)
  const [saving, setSaving] = useState(false)

  async function submitExam(profileId, formState, rows, multiSubject) {
    setSaving(true)
    try {
      const result = await saveExamSubmission(profileId, formState, rows, multiSubject)
      return result
    } finally {
      setSaving(false)
    }
  }

  return {
    ...catalog,
    recentRecords: catalog.records,
    saving,
    saveExamSubmission: submitExam,
  }
}

export function useExamAiAddPageData(accountId) {
  const catalog = useExamCatalog(accountId)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function generateDraft(payload) {
    setGenerating(true)
    try {
      return await requestExamDraft(payload)
    } finally {
      setGenerating(false)
    }
  }

  async function submitExam(profileId, formState, rows, multiSubject) {
    setSaving(true)
    try {
      return await saveExamSubmission(profileId, formState, rows, multiSubject)
    } finally {
      setSaving(false)
    }
  }

  return {
    ...catalog,
    saving,
    generating,
    requestExamDraft: generateDraft,
    saveExamSubmission: submitExam,
  }
}

export function useExamEditPageData(accountId, recordId) {
  const currentProfile = useCurrentProfile(accountId)
  const [state, setState] = useState({
    loading: true,
    error: null,
    record: null,
    subjects: [],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadEditData() {
      if (!currentProfile.profile?.id || !recordId) {
        if (active) {
          setState({
            loading: false,
            error: null,
            record: null,
            subjects: [],
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
        const [record, catalog] = await Promise.all([
          fetchExamRecord(currentProfile.profile.id, recordId),
          fetchExamPageData(currentProfile.profile.id),
        ])

        if (active) {
          setState({
            loading: false,
            error: null,
            record,
            subjects: catalog.subjects,
            sessions: catalog.sessions,
            records: catalog.records,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error,
            record: null,
            subjects: [],
          })
        }
      }
    }

    loadEditData()

    return () => {
      active = false
    }
  }, [currentProfile.profile?.id, recordId])

  async function submitRecord(profileId, targetRecordId, formState) {
    setSaving(true)
    try {
      return await updateExamRecord(profileId, targetRecordId, formState)
    } finally {
      setSaving(false)
    }
  }

  return {
    currentProfile: currentProfile.profile,
    profileLoading: currentProfile.loading,
    profileError: currentProfile.error,
    saving,
    saveExamRecord: submitRecord,
    ...state,
  }
}

export function useExamSubjectsPageData(accountId) {
  const currentProfile = useCurrentProfile(accountId)
  const [state, setState] = useState(emptySubjectsState)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSubjects() {
      if (!currentProfile.profile?.id) {
        if (active) {
          setState({
            ...emptySubjectsState,
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
        const { subjects } = await fetchExamPageData(currentProfile.profile.id)

        if (active) {
          setState({
            loading: false,
            error: null,
            subjects,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            ...emptySubjectsState,
            loading: false,
            error,
          })
        }
      }
    }

    loadSubjects()

    return () => {
      active = false
    }
  }, [currentProfile.profile?.id])

  async function submitSubject(profileId, payload) {
    setSaving(true)
    try {
      return await saveExamSubject(profileId, payload)
    } finally {
      setSaving(false)
    }
  }

  async function removeSubject(profileId, subjectId) {
    setSaving(true)
    try {
      return await deleteExamSubject(profileId, subjectId)
    } finally {
      setSaving(false)
    }
  }

  async function flipSubject(profileId, subjectId, isActive) {
    setSaving(true)
    try {
      return await toggleExamSubject(profileId, subjectId, isActive)
    } finally {
      setSaving(false)
    }
  }

  return {
    currentProfile: currentProfile.profile,
    profileLoading: currentProfile.loading,
    profileError: currentProfile.error,
    saving,
    saveExamSubject: submitSubject,
    deleteExamSubject: removeSubject,
    toggleExamSubject: flipSubject,
    ...state,
  }
}
