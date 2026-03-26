import { useState } from 'react'

import { useCurrentProfile } from '../account/useCurrentProfile.js'
import { importSnapshot, parseImportSnapshot } from './systemToolsApi.js'

const initialState = {
  loading: false,
  error: null,
  parsing: false,
  importing: false,
  parsedSnapshot: null,
  banner: null,
}

export function useImportPageData(accountId) {
  const profileState = useCurrentProfile(accountId)
  const [state, setState] = useState(initialState)

  async function parseImportFile(file) {
    if (!file) {
      return null
    }

    setState((current) => ({
      ...current,
      parsing: true,
      banner: null,
    }))

    try {
      const text = await file.text()
      const parsedSnapshot = parseImportSnapshot(text)

      setState((current) => ({
        ...current,
        parsing: false,
        parsedSnapshot,
        banner: {
          variant: 'success',
          message: '导入文件已读取，可以开始导入',
        },
      }))

      return parsedSnapshot
    } catch (error) {
      setState((current) => ({
        ...current,
        parsing: false,
        banner: {
          variant: 'error',
          message: error?.message || '导入文件读取失败',
        },
      }))

      throw error
    }
  }

  async function runImport(snapshot) {
    const payload = snapshot ?? state.parsedSnapshot

    if (!payload) {
      throw new Error('请先选择导入文件')
    }

    setState((current) => ({
      ...current,
      importing: true,
      banner: null,
    }))

    try {
      const result = await importSnapshot(payload, {
        accountId,
        profileId: profileState.profile?.id,
      })

      setState((current) => ({
        ...current,
        importing: false,
        banner: {
          variant: 'success',
          message: '导入完成',
        },
      }))

      return result
    } catch (error) {
      setState((current) => ({
        ...current,
        importing: false,
        banner: {
          variant: 'error',
          message: error?.message || '导入失败，请稍后重试',
        },
      }))

      throw error
    }
  }

  return {
    ...state,
    loading: profileState.loading,
    error: profileState.error,
    currentProfile: profileState.profile,
    parseImportFile,
    importSnapshot: runImport,
  }
}
