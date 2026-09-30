import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
  CalendarCheck, MapPin, Clock, CreditCard,
  XCircle, Eye, ChevronRight, Plane
} from 'lucide-react'
import { reservationService } from '@/services/api'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

const statutConfig = {
  confirmee: { cls: 'badge-success', labelKey: 'statusConfirmed' },
  en_attente: { cls: 'badge-accent', labelKey: 'statusPending' },
  annulee: { cls: 'badge-danger', labelKey: 'statusCancelled' },
  terminee: { cls: 'badge-muted', labelKey: 'statusCompleted' },
}

export default function MyReservations() {
  const [statut, setStatut] = useState('')
  const qc = useQueryClient()
  const { t, formatDate, formatCurrency } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['my-reservations', statut],
    queryFn: () => reservationService.getMyReservations({ statut }).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => reservationService.cancel(id, { motif: 'Annulée par le client' }),
    onSuccess: () => { toast.success(t('reservationCanceled') || 'Réservation annulée'); qc.invalidateQueries(['my-reservations']) },
    onError: () => toast.error(t('reservationCancelError') || 'Impossible d\'annuler cette réservation'),
  })

  const formatMAD = (v) => formatCurrency(v)

  const filteredReservations = data?.data || []

  const isReservationPaid = (res) => {
    const paidStatus = res.paiement?.statut === 'reussi'
    const fullyPaid = res.is_payee === true || res.is_payee === 'true' || Number(res.reste_a_payer) <= 0
    return paidStatus || fullyPaid
  }

  const confirmedUnpaidReservations = filteredReservations.filter((res) =>
    res.statut === 'confirmee' && !isReservationPaid(res)
  )
  const latestConfirmedUnpaid = confirmedUnpaidReservations[0]

  const renderReservation = (res, i) => {
    const cfg = statutConfig[res.statut] || {}
    return (
      <motion.div key={res.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.07 }}
        className="card-premium overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          {res.voyage?.image && (
            <div className="sm:w-44 h-32 sm:h-auto overflow-hidden flex-shrink-0">
              <img src={res.voyage.image} alt={res.voyage.titre}
                className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-lg">
                    {res.numero}
                  </code>
                  <span className={`badge ${cfg.cls}`}>{t(cfg.labelKey)}</span>
                </div>
                <h3 className="font-display font-bold text-secondary text-lg line-clamp-1">
                  {res.voyage?.titre || t('viewTrip')}
                </h3>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display font-bold text-primary text-xl">
                  {formatMAD(res.montant_total)}
                </div>
                <div className="text-xs text-muted">{res.nombre_places} place(s)</div>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-4">
              {res.voyage?.destination && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" />
                  {res.voyage.destination}
                </div>
              )}
              {res.voyage?.date_depart && (
                <div className="flex items-center gap-1.5">
                  <CalendarCheck size={13} className="text-primary" />
                  {formatDate(res.voyage.date_depart)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                {t('tripReservedOn')} {formatDate(res.created_at)}
              </div>
            </div>

            {/* Paiement status */}
            {res.paiement && res.statut !== 'annulee' && (
              <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg mb-4
              ${res.paiement.statut === 'reussi'
                  ? 'bg-success/10 text-success'
                  : 'bg-orange-50 text-orange-600'}`}>
                <CreditCard size={12} />
                {res.paiement.statut === 'reussi'
                  ? `${t('paidLabel')} — ${formatMAD(res.paiement.montant)}`
                  : t('paymentPending')}
              </div>
            )}

            {res.statut === 'en_attente' && (
              <div className="text-sm text-muted mb-4 rounded-xl bg-gray-50 p-3">
                {t('reservationPendingNotice')}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pay button if pending */}
              {res.statut === 'en_attente' && !res.is_payee && (
                <Link to={`/checkout/${res.id}`}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                  <CreditCard size={14} /> {t('payNow')}
                </Link>
              )}

              {res.statut === 'annulee' ? (
                <Link to={`/booking/${res.voyage?.id}`}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
                  <CreditCard size={14} /> {t('bookNow')}
                </Link>
              ) : (
                <Link to={`/voyages/${res.voyage?.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100
                  hover:bg-gray-200 text-secondary text-sm font-medium transition-colors">
                  <Eye size={14} /> Voir le voyage
                </Link>
              )}

              {res.statut === 'en_attente' && !res.is_payee && (
                <button
                  onClick={() => {
                    if (window.confirm(t('cancelReservationConfirm') || 'Annuler cette réservation ?')) {
                      cancelMutation.mutate(res.id)
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger/10
                  hover:bg-danger/20 text-danger text-sm font-medium transition-colors"
                >
                  <XCircle size={14} /> {t('cancelBooking')}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <h1 className="font-display text-3xl font-bold text-secondary mb-2">
            {t('bookingsHeader')}
          </h1>
          <p className="text-muted">{t('bookingsDescription')}</p>
        </motion.div>

        {/* Top alert when a confirmed reservation is waiting for payment */}
        {latestConfirmedUnpaid && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">{t('confirmedReservationNotice')} <span className="font-mono">{latestConfirmedUnpaid.numero}</span></p>
              <p className="text-sm text-emerald-700/80">{t('finalizePaymentNotice')}</p>
            </div>
            <Link
              to={`/checkout/${latestConfirmedUnpaid.id}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <CreditCard size={16} /> {t('payNow')}
            </Link>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ value: '', label: t('allStatuses') }, ...Object.entries(statutConfig).map(([v, { labelKey }]) => ({ value: v, label: t(labelKey) }))].map(({ value, label }) => (
            <button key={value} onClick={() => setStatut(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${statut === value
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-white border border-gray-200 text-muted hover:border-primary hover:text-primary'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Reservations */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card-premium p-16 text-center">
            <Plane size={48} className="text-muted mx-auto mb-4 opacity-40" />
            <h3 className="font-display text-xl font-bold text-secondary mb-2">
              {t('noBookings')}
            </h3>
            <p className="text-muted mb-6">
              {t('exploreTrips')}
            </p>
            <Link to="/voyages" className="btn-primary inline-flex">
              {t('discoverTrips')}
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card-premium p-16 text-center">
                <Plane size={48} className="text-muted mx-auto mb-4 opacity-40" />
                <h3 className="font-display text-xl font-bold text-secondary mb-2">
                  {t('noActiveBookings')}
                </h3>
                <p className="text-muted mb-6">
                  {t('exploreTrips')}
                </p>
                <Link to="/voyages" className="btn-primary inline-flex">
                  {t('discoverTrips')}
                </Link>
              </motion.div>
            ) : (
              filteredReservations.map(renderReservation)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

