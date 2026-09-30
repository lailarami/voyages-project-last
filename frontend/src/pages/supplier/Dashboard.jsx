// src/pages/supplier/Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, CalendarCheck, TrendingUp, Star, AlertTriangle } from 'lucide-react'
import { reservationService, supplierService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

const statusLabels = {
  en_attente: 'statusPending',
  confirmee: 'statusConfirmed',
  annulee: 'statusCancelled',
  terminee: 'statusCompleted',
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isPendingOlderThan24h = (reservation) => {
  if (reservation?.statut !== 'en_attente' || !reservation?.created_at) return false
  const createdAt = new Date(reservation.created_at)
  if (Number.isNaN(createdAt.getTime())) return false
  return Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000
}

export function SupplierDashboard() {
  const { t, formatCurrency, formatDate } = useTranslation()
  const { data } = useQuery({
    queryKey: ['supplier-dashboard'],
    queryFn: () => supplierService.dashboard().then((r) => r.data.data),
  })

  const { data: reservationData, isLoading: reservationsLoading } = useQuery({
    queryKey: ['supplier-recent-reservations'],
    queryFn: () => reservationService.getSupplierReservations({ per_page: 5 }).then((r) => r.data),
  })

  const recentReservations = reservationData?.data ?? []
  const pendingOlderReservations = recentReservations.filter(isPendingOlderThan24h)

  const stats = [
    { label: t('voyages'), value: data?.stats?.voyages ?? 0, icon: Map, color: 'bg-primary' },
    { label: t('mesReservations'), value: data?.stats?.reservations ?? 0, icon: CalendarCheck, color: 'bg-success' },
    { label: t('revenue'), value: formatCurrency(data?.stats?.revenu ?? 0), icon: TrendingUp, color: 'bg-accent' },
    { label: t('averageRating'), value: data?.stats?.moyenne_notes !== undefined ? Number(data?.stats?.moyenne_notes).toFixed(1) : '—', icon: Star, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('supplierArea')}</h1>
          <p className="text-sm text-muted">{t('supplierDashboardSubtitle')}</p>
        </div>
        <Link
          to="/fournisseur/reservations"
          className="btn-primary h-11 px-4 py-2 self-start text-sm"
        >{t('supplierSeeAllReservations')}</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="card-premium p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-secondary mb-2">{t('mesReservations')}</h2>
              <p className="text-5xl font-bold text-primary">{data?.stats?.reservations ?? 0}</p>
              <p className="text-muted mt-2">{t('supplierReservationsSummary')}</p>
            </div>
            <Link
              to="/fournisseur/reservations"
              className="btn-primary h-11 px-4 py-2 self-center text-sm"
            >Voir les réservations</Link>
          </div>
        </div>

        <div className="card-premium p-6 border border-dashed border-gray-200">
          <h2 className="font-display text-xl font-bold text-secondary mb-3">{t('supplierQuickAccess')}</h2>
          <p className="text-muted text-sm">
            {t('supplierDashboardSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="card-premium p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="font-display text-2xl font-bold text-secondary">{value}</div>
            <div className="text-muted text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-secondary">{t('supplierRecentReservations')}</h2>
            <p className="text-muted text-sm">{t('supplierReservationsSummary')}</p>
          </div>
        </div>

        {pendingOlderReservations.length > 0 && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} />
                <p className="font-semibold">{t('supplierPendingOlder').replace('{count}', String(pendingOlderReservations.length))}</p>
              </div>
              <p className="text-sm text-red-700/80">{t('supplierPendingOlderDesc')}</p>
            </div>
          </div>
        )}

        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t('tableNumber'), t('client'), t('trip'), t('seats'), t('amount'), t('status'), t('date')].map((header) => (
                    <th key={header} className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservationsLoading
                  ? [...Array(4)].map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-5 py-3">
                        <div className="skeleton h-8 rounded-xl" />
                      </td>
                    </tr>
                  ))
                  : recentReservations.length > 0 ? recentReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-primary">{reservation.numero}</td>
                      <td className="px-5 py-3 text-sm text-secondary">{reservation.user?.nom || '—'}</td>
                      <td className="px-5 py-3 text-sm text-secondary max-w-[160px] truncate">{reservation.voyage?.titre || '—'}</td>
                      <td className="px-5 py-3 text-sm text-muted">{reservation.nombre_places}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-secondary">{formatCurrency(reservation.montant_total)}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${reservation.statut === 'confirmee' ? 'badge-success' : reservation.statut === 'annulee' ? 'badge-danger' : 'badge-accent'} capitalize`}>
                          {t(statusLabels[reservation.statut]) ?? reservation.statut}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{formatDate(reservation.created_at)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">{t('supplierNoRecentReservations')}</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierDashboard
