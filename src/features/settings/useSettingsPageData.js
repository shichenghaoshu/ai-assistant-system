import { useEffect, useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import {
  loadOrCreateSettings,
  readClipboardPromptDismissed,
  setClipboardPromptDismissed,
  setCompletionSoundMirror,
  updateSettingsValue,
  updateSettingsValues,
} from './settingsApi.js'

const initialState = {
  loading: true,
  error: null,
  preferences: null,
  banner: null,
  clipboardPromptDismissed: false,
  savingField: null,
}

function getErrorMessage(error) {
  if (!error) {
    return '操作失败，请重试'
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    return error.message
  }

  return '操作失败，请重试'
}

export function useSettingsPageData(accountId) {
  const { loading: profileLoading, profile, error: profileError } = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)
  const [refreshSeed, setRefreshSeed] = useState(0)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      if (profileLoading) {
        if (active) {
          setState((current) => ({
            ...current,
            loading: true,
            error: null,
          }))
        }
        return
      }

      if (profileError) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error: profileError,
          })
        }
        return
      }

      if (!profile) {
        if (active) {
          setState({
            ...initialState,
            loading: false,
            error: null,
          })
        }
        return
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        banner: null,
        savingField: null,
      }))

      try {
        const preferences = await loadOrCreateSettings(profile.id)

        if (!active) {
          return
        }

        try {
          setCompletionSoundMirror(profile.id, preferences?.completion_sound_enabled ?? true)
        } catch {
          // Local storage is best-effort; keep the backend-backed settings load successful.
        }

        let clipboardPromptDismissed = false
        try {
          clipboardPromptDismissed = readClipboardPromptDismissed(profile.id)
        } catch {
          clipboardPromptDismissed = false
        }

        setState({
          loading: false,
          error: null,
          preferences,
          banner: null,
          clipboardPromptDismissed,
          savingField: null,
        })
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

    loadSettings()

    return () => {
      active = false
    }
  }, [profileLoading, profileError, profile, refreshSeed])

  async function updatePreference(field, value) {
    if (!profile) {
      return false
    }

    setState((current) => ({
      ...current,
      savingField: field,
      banner: null,
    }))

    try {
      const preferences = await updateSettingsValue(profile.id, field, value)

      if (field === 'completion_sound_enabled') {
        try {
          setCompletionSoundMirror(profile.id, value)
        } catch {
          // Mirror failures should not mask a successful backend update.
        }
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: null,
        preferences,
        banner: {
          variant: 'success',
          message: '设置已保存',
        },
        savingField: null,
      }))

      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        savingField: null,
        banner: {
          variant: 'error',
          message: getErrorMessage(error),
        },
      }))

      return false
    }
  }

  async function saveRewardRules(values) {
    if (!profile) {
      return false
    }

    setState((current) => ({
      ...current,
      savingField: 'reward_rules',
      banner: null,
    }))

    try {
      const preferences = await updateSettingsValues(profile.id, values)

      setState((current) => ({
        ...current,
        loading: false,
        error: null,
        preferences,
        banner: {
          variant: 'success',
          message: '设置已保存',
        },
        savingField: null,
      }))

      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        savingField: null,
        banner: {
          variant: 'error',
          message: getErrorMessage(error),
        },
      }))

      return false
    }
  }

  function dismissClipboardPrompt() {
    if (!profile) {
      return
    }

    let persisted = false

    try {
      persisted = setClipboardPromptDismissed(profile.id, true)
    } catch {
      persisted = false
    }

    if (!persisted) {
      setState((current) => ({
        ...current,
        banner: {
          variant: 'error',
          message: '保存粘贴板提示状态失败',
        },
      }))
      return
    }

    setState((current) => ({
      ...current,
      clipboardPromptDismissed: true,
      banner: {
        variant: 'success',
        message: '已关闭弹窗',
      },
    }))
  }

  function restoreClipboardPrompt() {
    if (!profile) {
      return
    }

    let persisted = false

    try {
      persisted = setClipboardPromptDismissed(profile.id, false)
    } catch {
      persisted = false
    }

    if (!persisted) {
      setState((current) => ({
        ...current,
        banner: {
          variant: 'error',
          message: '恢复粘贴板提示失败',
        },
      }))
      return
    }

    setState((current) => ({
      ...current,
      clipboardPromptDismissed: false,
      banner: {
        variant: 'success',
        message: '粘贴板识别提示已重新开启',
      },
    }))
  }

  function refresh() {
    setState((current) => ({
      ...current,
      banner: null,
    }))
    setRefreshSeed((current) => current + 1)
  }

  return {
    loading: profileLoading || state.loading,
    error: state.error,
    currentProfile: profile,
    preferences: state.preferences,
    banner: state.banner,
    clipboardPromptDismissed: state.clipboardPromptDismissed,
    savingField: state.savingField,
    updatePreference,
    saveRewardRules,
    dismissClipboardPrompt,
    restoreClipboardPrompt,
    refresh,
  }
}
