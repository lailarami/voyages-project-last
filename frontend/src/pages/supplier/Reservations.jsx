// src/pages/supplier/Reservations.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Filter } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { reservationService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

const statutOptions = [
  { value: 'en_attente', labelKey: 'statusPending' },
  { value: 'confirmee', labelKey: 'statusConfirmed' },
  { value: 'annulee', labelKey: 'statusCancelled' },
  { value: 'terminee', labelKey: 'statusCompleted' },
]

const statusLabels = {
  en_attente: 'statusPending',
  confirmee: 'statusConfirmed',
  annulee: 'statusCancelled',
  terminee: 'statusCompleted',
}

export default function SupplierReservations() {
  const qc = useQueryClient()
  const { t, formatCurrency, formatDate } = useTranslation()
  const [statut, setStatut] = useState('en_attente')

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-reservations', statut],
    queryFn: () => reservationService.getSupplierReservations({ per_page: 20, statut }).then((r) => r.data),
  })

  const confirmMutation = useMutation({
    mutationFn: (id) => reservationService.confirmSupplier(id),
    onSuccess: () => {
      toast.success(t('reservationConfirmSuccess'))
      qc.invalidateQueries(['supplier-reservations'])
    },
    onError: () => toast.error(t('reservationConfirmError')),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => reservationService.rejectSupplier(id),
    onSuccess: () => {
      toast.success(t('reservationRejectSuccess'))
      qc.invalidateQueries(['supplier-reservations'])
    },
    onError: () => toast.error(t('reservationRejectError')),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('mesReservations')}</h1>
          <p className="text-sm text-muted">{t('filterByStatus')}, « {t('statusPending')} » est appliqué par défaut.</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-muted" />
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="input-premium w-auto px-4"
          >
            {statutOptions.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-premium overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[t('tableNumber'), t('client'), t('trip'), t('seats'), t('amount'), t('status'), t('date'), t('actions')].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-5 py-3">
                    <div className="skeleton h-8 rounded-xl" />
                  </td>
                </tr>
              ))
              : data?.data?.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-primary">{r.numero}</td>
                  <td className="px-5 py-3 text-sm text-secondary">{r.user?.nom || '—'}</td>
                  <td className="px-5 py-3 text-sm text-secondary max-w-[140px] truncate">{r.voyage?.titre || '—'}</td>
                  <td className="px-5 py-3 text-sm text-muted">{r.nombre_places}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-secondary">
                    {formatCurrency(r.montant_total)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${r.statut === 'confirmee' ? 'badge-success' : r.statut === 'annulee' ? 'badge-danger' : 'badge-accent'} capitalize`}>
                      {t(statusLabels[r.statut]) ?? r.statut}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{formatDate(r.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.statut === 'en_attente' ? (
                        <>
                          <button
                            type="button"
                            title={t('confirmReservation')}
                            aria-label={t('confirmReservation')}
                            onClick={() => confirmMutation.mutate(r.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-success text-xs font-semibold hover:bg-success/20"
                          >
                            <CheckCircle size={14} />
                            {t('confirmReservation')}
                          </button>
                          <button
                            type="button"
                            title={t('rejectReservation')}
                            aria-label={t('rejectReservation')}
                            onClick={() => rejectMutation.mutate(r.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-danger text-xs font-semibold hover:bg-danger/20"
                          >
                            <XCircle size={14} />
                            {t('rejectReservation')}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted">{t('noAction')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!isLoading && data?.data?.length === 0 && (
          <div className="text-center py-12 text-muted">{t('noReservations')}</div>
        )}
      </div>
    </div>
  )
}
