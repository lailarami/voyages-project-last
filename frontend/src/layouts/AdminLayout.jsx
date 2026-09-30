import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Users, CalendarCheck, CreditCard,
  BarChart3, Star, Truck, Headphones, LogOut, Menu, X,
  ChevronRight, Settings, Plane, RefreshCw
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const adminNav = [
  { to: '/admin', labelKey: 'dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/voyages', labelKey: 'voyages', icon: Map },
  { to: '/admin/reservations', labelKey: 'mesReservations', icon: CalendarCheck },
  { to: '/admin/users', labelKey: 'users', icon: Users },
  { to: '/admin/paiements', labelKey: 'payments', icon: CreditCard },
  { to: '/admin/analytics', labelKey: 'analytics', icon: BarChart3 },
  { to: '/admin/avis', labelKey: 'reviews', icon: Star },
  { to: '/admin/fournisseurs', labelKey: 'suppliers', icon: Truck },
  { to: '/admin/tickets', labelKey: 'supportTickets', icon: Headphones },
]

const supplierNav = [
  { to: '/fournisseur', labelKey: 'dashboard', icon: LayoutDashboard, exact: true },
  { to: '/fournisseur/voyages', labelKey: 'voyages', icon: Map },
  { to: '/fournisseur/reservations', labelKey: 'mesReservations', icon: CalendarCheck },
]

const supportNav = [
  { to: '/support', labelKey: 'supportDashboard', icon: Headphones, exact: true },
  { to: '/support/tickets', labelKey: 'tickets', icon: Headphones },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { language, dir, t, setLanguage } = useTranslation()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'admin' ? adminNav :
      user?.role === 'fournisseur' ? supplierNav : supportNav

  const handleLogout = async () => {
    await logout()
    toast.success(t('logoutSuccess'))
    navigate('/login')
  }

  useEffect(() => {
    document.documentElement.lang = language || 'fr'
    document.documentElement.dir = dir
  }, [language, dir])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Plane size={18} className="text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="font-display font-bold text-white text-lg leading-none">Voyages</div>
            <div className="text-white/40 text-xs capitalize">{user?.role}</div>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, labelKey, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
               ${isActive
                ? 'bg-primary text-white shadow-glow'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium flex-1"
                  >
                    {t(labelKey)}
                  </motion.span>
                )}
                {!collapsed && isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10 space-y-3">
        {!collapsed && (
          <div className="flex flex-wrap gap-2">
            {['fr', 'en', 'ar'].map((code) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${language === code ? 'bg-white text-secondary' : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <NavLink
          to={user?.role === 'admin' ? '/admin/profile' : user?.role === 'fournisseur' ? '/fournisseur/profil' : '/profil'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">{user?.role === 'admin' ? t('profile') : t('myProfile')}</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">{t('logout')}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-secondary flex-shrink-0 overflow-hidden relative"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 -right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform"
        >
          <ChevronRight size={12} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-secondary z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-lg font-semibold text-secondary">
              {user?.role === 'admin' ? t('adminArea') : user?.role === 'fournisseur' ? t('supplierArea') : t('supportArea')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Link to="/" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                <Plane size={16} /> Voir site public
              </Link>
            )}
            <button
              onClick={() => window.location.reload()}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={20} className="text-muted" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
