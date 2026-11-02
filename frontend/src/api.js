import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing
api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config
  if (error.response?.status === 401 && !original?._retried && !original?.url?.includes('/auth/')) {
    original._retried = true
    try {
      refreshing ||= api.post('/auth/refresh').finally(() => { refreshing = null })
      const { data } = await refreshing
      if (data.accessToken) sessionStorage.setItem('accessToken', data.accessToken)
      return api(original)
    } catch { sessionStorage.removeItem('accessToken') }
  }
  return Promise.reject(error)
})

export const getError = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message === 'Network Error' || !error?.response) {
    return 'Unable to reach backend server. Please ensure VITE_API_URL is configured in Vercel and your backend is running.'
  }
  return error?.message || 'Something went wrong. Please try again.'
}
