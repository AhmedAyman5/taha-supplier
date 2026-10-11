import axios from 'axios'
import { getAccessToken, getRefreshToken, saveSession, clearSession } from './authStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh tokens are single-use, so parallel 401s must share ONE refresh request.
let refreshPromise = null

function refreshSession() {
  if (!refreshPromise) {
    // plain axios (not api): the refresh call must skip the interceptors
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refresh_token: getRefreshToken() })
      .then((res) => saveSession(res.data.data))
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthRequest = original?.url?.startsWith('/auth/')

    if (error.response?.status !== 401 || isAuthRequest || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true
    try {
      await refreshSession()
      return api(original) // retried once, with the new access token
    } catch (refreshError) {
      clearSession()
      window.location.replace('/login')
      return Promise.reject(refreshError)
    }
  },
)

export default api
