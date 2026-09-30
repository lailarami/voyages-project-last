// src/pages/supplier/Voyages.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Star } from 'lucide-react'
import VoyageCard from '@/components/cards/VoyageCard'
import toast from 'react-hot-toast'
import { voyageService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

export default function SupplierVoyages() {
  const qc = useQueryClient()
  const { t, formatCurrency, formatDate } = useTranslation()
  const [availabilities, setAvailabilities] = useState({})
  const [updatingVoyageId, setUpdatingVoyageId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-my-voyages'],
    queryFn: () => voyageService.getSupplierVoyages({ per_page: 20 }).then((r) => r.data),
  })

  const availabilityMutation = useMutation({
    mutationFn: ({ id, places_disponibles }) => voyageService.updateSupplier(id, { places_disponibles }),
    onMutate: ({ id }) => { setUpdatingVoyageId(id) },
    onSuccess: () => {
      toast.success(t('supplierUpdateAvailability'))
      qc.invalidateQueries(['supplier-my-voyages'])
    },
    onError: () => toast.error(t('supplierInvalidPlaces')),
    onSettled: () => { setUpdatingVoyageId(null) },
  })

  const handleUpdateAvailability = (voyage) => {
    const places = Number(availabilities[voyage.id] ?? voyage.places_disponibles)
    if (isNaN(places) || places < 0) {
      toast.error(t('supplierInvalidPlaces'))
      return
    }
    availabilityMutation.mutate({ id: voyage.id, places_disponibles: places })
  }

  useEffect(() => {
    if (data?.data) {
      setAvailabilities(data.data.reduce((acc, voyage) => {
        acc[voyage.id] = voyage.places_disponibles
        return acc
      }, {}))
    }
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-secondary">{t('voyages')}</h1>
        <p className="text-muted text-sm mt-0.5">{data?.meta?.total || 0} {t('voyages')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data?.data?.map((v, i) => (
            <motion.div key={v.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <VoyageCard voyage={v} className="" />

              <div className="card-premium p-4 mt-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={availabilities[v.id] ?? v.places_disponibles}
                      onChange={(e) => setAvailabilities({ ...availabilities, [v.id]: e.target.value })}
                      className="input-premium w-24"
                    />
                    <button
                      disabled={updatingVoyageId === v.id}
                      onClick={() => handleUpdateAvailability(v)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {updatingVoyageId === v.id ? t('miseAJour') : t('supplierUpdateAvailability')}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className={`badge text-white ${v.is_disponible ? 'bg-success' : 'bg-danger'}`}>
                      {v.is_disponible ? t('supplierActive') : t('supplierInactive')}
                    </span>
                    <Link to={`/fournisseur/voyages/${v.id}`} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-medium transition-colors">
                      {t('view')}
                    </Link>
                  </div>
                </div>
                <div className="text-xs text-muted mt-3">{t('availableSeatsLabel')} / {t('totalSeatsLabel')} : {v.places_disponibles} / {v.places_totales}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && data?.data?.length === 0 && (
        <div className="card-premium p-14 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-display text-xl font-bold text-secondary mb-2">{t('supplierNoTrips')}</h3>
          <p className="text-muted">{t('supplierNoTripsDesc')}</p>
        </div>
      )}
    </div>
  )
}
