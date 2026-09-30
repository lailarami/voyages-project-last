import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Star, Heart, Clock, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { wishlistService } from '@/services/api'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

export default function VoyageCard({ voyage, className = '', wishlisted: wishlistedProp = false }) {
  const { isAuthenticated, isFournisseur, isSupport } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isDemoVoyage = typeof voyage.id === 'string' && voyage.id.startsWith('fake-')
  const [wishlisted, setWishlisted] = useState(() => isDemoVoyage ? false : wishlistedProp)
  const [imgError, setImgError] = useState(false)
  const LOCAL_WISHLIST_KEY = 'localWishlist'

  const getLocalWishlist = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_WISHLIST_KEY) || '[]')
    } catch {
      return []
    }
  }

  const saveLocalWishlist = (list) => {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(list))
  }

  useEffect(() => {
    if (isDemoVoyage) {
      const list = getLocalWishlist()
      setWishlisted(list.includes(voyage.id))
    } else {
      setWishlisted(wishlistedProp)
    }
  }, [isDemoVoyage, voyage.id, wishlistedProp])

  const toggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter aux favoris')
      navigate('/login', { state: { from: location } })
      return
    }

    if (isDemoVoyage) {
      const list = getLocalWishlist()
      const next = wishlisted ? list.filter(item => item !== voyage.id) : [...list, voyage.id]
      saveLocalWishlist(next)
      window.dispatchEvent(new Event('localWishlistUpdated'))
      const newWishlisted = !wishlisted
      setWishlisted(newWishlisted)
      toast.success(newWishlisted ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris')
      return
    }

    try {
      await wishlistService.toggle(voyage.id)
      queryClient.invalidateQueries(['wishlist'])
      const newWishlisted = !wishlisted
      setWishlisted(newWishlisted)
      toast.success(newWishlisted ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris')
    } catch {
      toast.error('Erreur lors de l’ajout aux favoris')
    }
  }

  const fallbackImg = `https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80`
  const imageSources = [voyage.image, ...(Array.isArray(voyage.images_gallery) ? voyage.images_gallery : [])].filter(Boolean)
  const imgSrc = imgError || imageSources.length === 0 ? fallbackImg : imageSources[0]

  const formatPrice = (p) => {
    if (!p || isNaN(p)) return '—'
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: voyage.devise || 'MAD', maximumFractionDigits: 0 }).format(p)
  }

  const voyageLink = location.pathname.startsWith('/fournisseur') ? `/fournisseur/voyages/${voyage.id}` : `/voyages/${voyage.id}`

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`card-premium group overflow-hidden ${className}`}
    >
      <Link to={voyageLink}>
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={imgSrc}
            alt={voyage.titre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {voyage.featured && (
              <span className="badge bg-accent text-white text-xs px-2.5 py-1 rounded-lg font-medium">⭐ Vedette</span>
            )}
            {voyage.reduction > 0 && (
              <span className="badge bg-danger text-white text-xs px-2.5 py-1 rounded-lg font-medium">-{voyage.reduction}%</span>
            )}
            <span className="badge bg-white/90 text-secondary text-xs px-2.5 py-1 rounded-lg font-medium capitalize">
              {voyage.categorie}
            </span>
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={toggleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${wishlisted ? 'bg-danger text-white' : 'bg-white/90 text-muted hover:bg-white hover:text-danger'}`}
          >
            <Heart size={15} className={wishlisted ? 'fill-current' : ''} />
          </button>

          {/* Duration badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <Clock size={12} className="text-white/80" />
            <span className="text-white text-xs font-medium">{voyage.duree} jours</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted text-xs mb-2">
            <MapPin size={12} />
            <span>{voyage.destination}{voyage.pays ? `, ${voyage.pays}` : ''}</span>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-secondary text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {voyage.titre}
          </h3>

          {/* Info row */}
          <div className="flex items-center gap-3 text-muted text-xs mb-4">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(voyage.date_depart).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{voyage.places_disponibles} places</span>
            </div>
            {voyage.nombre_avis > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span>{voyage.moyenne_notes} ({voyage.nombre_avis})</span>
                </div>
              </>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {voyage.prix_ancien && voyage.prix_ancien > voyage.prix_final && (
                <div className="text-muted text-xs line-through">{formatPrice(voyage.prix_ancien)}</div>
              )}
              <div className="font-display font-bold text-primary text-xl">
                {formatPrice(voyage.prix_final)}
              </div>
              <div className="text-muted text-xs">par personne</div>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-semibold px-3 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
              {(isFournisseur?.() || isSupport?.()) ? (
                <>{t('view')} <ArrowRight size={14} /></>
              ) : (
                <>Réserver <ArrowRight size={14} /></>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
