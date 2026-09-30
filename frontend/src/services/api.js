import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // For FormData, let Axios set Content-Type automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const newToken = res.data.token
        localStorage.setItem('token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

// =============================
// Auth services
// =============================
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => {
    // For FormData with file uploads, send as POST with _method=PUT
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      return api.post('/auth/profile', data)
    }
    return api.put('/auth/profile', data)
  },
  changePassword: (data) => api.put('/auth/password', data),
}

// =============================
// Voyage services
// =============================
const removeEmptyParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {})

export const voyageService = {
  getAll: (params) => api.get('/voyages', { params: removeEmptyParams(params) }),
  getAdminAll: (params) => api.get('/admin/voyages', { params: removeEmptyParams(params) }),
  getSupplierVoyages: (params) => api.get('/fournisseur/voyages', { params: removeEmptyParams(params) }),
  getFeatured: () => api.get('/voyages/featured'),
  getById: (id) => api.get(`/voyages/${id}`),
  getCategories: () => api.get('/voyages/categories'),
  getRecommended: (params) => api.get('/voyages/recommended', { params: removeEmptyParams(params) }),
  create: (data) => api.post('/admin/voyages', data),
  createSupplier: (data) => api.post('/fournisseur/voyages', data),
  update: (id, data) => api.post(`/admin/voyages/${id}`, data),
  updateSupplier: (id, data) => api.put(`/fournisseur/voyages/${id}`, data),
  delete: (id) => api.delete(`/admin/voyages/${id}`),
  deleteSupplier: (id) => api.delete(`/fournisseur/voyages/${id}`),
}

// =============================
// Reservation services
// =============================
export const reservationService = {
  getMyReservations: (params) => api.get('/reservations/my', { params: removeEmptyParams(params) }),
  getAll: (params) => api.get('/admin/reservations', { params: removeEmptyParams(params) }),
  getSupplierReservations: (params) => api.get('/fournisseur/reservations', { params: removeEmptyParams(params) }),
  getById: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post('/reservations', data),
  createAdmin: (data) => api.post('/admin/reservations', data),
  updateAdmin: (id, data) => api.put(`/admin/reservations/${id}`, data),
  delete: (id) => api.delete(`/admin/reservations/${id}`),
  cancel: (id, data) => api.post(`/reservations/${id}/cancel`, data),
  confirm: (id) => api.post(`/admin/reservations/${id}/confirm`),
  confirmSupplier: (id) => api.post(`/fournisseur/reservations/${id}/confirm`),
  rejectSupplier: (id) => api.post(`/fournisseur/reservations/${id}/reject`),
}

// =============================
// Supplier services
export const supplierService = {
  dashboard: () => api.get('/fournisseur/dashboard'),
  getVoyages: (params) => api.get('/fournisseur/voyages', { params: removeEmptyParams(params) }),
  getReservations: (params) => api.get('/fournisseur/reservations', { params: removeEmptyParams(params) }),
}

// =============================
// Paiement services
// =============================
export const paiementService = {
  createIntent: (data) => api.post('/paiements/create-intent', data),
  confirm: (data) => api.post('/paiements/confirm', data),
  downloadInvoiceByReservation: (reservationId) => api.get(`/paiements/reservation/${reservationId}/invoice`, { responseType: 'blob' }),
  getAll: (params) => api.get('/admin/paiements', { params: removeEmptyParams(params) }),
  getById: (id) => api.get(`/admin/paiements/${id}`),
  update: (id, data) => api.put(`/admin/paiements/${id}`, data),
  delete: (id) => api.delete(`/admin/paiements/${id}`),
  getStats: () => api.get('/admin/paiements/stats'),
}

// =============================
// Avis services
// =============================
export const avisService = {
  getByVoyage: (voyageId, params) => api.get('/avis', { params: { voyage_id: voyageId, ...params } }),
  getAdminAll: (params) => api.get('/admin/avis', { params: removeEmptyParams(params) }),
  getById: (id) => api.get(`/admin/avis/${id}`),
  update: (id, data) => api.put(`/admin/avis/${id}`, data),
  create: (data) => api.post('/avis', data),
  delete: (id) => api.delete(`/admin/avis/${id}`),
  approve: (id) => api.post(`/admin/avis/${id}/approve`),
}

// =============================
// Ticket services
// =============================
export const ticketService = {
  getAll: (params) => api.get('/tickets', { params: removeEmptyParams(params) }),
  getMy: (params) => api.get('/tickets/my', { params: removeEmptyParams(params) }),
  getById: (id) => api.get(`/tickets/${id}`),
  getSupportAll: (params) => api.get('/support/tickets', { params: removeEmptyParams(params) }),
  getSupportById: (id) => api.get(`/support/tickets/${id}`),
  getSupportDashboard: () => api.get('/support/dashboard'),
  getAdminAll: (params) => api.get('/admin/tickets', { params: removeEmptyParams(params) }),
  create: (data) => api.post('/tickets', data),
  reply: (id, data) => api.post(`/tickets/${id}/reply`, data), replyAdmin: (id, data) => api.post(`/admin/tickets/${id}/reply`, data), replySupport: (id, data) => api.post(`/support/tickets/${id}/reply`, data),
  closeSupport: (id) => api.post(`/support/tickets/${id}/close`),
  assignSupport: (id) => api.post(`/support/tickets/${id}/assign`),
  closeAdmin: (id) => api.post(`/admin/tickets/${id}/close`),
  delete: (id) => api.delete(`/admin/tickets/${id}`),
}

// =============================
// Wishlist services
// =============================
export const wishlistService = {
  getAll: () => api.get('/wishlist'),
  toggle: (id) => api.post(`/wishlist/${id}`),
}

// =============================
// Admin services
// =============================
export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),
  analytics: (params) => api.get('/admin/analytics', { params }),
  getUsers: (params) => api.get('/admin/users', { params: removeEmptyParams(params) }),
  toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getFournisseurs: (params) => api.get('/admin/fournisseurs', { params: removeEmptyParams(params) }),
  createFournisseur: (data) => api.post('/admin/fournisseurs', data),
  updateFournisseur: (id, data) => api.put(`/admin/fournisseurs/${id}`, data),
  deleteFournisseur: (id) => api.delete(`/admin/fournisseurs/${id}`),
}
