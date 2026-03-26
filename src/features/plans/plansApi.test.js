import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../auth/session.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../account/useCurrentProfile.js', () => ({
  fetchCurrentProfile: vi.fn(),
}))

const { generatePlanDraft, parseBatchPlanInput } = await import('./plansApi.js')

describe('plansApi AI requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls the plan draft endpoint through the local api path with credentials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        draft: {
          plan_name: '周末语文冲刺',
        },
      }),
    })

    await generatePlanDraft('profile-1', '周末帮我安排两天语文复习')

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/plan-draft', expect.objectContaining({
      credentials: 'include',
      method: 'POST',
    }))
  })

  it('calls the batch parse endpoint through the local api path with credentials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        drafts: [],
      }),
    })

    await parseBatchPlanInput('profile-1', '数学复习 | 复习 | 每天')

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/parse-text', expect.objectContaining({
      credentials: 'include',
      method: 'POST',
    }))
  })
})
