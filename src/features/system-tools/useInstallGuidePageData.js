import { useEffect, useRef, useState } from 'react'

const initialState = {
  loading: false,
  error: null,
  canInstall: false,
  installLabel: '安装到桌面',
  banner: null,
}

export function useInstallGuidePageData() {
  const [state, setState] = useState(initialState)
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let active = true

    function syncPromptState() {
      if (!active) {
        return
      }

      setState((current) => ({
        ...current,
        canInstall: Boolean(deferredPromptRef.current),
        installLabel: deferredPromptRef.current ? '安装到桌面' : '当前浏览器不支持',
      }))
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      deferredPromptRef.current = event
      syncPromptState()
    }

    function handleAppInstalled() {
      deferredPromptRef.current = null
      if (active) {
        setState((current) => ({
          ...current,
          banner: {
            variant: 'success',
            message: '应用已安装到桌面',
          },
        }))
      }
      syncPromptState()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    syncPromptState()

    return () => {
      active = false
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function install() {
    const promptEvent = deferredPromptRef.current

    if (!promptEvent || typeof promptEvent.prompt !== 'function') {
      setState((current) => ({
        ...current,
        banner: {
          variant: 'error',
          message: '当前浏览器暂不提供安装提示，请使用菜单中的“安装应用”入口',
        },
      }))
      return false
    }

    setState((current) => ({
      ...current,
      banner: null,
    }))

    try {
      await promptEvent.prompt()
      const choice = await Promise.resolve(promptEvent.userChoice)
      deferredPromptRef.current = null
      setState((current) => ({
        ...current,
        canInstall: false,
        installLabel: '当前浏览器不支持',
        banner:
          choice?.outcome === 'accepted'
            ? {
                variant: 'success',
                message: '已提交安装请求，请继续完成浏览器安装确认',
              }
            : {
                variant: 'error',
                message: '已取消安装',
              },
      }))
      return choice?.outcome === 'accepted'
    } catch (error) {
      deferredPromptRef.current = null
      setState((current) => ({
        ...current,
        canInstall: false,
        installLabel: '当前浏览器不支持',
        banner: {
          variant: 'error',
          message: error?.message || '触发安装失败',
        },
      }))
      return false
    }
  }

  return {
    ...state,
    install,
  }
}
