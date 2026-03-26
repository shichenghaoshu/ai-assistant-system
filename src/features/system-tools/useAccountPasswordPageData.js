import { useState } from 'react'

import { updateAccountPassword } from './systemToolsApi.js'

const initialState = {
  loading: false,
  error: null,
  updating: false,
  banner: null,
}

export function useAccountPasswordPageData() {
  const [state, setState] = useState(initialState)

  async function changePassword(newPassword) {
    setState((current) => ({
      ...current,
      updating: true,
      banner: null,
    }))

    try {
      await updateAccountPassword(newPassword)

      setState((current) => ({
        ...current,
        updating: false,
        banner: {
          variant: 'success',
          message: '密码已更新，请重新登录以继续使用',
        },
      }))

      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        updating: false,
        banner: {
          variant: 'error',
          message: error?.message || '更新密码失败，请稍后重试',
        },
      }))

      throw error
    }
  }

  return {
    ...state,
    changePassword,
  }
}
