import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useInstallGuidePageData } from './useInstallGuidePageData.js'

describe('useInstallGuidePageData', () => {
  const listeners = new Map()

  beforeEach(() => {
    listeners.clear()
    vi.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      listeners.set(type, handler)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls the browser install prompt when the install prompt is available', async () => {
    const { result } = renderHook(() => useInstallGuidePageData())
    const prompt = vi.fn().mockResolvedValue(undefined)
    const promptEvent = {
      preventDefault: vi.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }

    act(() => {
      listeners.get('beforeinstallprompt')(promptEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true)
    })

    await act(async () => {
      await expect(result.current.install()).resolves.toBe(true)
    })

    expect(prompt).toHaveBeenCalled()
    expect(result.current.banner).toMatchObject({
      variant: 'success',
    })
  })

  it('reports an unsupported browser when no install prompt exists', async () => {
    const { result } = renderHook(() => useInstallGuidePageData())

    await act(async () => {
      await expect(result.current.install()).resolves.toBe(false)
    })

    expect(result.current.banner).toMatchObject({
      variant: 'error',
    })
    expect(result.current.installLabel).toBe('当前浏览器不支持')
  })
})
