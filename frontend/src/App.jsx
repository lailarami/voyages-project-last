import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'

import useAuthStore from '@/store/authStore'
import PageLoader from '@/components/ui/PageLoader'
import ClientLayout from '@/layouts/ClientLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'
import PrivateRoute from '@/routes/PrivateRoute'
import RoleRoute from '@/routes/RoleRoute'

// Lazy pages — Client
const Home = lazy(() => import('@/pages/client/Home'))
const VoyageSearch = lazy(() => import('@/pages/client/VoyageSearch'))
const VoyageDetail = lazy(() => import('@/pages/client/VoyageDetail'))
const Booking = lazy(() => import('@/pages/client/Booking'))
const Checkout = lazy(() => import('@/pages/client/Checkout'))
const MyReservations = lazy(() => import('@/pages/client/MyReservations'))
const Wishlist = lazy(() => import('@/pages/client/Wishlist'))
const MyTickets = lazy(() => import('@/pages/client/MyTickets'))
const Profile = lazy(() => import('@/pages/client/Profile'))
const AvisPage = lazy(() => import('@/pages/client/Avis'))

// Auth
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminVoyages = lazy(() => import('@/pages/admin/Voyages'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminReservations = lazy(() => import('@/pages/admin/Reservations'))
const AdminPaiements = lazy(() => import('@/pages/admin/Paiements'))
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'))
const AdminAvis = lazy(() => import('@/pages/admin/Avis'))
const AdminFournisseurs = lazy(() => import('@/pages/admin/Fournisseurs'))
const AdminTickets = lazy(() => import('@/pages/admin/Tickets'))

// Support
const SupportDashboard = lazy(() => import('@/pages/support/Dashboard'))

// Fournisseur
const SupplierDashboard = lazy(() => import('@/pages/supplier/Dashboard'))
const SupplierVoyages = lazy(() => import('@/pages/supplier/Voyages'))
const SupplierVoyageDetail = lazy(() => import('@/pages/supplier/VoyageDetail'))
const SupplierVoyageForm = lazy(() => import('@/pages/supplier/VoyageForm'))
const SupplierReservations = lazy(() => import('@/pages/supplier/Reservations'))
const SupplierProfile = lazy(() => import('@/pages/supplier/Profile'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // No caching - always fetch fresh data
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('token')) {
      fetchMe()
    }
  }, [fetchMe, isAuthenticated])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ===================== CLIENT ===================== */}
              <Route element={<ClientLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/voyages" element={<VoyageSearch />} />
                <Route path="/voyages/:id" element={<VoyageDetail />} />

                <Route element={<PrivateRoute />}>
                  <Route path="/booking/:id" element={<Booking />} />
                  <Route path="/checkout/:id" element={<Checkout />} />
                  <Route path="/mes-reservations" element={<MyReservations />} />
                  <Route path="/avis" element={<AvisPage />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/tickets" element={<MyTickets />} />
                  <Route path="/profil" element={<Profile />} />
                </Route>
              </Route>

              {/* ===================== AUTH ===================== */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* ===================== ADMIN ===================== */}
              <Route path="/admin" element={<RoleRoute roles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="voyages" element={<AdminVoyages />} />
                  <Route path="reservations" element={<AdminReservations />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="paiements" element={<AdminPaiements />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="avis" element={<AdminAvis />} />
                  <Route path="fournisseurs" element={<AdminFournisseurs />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* ===================== SUPPORT ===================== */}
              <Route path="/support" element={<RoleRoute roles={['support', 'admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<SupportDashboard />} />
                  <Route path="tickets" element={<AdminTickets />} />
                </Route>
              </Route>

              {/* ===================== FOURNISSEUR ===================== */}
              <Route path="/fournisseur" element={<RoleRoute roles={['fournisseur', 'admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<SupplierDashboard />} />
                  <Route path="voyages" element={<SupplierVoyages />} />
                  <Route path="voyages/nouveau" element={<SupplierVoyageForm />} />
                  <Route path="voyages/:id" element={<SupplierVoyageDetail />} />
                  <Route path="voyages/:id/edit" element={<SupplierVoyageForm />} />
                  <Route path="reservations" element={<SupplierReservations />} />
                  <Route path="profil" element={<SupplierProfile />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
