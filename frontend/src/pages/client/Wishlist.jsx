// src/pages/client/Wishlist.jsx
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import useTranslation from '@/hooks/useTranslation'
import { wishlistService } from '@/services/api'
import { FAKE_VOYAGES } from '@/data/fakeVoyages'
import VoyageCard from '@/components/cards/VoyageCard'
import useAuthStore from '@/store/authStore'

const LOCAL_WISHLIST_KEY = 'localWishlist'

const getLocalWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_WISHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

export function Wishlist() {
  const { t } = useTranslation()
  const [localWishlistIds, setLocalWishlistIds] = useState(getLocalWishlist())
  const localWishlistVoyages = localWishlistIds
    .map((id) => FAKE_VOYAGES.find((voyage) => voyage.id === id))
    .filter(Boolean)

  const { isAuthenticated } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getAll().then(r => r.data.data).catch(() => []),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    const handleLocalWishlistUpdate = () => setLocalWishlistIds(getLocalWishlist())
    window.addEventListener('localWishlistUpdated', handleLocalWishlistUpdate)
    return () => window.removeEventListener('localWishlistUpdated', handleLocalWishlistUpdate)
  }, [])

  const wishlistItems = useMemo(() => {
    if (isAuthenticated) {
      const remoteItems = data || []
      return remoteItems
        .map((item) => item.voyage)
        .filter(Boolean) // Remove null/undefined voyages
    }

    return localWishlistVoyages
  }, [data, localWishlistVoyages, isAuthenticated])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={28} className="text-danger fill-danger" />
          <h1 className="font-display text-3xl font-bold text-secondary">{t('myWishlist')}</h1>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <Heart size={48} className="text-muted mx-auto mb-4 opacity-30" />
            <h3 className="font-display text-xl font-bold text-secondary mb-2">{t('emptyWishlist')}</h3>
            <p className="text-muted">{t('addTripsToWishlist')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((voyage, i) => (
              <motion.div key={voyage.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}>
                <VoyageCard voyage={voyage} wishlisted={true} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist

