import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function RoleRoute({ roles = [] }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!roles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    const redirectMap = {
      admin: '/admin',
      fournisseur: '/fournisseur',
      support: '/support',
      client: '/',
    }
    return <Navigate to={redirectMap[user?.role] || '/'} replace />
  }

  return <Outlet />
}
