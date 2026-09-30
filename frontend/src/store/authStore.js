import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const res = await authService.login(credentials)
          const { user, token } = res.data
          localStorage.setItem('token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true, user }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.message || 'Erreur de connexion.' }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authService.register(data)
          const { user, token } = res.data
          localStorage.setItem('token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          const errors = err.response?.data?.errors
          return { success: false, errors, error: err.response?.data?.message }
        }
      },

      logout: async () => {
        try { await authService.logout() } catch { }
        get().clearAuth()
      },

      updateUser: (user) => set({ user }),

      language: 'fr',
      setLanguage: (language) => set({ language }),

      fetchMe: async () => {
        try {
          const res = await authService.me()
          set({ user: res.data.user, isAuthenticated: true })
        } catch {
          get().clearAuth()
        }
      },

      // Role helpers
      isAdmin: () => get().user?.role === 'admin',
      isClient: () => get().user?.role === 'client',
      isFournisseur: () => get().user?.role === 'fournisseur',
      isSupport: () => get().user?.role === 'support',
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
    }
  )
)

export default useAuthStore
