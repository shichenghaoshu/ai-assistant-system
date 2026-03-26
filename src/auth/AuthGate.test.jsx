import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AuthGate from './AuthGate.jsx'

vi.mock('./session.js', () => ({
  useAuthSession: () => ({
    loading: false,
    session: null,
  }),
}))

describe('AuthGate', () => {
  it('redirects unauthenticated users to /auth', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/auth" element={<div>auth-screen</div>} />
          <Route element={<AuthGate />}>
            <Route path="/dashboard" element={<div>private-shell</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('auth-screen')).toBeInTheDocument()
  })
})
