// ============================================================
// src/pages/client/Booking.jsx
// ============================================================
import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Users, FileText, Loader2, MapPin, Calendar } from 'lucide-react'
import { voyageService, reservationService } from '@/services/api'
import { getFakeVoyageById } from '@/data/fakeVoyages'
import toast from 'react-hot-toast'

export function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [places, setPlaces] = useState(1)
  const [demoSuccess, setDemoSuccess] = useState(false)
  const fakeVoyage = getFakeVoyageById(id)
  const isDemoVoyage = Boolean(fakeVoyage && id?.startsWith('fake-'))

  const { data: voyage, isLoading, isError } = useQuery({
    queryKey: ['voyage', id],
    queryFn: async () => {
      if (fakeVoyage) return fakeVoyage
      const res = await voyageService.getById(id)
      return res.data.data
    },
    retry: false,
  })

  const { register, handleSubmit } = useForm()

  const mutation = useMutation({
    mutationFn: (data) => reservationService.create(data),
    onSuccess: (res) => {
      toast.success('Réservation créée ! Procédez au paiement.')
      navigate(`/checkout/${res.data.data.id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  })

  const onSubmit = (data) => {
    if (isDemoVoyage) {
      setDemoSuccess(true)
      toast.success('Réservation de démonstration confirmée !')
      return
    }

    mutation.mutate({ voyage_id: id, nombre_places: places, notes: data.notes })
  }

  const formatMAD = (v) => new Intl.NumberFormat('fr-MA').format(v) + ' MAD'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="skeleton h-12 w-48 rounded-2xl mb-8" />
          <div className="skeleton h-72 rounded-3xl mb-6" />
          <div className="skeleton h-20 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (isError && !fakeVoyage) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-secondary mb-4">Impossible de charger le voyage</h1>
          <p className="text-muted mb-8">La connexion au serveur est indisponible ou l’ID du voyage est invalide.</p>
          <button onClick={() => navigate('/voyages')} className="btn-primary px-6 py-3">
            Retour aux voyages
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted hover:text-primary mb-8 text-sm">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="font-display text-3xl font-bold text-secondary mb-8">Réserver ce voyage</h1>

        {voyage && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6 mb-6">
            <h2 className="font-display font-bold text-xl text-secondary mb-2">{voyage.titre}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
              <span className="flex items-center gap-1.5"><MapPin size={13} />{voyage.destination}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} />{new Date(voyage.date_depart).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="text-2xl font-display font-bold text-primary">{formatMAD(voyage.prix_final)} <span className="text-sm text-muted font-normal">/ personne</span></div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card-premium p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              <Users size={15} className="inline mr-1.5" />Nombre de places
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPlaces(Math.max(1, places - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors">−</button>
              <span className="w-12 text-center font-semibold text-secondary text-lg">{places}</span>
              <button type="button" onClick={() => setPlaces(Math.min(voyage?.places_disponibles || 10, places + 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors">+</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              <FileText size={15} className="inline mr-1.5" />Notes (optionnel)
            </label>
            <textarea {...register('notes')} rows={3} placeholder="Demandes spéciales, régimes alimentaires, etc."
              className="input-premium resize-none" />
          </div>

          {voyage && (
            <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center">
              <span className="font-medium text-secondary">Total ({places} place{places > 1 ? 's' : ''})</span>
              <span className="font-display text-2xl font-bold text-primary">
                {formatMAD(voyage.prix_final * places)}
              </span>
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600">
            {mutation.isPending ? <><Loader2 size={20} className="animate-spin" /> Création…</> : 'Confirmer la réservation'}
          </button>

          {demoSuccess && (
            <div className="text-sm text-success mt-2">
              Réservation de démonstration confirmée ! Vous pouvez revenir aux voyages.
            </div>
          )}

          {isDemoVoyage && (
            <div className="text-sm text-muted mt-2">
              Ce voyage est un exemple de démonstration locale. La réservation suit un parcours simulé.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Booking

