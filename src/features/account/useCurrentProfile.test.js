import { describe, expect, it } from 'vitest'

import { selectCurrentProfile } from './useCurrentProfile.js'

describe('selectCurrentProfile', () => {
  it('prefers defaults, then newest created_at, then stable id fallback', () => {
    const profiles = [
      { id: 'c-profile', is_default: false, created_at: '2026-01-02T10:00:00Z' },
      { id: 'b-profile', is_default: true, created_at: '2026-01-01T10:00:00Z' },
      { id: 'a-profile', is_default: true, created_at: '2026-01-01T10:00:00Z' },
      { id: 'd-profile', is_default: false, created_at: '2026-01-03T10:00:00Z' },
    ]

    expect(selectCurrentProfile(profiles)).toMatchObject({ id: 'a-profile' })
  })

  it('falls back to newest profile when there is no default', () => {
    const profiles = [
      { id: 'older', is_default: false, created_at: '2026-01-01T10:00:00Z' },
      { id: 'newer', is_default: false, created_at: '2026-01-03T10:00:00Z' },
    ]

    expect(selectCurrentProfile(profiles)).toMatchObject({ id: 'newer' })
  })
})
