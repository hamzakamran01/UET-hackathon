import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API functions
export const authAPI = {
  sendEmailOTP: (email: string) =>
    api.post('/auth/email/send-otp', { email }),

  verifyEmailOTP: (email: string, code: string) =>
    api.post('/auth/email/verify-otp', { email, code }),

  getMe: () => api.get('/auth/me'),
}

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id: string) => api.get(`/services/${id}`),
  getStats: (id: string) => api.get(`/services/${id}/stats`),
}

export const tokensAPI = {
  checkExisting: (email: string, serviceId: string) =>
    api.get('/tokens/check-existing', { params: { email, serviceId } }),

  create: (serviceId: string) =>
    api.post('/tokens', { serviceId }),

  getMyTokens: () => api.get('/tokens/my-tokens'),

  getById: (id: string) => api.get(`/tokens/${id}`),

  getPosition: (id: string) => api.get(`/tokens/${id}/position`),

  cancel: (id: string, reason?: string) =>
    api.delete(`/tokens/${id}`, { data: { reason } }),

  submitFeedback: (id: string, rating: number, feedback?: string) =>
    api.post(`/tokens/${id}/feedback`, { rating, feedback }),
}

export const presenceAPI = {
  checkPresence: (tokenId: string, latitude: number, longitude: number, accuracy?: number) =>
    api.post('/presence/check', {
      tokenId,
      latitude,
      longitude,
      accuracy,
    }),

  getHistory: (tokenId: string) =>
    api.get(`/presence/${tokenId}/history`),
}

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
}

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
}

// Admin APIs
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// Admin request interceptor (handles both admin and queue manager)
adminApi.interceptors.request.use((config) => {
  // Check for queue manager token first, then admin token
  const queueManagerToken = localStorage.getItem('queueManagerAccessToken')
  const adminToken = localStorage.getItem('adminAccessToken')

  const token = queueManagerToken || adminToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Admin response interceptor for token refresh
adminApi.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const adminRefreshToken = localStorage.getItem('adminRefreshToken')
        const queueManagerRefreshToken = localStorage.getItem('queueManagerRefreshToken')

        const refreshToken = adminRefreshToken || queueManagerRefreshToken

        if (refreshToken) {
          // Note: Backend doesn't have a refresh endpoint for admin yet
          // So we'll just clear the tokens and redirect to login
          // TODO: Add refresh endpoint in backend
          throw new Error('Token expired - please login again')
        }
      } catch (refreshError) {
        // Clear all admin/queue manager tokens
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        localStorage.removeItem('adminRole')
        localStorage.removeItem('adminName')
        localStorage.removeItem('queueManagerAccessToken')
        localStorage.removeItem('queueManagerRefreshToken')
        localStorage.removeItem('queueManagerRole')
        localStorage.removeItem('queueManagerName')

        // Redirect to appropriate login page based on current path
        if (window.location.pathname.startsWith('/queue-manager')) {
          window.location.href = '/queue-manager/login'
        } else if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const adminAPI = {
  // Auth
  login: (data: { email: string; password: string }) =>
    adminApi.post('/admin/auth/login', data),

  // Dashboard Stats
  getStats: () => adminApi.get('/admin/stats'),
  getRecentActivity: () => adminApi.get('/admin/activity'),

  // Services Management
  getServices: () => adminApi.get('/admin/services'),
  createService: (data: any) => adminApi.post('/admin/services', data),
  updateService: (id: string, data: any) => adminApi.patch(`/admin/services/${id}`, data),
  deleteService: (id: string) => adminApi.delete(`/admin/services/${id}`),

  // Queue Management
  getTokens: (params?: any) => adminApi.get('/admin/tokens', { params }),
  callNextToken: (serviceId: string) => adminApi.post(`/admin/tokens/${serviceId}/call-next`),
  serveToken: (tokenId: string) => adminApi.patch(`/admin/tokens/${tokenId}/serve`),
  completeToken: (tokenId: string) => adminApi.patch(`/admin/tokens/${tokenId}/complete`),
  cancelToken: (tokenId: string, reason?: string) => adminApi.delete(`/admin/tokens/${tokenId}`, { data: { reason } }),
  notifyUser: (tokenId: string, message: string) =>
    adminApi.post(`/admin/tokens/${tokenId}/notify`, { message }),

  // User Management
  getUsers: () => adminApi.get('/admin/users'),
  banUser: (userId: string, reason: string) =>
    adminApi.post(`/admin/users/${userId}/ban`, { reason }),
  unbanUser: (userId: string) => adminApi.post(`/admin/users/${userId}/unban`),
  verifyUserEmail: (userId: string) => adminApi.patch(`/admin/users/${userId}/verify-email`),
  verifyUserPhone: (userId: string) => adminApi.patch(`/admin/users/${userId}/verify-phone`),

  // Abuse Reports
  getAbuseLogs: () => adminApi.get('/admin/abuse'),
  resolveAbuseLog: (logId: string) => adminApi.patch(`/admin/abuse/${logId}/resolve`),
}

// Queue Manager APIs
export const queueManagerAPI = {
  // Auth
  login: (data: { email: string; password: string }) =>
    adminApi.post('/admin/auth/login', data),

  // Dashboard Stats
  getStats: () => adminApi.get('/queue-manager/stats'),
  getRecentActivity: () => adminApi.get('/queue-manager/activity'),

  // Services (read-only for queue manager)
  getServices: () => adminApi.get('/queue-manager/services'),
  getServiceById: (id: string) => adminApi.get(`/queue-manager/services/${id}`),
  getServiceStats: (id: string) => adminApi.get(`/queue-manager/services/${id}/stats`),

  // Queue Management
  getTokens: (params?: any) => adminApi.get('/queue-manager/tokens', { params }),
  callNextToken: (serviceId: string) => adminApi.post(`/queue-manager/tokens/${serviceId}/call-next`),
  serveToken: (tokenId: string) => adminApi.patch(`/queue-manager/tokens/${tokenId}/serve`),
  completeToken: (tokenId: string) => adminApi.patch(`/queue-manager/tokens/${tokenId}/complete`),
  notifyUser: (tokenId: string, message: string) =>
    adminApi.post(`/queue-manager/tokens/${tokenId}/notify`, { message }),
}
