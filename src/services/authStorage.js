const ACCESS_TOKEN_KEY = 'taha_access_token'
const REFRESH_TOKEN_KEY = 'taha_refresh_token'
const USER_KEY = 'taha_user'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null // a corrupted value must not crash the dashboard
  }
}

export function saveSession({ access_token, refresh_token, user }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// The refresh token decides: the access token lives only 15 minutes, and api.js renews it silently
export function isLoggedIn() {
  return Boolean(getRefreshToken())
}
