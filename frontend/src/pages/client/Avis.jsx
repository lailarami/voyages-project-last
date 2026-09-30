import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Star, Plane, CheckCircle } from 'lucide-react'
import useTranslation from '@/hooks/useTranslation'
import { avisService, reservationService } from '@/services/api'
import toast from 'react-hot-toast'

export default function Avis() {
  const [selectedReservationId, setSelectedReservationId] = useState(null)
  const [note, setNote] = useState(5)
  const [titre, setTitre] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-reservations', 'avis'],
    queryFn: () => reservationService.getMyReservations().then((res) => res.data),
  })

  const reservations = data?.data || []
  const voyageOptions = reservations.filter((res) => res.voyage)
  const selectedReservation = voyageOptions.find((res) => res.id === selectedReservationId) || null

  const submitMutation = useMutation({
    mutationFn: (payload) => avisService.create(payload),
    onSuccess: () => {
      toast.success('Avis soumis. En attente de modération.')
      setNote(5)
      setTitre('')
      setCommentaire('')
      qc.invalidateQueries(['my-reservations', 'avis'])
    },
    onError: (error) => {
      const message = error?.response?.data?.message ||
        error?.response?.data?.errors?.commentaire?.[0] ||
        'Impossible de soumettre votre avis.'
      toast.error(message)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()

    submitMutation.mutate({
      voyage_id: selectedReservation?.voyage?.id,
      note,
      titre,
      commentaire,
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-secondary mb-2">{t('customerReviews')}</h1>
              <p className="text-muted max-w-2xl">
                {t('reviewHeader')}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-secondary">
              <CheckCircle size={16} className="text-success" />
              {t('reviewModerationNote')}
            </div>
          </div>
        </motion.div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="skeleton h-28 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="card-premium p-6">
                <h2 className="font-display text-xl font-bold text-secondary mb-4">{t('reviewHeader')}</h2>
                {voyageOptions.length > 0 ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReservationId(null)}
                      className={`w-full text-left rounded-3xl border p-4 transition-all ${selectedReservation === null
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-gray-200 bg-white hover:border-primary/70'
                        }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-secondary">{t('generalReviewTitle')}</div>
                          <div className="text-xs text-muted mt-1">{t('generalReviewDesc')}</div>
                        </div>
                        <div className="text-sm badge badge-accent">{t('general')}</div>
                      </div>
                    </button>
                    {voyageOptions.map((reservation) => (
                      <button
                        key={reservation.id}
                        type="button"
                        onClick={() => setSelectedReservationId(reservation.id)}
                        className={`w-full text-left rounded-3xl border p-4 transition-all ${selectedReservation?.id === reservation.id
                            ? 'border-primary bg-primary/5 shadow-soft'
                            : 'border-gray-200 bg-white hover:border-primary/70'
                          }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-secondary">{reservation.voyage.titre}</div>
                            <div className="text-xs text-muted mt-1">{t('tripReservedOn')} {reservation.created_at}</div>
                          </div>
                          <div className="text-sm badge badge-primary">{reservation.statut}</div>
                        </div>
                        <div className="mt-3 text-sm text-muted line-clamp-2">
                          {reservation.voyage.destination || 'Destination indisponible'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
                    <p className="font-medium text-secondary mb-2">{t('reviewFree')}</p>
                    <p className="text-sm text-muted">
                      {t('reviewFreeDesc')}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="card-premium p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-secondary">{t('reviewHeader')}</h2>
                      <p className="text-muted text-sm">{t('reviewSubheader')}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">{t('note')}</span>
                    {[...Array(5)].map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setNote(index + 1)}
                        className="rounded-full p-2 transition-colors hover:bg-gray-100"
                      >
                        <Star size={24}
                          className={index < note ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">{t('reviewTitle')}</label>
                    <input
                      value={titre}
                      onChange={(event) => setTitre(event.target.value)}
                      placeholder="Ex. Super expérience"
                      className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-secondary outline-none transition focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">{t('reviewComment')}</label>
                    <textarea
                      value={commentaire}
                      onChange={(event) => setCommentaire(event.target.value)}
                      placeholder={t('reviewPlaceholder')}
                      rows={6}
                      className="w-full rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-secondary outline-none transition focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted">
                      {t('reviewModerationNote')}
                    </div>
                    <button
                      type="submit"
                      disabled={submitMutation.isLoading}
                      className="btn-primary w-full sm:w-auto px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitMutation.isLoading ? t('processing') : t('submitReview')}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="card-premium p-6 bg-primary/5 border border-primary/20">
                <h2 className="font-display text-xl font-bold text-secondary mb-3">{t('reviewTips')}</h2>
                <ul className="space-y-3 text-sm text-muted">
                  <li>{t('reviewTip1')}</li>
                  <li>{t('reviewTip2')}</li>
                  <li>{t('reviewTip3')}</li>
                  <li>{t('reviewTip4')}</li>
                </ul>
              </div>

              {selectedReservation && (
                <div className="card-premium p-6">
                  <h2 className="font-display text-xl font-bold text-secondary mb-4">{t('selectedTrip')}</h2>
                  <div className="space-y-4">
                    <div className="text-sm text-muted">{selectedReservation.voyage.destination}</div>
                    <div className="text-lg font-semibold text-secondary">{selectedReservation.voyage.titre}</div>
                    <div className="rounded-3xl border border-gray-200 p-4 bg-white">
                      <div className="text-sm text-muted mb-2">{t('bookingStatus')}</div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${selectedReservation.statut === 'confirmee' ? 'badge-success' : 'badge-accent'}`}>
                          {selectedReservation.statut}
                        </span>
                        <span className="text-xs text-muted">{t('tripReservedOn')} {selectedReservation.created_at}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

