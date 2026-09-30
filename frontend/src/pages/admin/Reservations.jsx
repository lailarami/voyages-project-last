// Admin Reservations page
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { reservationService, adminService, voyageService } from '@/services/api'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const initialFormValues = {
  user_id: '',
  voyage_id: '',
  nombre_places: 1,
  statut: 'en_attente',
  notes: '',
  motif_annulation: '',
}

const statutColors = {
  confirmee: 'badge-success', en_attente: 'badge-accent',
  annulee: 'badge-danger', terminee: 'badge-muted',
}
const statutLabels = {
  confirmee: 'Confirmée', en_attente: 'En attente',
  annulee: 'Annulée', terminee: 'Terminée',
}
const statutOptions = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'annulee', label: 'Annulée' },
  { value: 'terminee', label: 'Terminée' },
]

export default function AdminReservations() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const qc = useQueryClient()
  const user = useAuthStore(state => state.user)
  const isAdmin = user?.role === 'admin'
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reservations', search, statut, page],
    queryFn: () => reservationService.getAll({ search, statut, page }).then(r => r.data),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers({ per_page: 100 }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  const { data: allVoyages } = useQuery({
    queryKey: ['admin-voyages-list'],
    queryFn: () => voyageService.getAdminAll({ per_page: 100 }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!showModal) return

    if (selectedReservation) {
      setFormValues({
        user_id: selectedReservation.user?.id || '',
        voyage_id: selectedReservation.voyage?.id || '',
        nombre_places: selectedReservation.nombre_places || 1,
        statut: selectedReservation.statut || 'en_attente',
        notes: selectedReservation.notes || '',
        motif_annulation: selectedReservation.motif_annulation || '',
      })
      return
    }

    setFormValues({
      ...initialFormValues,
      user_id: usersData?.data?.[0]?.id || '',
      voyage_id: allVoyages?.data?.[0]?.id || '',
    })
  }, [showModal, selectedReservation, usersData, allVoyages])

  const exportColumns = [
    { label: 'N° Réservation', value: 'numero' },
    { label: 'Client', value: (r) => r.user?.nom || '—' },
    { label: 'Voyage', value: (r) => r.voyage?.titre || '—' },
    { label: 'Places', value: 'nombre_places' },
    { label: 'Montant', value: (r) => new Intl.NumberFormat('fr-MA').format(r.montant_total) + ' MAD' },
    { label: 'Statut', value: (r) => statutLabels[r.statut] || r.statut },
    { label: 'Date', value: 'created_at' },
  ]

  const confirmMutation = useMutation({
    mutationFn: (id) => reservationService.confirm(id),
    onSuccess: () => { toast.success('Réservation confirmée'); qc.invalidateQueries(['admin-reservations']) },
  })
  const cancelMutation = useMutation({
    mutationFn: (id) => reservationService.cancel(id, { motif: 'Annulée par admin' }),
    onSuccess: () => { toast.success('Réservation annulée'); qc.invalidateQueries(['admin-reservations']) },
  })
  const createMutation = useMutation({
    mutationFn: (payload) => reservationService.createAdmin(payload),
    onSuccess: () => {
      toast.success('Réservation créée')
      setShowModal(false)
      setSelectedReservation(null)
      setFormValues(initialFormValues)
      qc.invalidateQueries(['admin-reservations'])
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Erreur lors de la création'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => reservationService.updateAdmin(id, payload),
    onSuccess: () => {
      toast.success('Réservation mise à jour')
      setShowModal(false)
      setSelectedReservation(null)
      setFormValues(initialFormValues)
      qc.invalidateQueries(['admin-reservations'])
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => reservationService.delete(id),
    onSuccess: () => { toast.success('Réservation supprimée'); qc.invalidateQueries(['admin-reservations']) },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      user_id: formValues.user_id,
      voyage_id: formValues.voyage_id,
      nombre_places: Number(formValues.nombre_places),
      statut: formValues.statut,
      notes: formValues.notes,
      motif_annulation: formValues.motif_annulation,
    }

    if (selectedReservation) {
      updateMutation.mutate({ id: selectedReservation.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (reservation) => {
    if (window.confirm(`Supprimer la réservation ${reservation.numero} ?`)) {
      deleteMutation.mutate(reservation.id)
    }
  }

  const openNewReservation = () => {
    setSelectedReservation(null)
    setShowModal(true)
  }

  const openEditReservation = (reservation) => {
    setSelectedReservation(reservation)
    setShowModal(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('mesReservations')}</h1>
          <p className="text-muted text-sm">{data?.meta?.total || 0} {t('mesReservations')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvButton filename="reservations.csv" columns={exportColumns} rows={data?.data || []} />
          <button onClick={openNewReservation} className="btn-primary flex items-center gap-2 w-full sm:w-auto">
            <Plus size={16} /> {t('newReservation')}
          </button>
        </div>
      </div>

      <div className="card-premium p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="N° réservation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-premium pl-10"
          />
        </div>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="input-premium w-auto px-4">
          <option value="">Tous les statuts</option>
          {Object.entries(statutLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['N° Réservation', 'Client', 'Voyage', 'Places', 'Montant', 'Statut', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-3">
                      <div className="skeleton h-8 rounded-xl" />
                    </td>
                  </tr>
                ))
                : data?.data?.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-primary font-medium">{r.numero}</td>
                    <td className="px-5 py-4 text-sm text-secondary">{r.user?.nom || '—'}</td>
                    <td className="px-5 py-4 text-sm text-secondary max-w-[160px] truncate">{r.voyage?.titre || '—'}</td>
                    <td className="px-5 py-4 text-sm text-muted">{r.nombre_places}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-secondary">
                      {new Intl.NumberFormat('fr-MA').format(r.montant_total)} MAD
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${statutColors[r.statut] || 'badge-muted'} capitalize`}>
                        {statutLabels[r.statut] || r.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{r.created_at}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.statut === 'en_attente' && !isAdmin && (
                          <>
                            <button
                              type="button"
                              title="Confirmer"
                              aria-label="Confirmer la réservation"
                              onClick={() => confirmMutation.mutate(r.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-success text-xs font-semibold hover:bg-success/20"
                            >
                              <CheckCircle size={14} />
                              Confirmer
                            </button>
                            <button
                              type="button"
                              title="Annuler"
                              aria-label="Annuler la réservation"
                              onClick={() => cancelMutation.mutate(r.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-danger text-xs font-semibold hover:bg-danger/20"
                            >
                              <XCircle size={14} />
                              Annuler
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="Modifier"
                          aria-label="Modifier la réservation"
                          onClick={() => openEditReservation(r)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-primary text-xs font-semibold hover:bg-primary/20"
                        >
                          <Edit size={14} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          title="Supprimer"
                          aria-label="Supprimer la réservation"
                          onClick={() => handleDelete(r)}
                          className="inline-flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-danger text-xs font-semibold hover:bg-danger/20"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 px-4 py-10">
          <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-secondary">
                  {selectedReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
                </h2>
                <p className="text-sm text-muted mt-1">Remplissez les informations de la réservation.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setSelectedReservation(null) }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-secondary hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-secondary">
                  Client
                  <select
                    value={formValues.user_id}
                    onChange={e => setFormValues({ ...formValues, user_id: e.target.value })}
                    required
                    className="input-premium w-full"
                  >
                    <option value="">Sélectionner un client</option>
                    {usersData?.data?.map((user) => (
                      <option key={user.id} value={user.id}>{user.nom} ({user.email})</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Voyage
                  <select
                    value={formValues.voyage_id}
                    onChange={e => setFormValues({ ...formValues, voyage_id: e.target.value })}
                    required
                    className="input-premium w-full"
                  >
                    <option value="">Sélectionner un voyage</option>
                    {allVoyages?.data?.map((voyage) => (
                      <option key={voyage.id} value={voyage.id}>{voyage.titre} - {voyage.destination}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Nombre de places
                  <input
                    type="number"
                    min="1"
                    value={formValues.nombre_places}
                    onChange={e => setFormValues({ ...formValues, nombre_places: Number(e.target.value) })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Statut
                  <select
                    value={formValues.statut}
                    onChange={e => setFormValues({ ...formValues, statut: e.target.value })}
                    required
                    className="input-premium w-full"
                  >
                    {statutOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-secondary lg:col-span-2">
                  Notes
                  <textarea
                    value={formValues.notes}
                    onChange={e => setFormValues({ ...formValues, notes: e.target.value })}
                    rows={3}
                    className="input-premium w-full min-h-[96px] resize-none"
                  />
                </label>
                {formValues.statut === 'annulee' && (
                  <label className="space-y-2 text-sm text-secondary lg:col-span-2">
                    Motif d'annulation
                    <input
                      value={formValues.motif_annulation}
                      onChange={e => setFormValues({ ...formValues, motif_annulation: e.target.value })}
                      className="input-premium w-full"
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedReservation(null) }}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-secondary hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  {selectedReservation ? 'Mettre à jour' : 'Créer la réservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
