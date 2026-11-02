import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// In-Memory Access Token Storage (Never persisted to localStorage or sessionStorage)
let inMemoryAccessToken = null

export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null
}

export const getAccessToken = () => inMemoryAccessToken

api.interceptors.request.use((config) => {
  if (inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
  }
  return config
})

let refreshing = null
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthBypass =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/forget-password') ||
      original?.url?.includes('/auth/reset-password')

    if (error.response?.status === 401 && !original?._retried && !isAuthBypass) {
      original._retried = true
      try {
        refreshing ||= api.post('/auth/refresh').finally(() => {
          refreshing = null
        })
        const { data } = await refreshing
        if (data.accessToken) {
          setAccessToken(data.accessToken)
          if (original.headers) {
            original.headers.Authorization = `Bearer ${data.accessToken}`
          }
        }
        return api(original)
      } catch (refreshErr) {
        setAccessToken(null)
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  }
)

export const getError = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message === 'Network Error' || !error?.response) {
    return 'Unable to reach backend server. Please ensure VITE_API_URL is configured in Vercel and your backend is running.'
  }
  return error?.message || 'Something went wrong. Please try again.'
}
