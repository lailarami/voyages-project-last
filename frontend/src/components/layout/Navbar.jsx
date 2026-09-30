import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, Search, Heart, Bell, User, LogOut, Menu, X,
  LayoutDashboard, CalendarCheck, MessageSquare, ChevronDown, RefreshCw, Star
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setUserMenu(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    toast.success('À bientôt !')
    navigate('/')
  }

  const dashboardUrl =
    user?.role === 'admin' ? '/admin' :
      user?.role === 'fournisseur' ? '/fournisseur' :
        user?.role === 'support' ? '/support' : '/'

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft border-b border-gray-100'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 15 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${scrolled ? 'bg-primary' : 'bg-white/20 backdrop-blur'
                  }`}
              >
                <Plane size={18} className="text-white" />
              </motion.div>
              <span className={`font-display text-xl font-bold transition-colors ${scrolled ? 'text-secondary' : 'text-white'
                }`}>
                Voyages<span className="text-accent">MA</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {[
                { to: '/', label: t('accueil'), exact: true },
                { to: '/voyages', label: t('voyages') },
              ].map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `relative font-medium text-sm transition-colors duration-200 pb-1
                     after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary
                     after:transition-all after:duration-300
                     ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
                     ${scrolled
                      ? isActive ? 'text-primary' : 'text-secondary/70 hover:text-primary'
                      : isActive ? 'text-white' : 'text-white/80 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search button */}
              <button
                onClick={() => navigate('/voyages')}
                className={`p-2.5 rounded-xl transition-colors ${scrolled
                  ? 'hover:bg-gray-100 text-muted hover:text-primary'
                  : 'hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
              >
                <Search size={18} />
              </button>

              <button
                onClick={() => window.location.reload()}
                className={`p-2.5 rounded-xl transition-colors ${scrolled
                  ? 'hover:bg-gray-100 text-muted hover:text-primary'
                  : 'hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
              >
                <RefreshCw size={18} />
              </button>

              {isAuthenticated ? (
                <>
                  {/* Wishlist */}
                  <Link
                    to="/wishlist"
                    className={`p-2.5 rounded-xl transition-colors ${scrolled
                      ? 'hover:bg-gray-100 text-muted hover:text-danger'
                      : 'hover:bg-white/20 text-white/80 hover:text-white'
                      }`}
                  >
                    <Heart size={18} />
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenu(!userMenu)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${scrolled
                        ? 'hover:bg-gray-100 text-secondary'
                        : 'hover:bg-white/20 text-white'
                        }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                      </div>
                      <span className="text-sm font-medium max-w-20 truncate">{user?.prenom}</span>
                      <ChevronDown size={14} className={`transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          onMouseLeave={() => setUserMenu(false)}
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-hard border border-gray-100 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="font-semibold text-secondary text-sm">{user?.prenom} {user?.nom}</div>
                            <div className="text-muted text-xs truncate">{user?.email}</div>
                          </div>
                          <div className="py-1">
                            {user?.role !== 'client' && (
                              <Link to={dashboardUrl} onClick={() => setUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 transition-colors">
                                <LayoutDashboard size={15} className="text-primary" />
                                {t('dashboard')}
                              </Link>
                            )}
                            <Link to="/mes-reservations" onClick={() => setUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 transition-colors">
                              <CalendarCheck size={15} className="text-primary" />
                              {t('mesReservations')}
                            </Link>
                            <Link to="/avis" onClick={() => setUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 transition-colors">
                              <Star size={15} className="text-primary" />
                              {t('avis')}
                            </Link>
                            <Link to="/tickets" onClick={() => setUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 transition-colors">
                              <MessageSquare size={15} className="text-primary" />
                              {t('supportTitle')}
                            </Link>
                            <Link to="/profil" onClick={() => setUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-gray-50 transition-colors">
                              <User size={15} className="text-primary" />
                              {t('profil')}
                            </Link>
                          </div>
                          <div className="border-t border-gray-100 py-1">
                            <button
                              onClick={() => { setUserMenu(false); handleLogout() }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={15} />
                              {t('deconnexion')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${scrolled
                      ? 'text-secondary hover:text-primary hover:bg-gray-100'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {t('connexion')}
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm px-5 py-2.5"
                  >
                    {t('inscription')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${scrolled ? 'text-secondary hover:bg-gray-100' : 'text-white hover:bg-white/20'
                }`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-hard"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <span className="font-display text-xl font-bold text-secondary">
                  Voyages<span className="text-primary">MA</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                {[
                  { to: '/', label: t('accueil') },
                  { to: '/voyages', label: t('voyages') },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 text-secondary font-medium">
                    {label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <Link to="/mes-reservations" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-secondary font-medium">
                      <CalendarCheck size={16} className="text-primary" /> {t('mesReservations')}
                    </Link>
                    <Link to="/avis" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-secondary font-medium">
                      <Star size={16} className="text-primary" /> {t('avis')}
                    </Link>
                    <Link to="/wishlist" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-secondary font-medium">
                      <Heart size={16} className="text-primary" /> {t('wishlist')}
                    </Link>
                    <Link to="/profil" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-secondary font-medium">
                      <User size={16} className="text-primary" /> {t('profil')}
                    </Link>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <button onClick={() => { setMobileOpen(false); handleLogout() }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-danger font-medium">
                    <LogOut size={16} /> {t('deconnexion')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="block text-center w-full py-3 rounded-xl border-2 border-primary text-primary font-medium">
                      {t('connexion')}
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      className="block text-center w-full btn-primary py-3">
                      {t('inscription')}
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
