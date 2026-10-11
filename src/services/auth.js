import api from './api'
import { clearSession, getRefreshToken, saveSession } from './authStorage'

// Dev only: skip the login screen while the backend isn't reachable.
// Two locks: the .env flag AND import.meta.env.DEV — DEV is always false in a production build,
// so this can never be active on the deployed dashboard, even if the flag is left on.
export const DEV_SKIP_LOGIN =
  import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_LOGIN === 'true'

// Admin login only — never /auth/login (client endpoint, no role check) or any signup endpoint
export async function login(email, password) {
  const res = await api.post('/auth/adminDashboard/login', { email, password })
  const data = res.data.data

  // The backend already refuses non-admins; this second check never stores a non-admin session.
  // It fails like wrong credentials (401) so the Login page shows the same message.
  if (data.user.role !== 'ADMIN') {
    const error = new Error('Not an admin account')
    error.response = { status: 401 }
    throw error
  }

  saveSession(data)
  return data.user
}

export async function logout() {
  try {
    await api.post('/auth/logout', { refresh_token: getRefreshToken() })
  } catch {
    // Ignored on purpose: the local session is cleared even if the server can't be reached
  }
  clearSession()
}
