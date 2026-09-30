import { useEffect, useState } from 'react'
import { Link, Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Plane, Home, Map, CalendarCheck, Star, Heart, MessageSquare, User,
  LogOut, LogIn, UserPlus
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'
import Footer from '@/components/layout/Footer'

const clientNav = [
  { to: '/', label: 'Accueil', icon: Home, exact: true },
  { to: '/voyages', label: 'Voyages', icon: Map },
]

const authNav = [
  { to: '/mes-reservations', label: 'Mes réservations', icon: CalendarCheck },
  { to: '/avis', label: 'Avis', icon: Star },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/tickets', label: 'Tickets', icon: MessageSquare },
  { to: '/profil', label: 'Profil', icon: User },
]

export default function ClientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { t, language, dir, setLanguage } = useTranslation()

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
  }

  const clientNav = [
    { to: '/', label: t('accueil'), icon: Home, exact: true },
    { to: '/voyages', label: t('voyages'), icon: Map },
  ]

  const authNav = [
    { to: '/mes-reservations', label: t('mesReservations'), icon: CalendarCheck },
    { to: '/avis', label: t('avis'), icon: Star },
    { to: '/wishlist', label: t('wishlist'), icon: Heart },
    { to: '/tickets', label: t('tickets'), icon: MessageSquare },
    { to: '/profil', label: t('profil'), icon: User },
  ]

  useEffect(() => {
    document.documentElement.lang = language || 'fr'
    document.documentElement.dir = dir
  }, [language, dir])

  const SidebarLink = ({ to, label, icon: Icon, exact }) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-slate-200 hover:bg-white/10 hover:text-white'
        }`
      }
      onClick={() => setMobileOpen(false)}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  )

  return (
    <div className="min-h-screen flex bg-bg text-secondary">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#08102c] text-white shadow-sm sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white">
              <Plane size={18} />
            </div>
            <div>
              <div className="font-semibold text-lg text-white">VoyagesMA</div>
              <div className="text-xs text-slate-300">{t('navigation')}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {clientNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          {isAuthenticated && (
            <>
              <div className="mt-4 mb-1 px-4 text-xs uppercase tracking-[0.16em] text-slate-400">Mon espace</div>
              {authNav.map((item) => (
                <SidebarLink key={item.to} {...item} />
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                {['fr', 'en', 'ar'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${language === code ? 'bg-primary text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{user?.prenom} {user?.nom}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} /> {t('deconnexion')}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <NavLink
                to="/login"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
              >
                <LogIn size={16} /> {t('connexion')}
              </NavLink>
              <NavLink
                to="/register"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <UserPlus size={16} /> {t('inscription')}
              </NavLink>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 lg:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white">
              <Plane size={18} />
            </div>
            <div>
              <div className="font-semibold text-base text-slate-900">VoyagesMA</div>
              <div className="text-xs text-slate-500">{t('navigation')}</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {user?.role === 'admin' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-5 py-4 rounded-b-3xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-medium">Vous êtes connecté en tant qu’admin</div>
              <div className="text-sm text-yellow-700/80">Vous pouvez continuer à utiliser l’espace client tout en gardant la possibilité de revenir à l’administration.</div>
            </div>
            <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 transition-colors">
              Retour administration
            </Link>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex-1"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        <Footer />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#08102c] text-white shadow-xl z-50 flex flex-col"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white">
                    <Plane size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-base text-slate-900">VoyagesMA</div>
                    <div className="text-xs text-slate-500">{t('navigation')}</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {clientNav.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
                {isAuthenticated && (
                  <>
                    <div className="mt-4 mb-1 px-4 text-xs uppercase tracking-[0.16em] text-slate-400">{t('monEspace')}</div>
                    {authNav.map((item) => (
                      <SidebarLink key={item.to} {...item} />
                    ))}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['fr', 'en', 'ar'].map((code) => (
                        <button
                          key={code}
                          onClick={() => setLanguage(code)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${language === code ? 'bg-primary text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          {code.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={16} /> {t('deconnexion')}
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <NavLink
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
                    >
                      <LogIn size={16} /> {t('connexion')}
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <UserPlus size={16} /> {t('inscription')}
                    </NavLink>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
