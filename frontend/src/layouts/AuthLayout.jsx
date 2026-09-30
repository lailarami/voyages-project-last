import { Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const { language, setLanguage, dir } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = language || 'fr'
    document.documentElement.dir = dir
  }, [language, dir])

  if (isAuthenticated) {
    const redirectMap = {
      admin: '/admin',
      fournisseur: '/fournisseur',
      support: '/support',
      client: '/',
    }
    return <Navigate to={redirectMap[user?.role] || '/'} replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-hero">
        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary/40 to-accent/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Plane size={20} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold">Voyages<span className="text-accent">MA</span></span>
          </Link>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-4xl font-bold leading-tight">
                Découvrez le Maroc<br />
                <span className="text-accent">comme jamais</span>
              </h2>
              <p className="text-white/70 mt-4 text-lg leading-relaxed">
                Des voyages organisés d'exception à travers les plus belles destinations du royaume.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { value: '500+', label: 'Voyages' },
                { value: '12K+', label: 'Clients' },
                { value: '4.9★', label: 'Note' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="font-display text-2xl font-bold text-white">{value}</div>
                  <div className="text-white/60 text-sm">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-white/40 text-sm">© 2025 VoyagesMA. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Plane size={20} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-secondary">
              Voyages<span className="text-primary">MA</span>
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 justify-end">
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

          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
