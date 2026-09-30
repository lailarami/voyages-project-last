import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Eye, Edit3, Trash2, CreditCard, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { paiementService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

export default function AdminPaiements() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { t } = useTranslation()
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ montant: '', methode: '', transaction_id: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-paiements', search, page],
    queryFn: () => paiementService.getAll({ search, page }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['paiement-stats'],
    queryFn: () => paiementService.getStats().then(r => r.data.data),
  })

  const formatMAD = (v) =>
    new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v) + ' MAD'

  const getMonthRevenueFromData = (items) => {
    if (!items) return 0
    return items.reduce((acc, p) => {
      if (!p.date_paiement) return acc
      const [day, month, yearAndTime] = p.date_paiement.split('/')
      const [year] = yearAndTime.split(' ')
      const date = new Date(`${year}-${month}-${day}`)
      const now = new Date()
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return acc + (Number(p.montant) || 0)
      }
      return acc
    }, 0)
  }

  const totalRevenue = stats?.total_revenu ?? data?.data?.reduce((acc, p) => acc + (Number(p.montant) || 0), 0)
  const monthRevenue = stats?.revenu_mois ?? getMonthRevenueFromData(data?.data)

  const statutConfig = {
    reussi: { label: 'Réussi', cls: 'badge-success', icon: CheckCircle },
    en_attente: { label: 'En attente', cls: 'badge-accent', icon: Clock },
    echoue: { label: 'Échoué', cls: 'badge-danger', icon: XCircle },
    rembourse: { label: 'Remboursé', cls: 'badge-muted', icon: CreditCard },
    annule: { label: 'Annulé', cls: 'badge-muted', icon: XCircle },
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => paiementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-paiements', search, page])
      if (selectedPayment) setSelectedPayment(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => paiementService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-paiements', search, page])
      setIsEditing(false)
      setSelectedPayment(prev => prev ? { ...prev, ...editData } : prev)
    },
  })

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setIsEditing(false)
  }

  const paymentMethods = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'carte', label: t('card') },
    { value: 'especes', label: 'Espèces' },
  ]

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment)
    setIsEditing(true)
    setEditData({
      montant: payment.montant?.toString() || '',
      methode: payment.methode || 'stripe',
      transaction_id: payment.transaction_id || '',
    })
  }

  const handleUpdatePayment = (e) => {
    e.preventDefault()
    if (!selectedPayment) return

    updateMutation.mutate({
      id: selectedPayment.id,
      payload: {
        montant: parseFloat(editData.montant),
        methode: editData.methode,
        transaction_id: editData.transaction_id,
      },
    })
  }

  const exportColumns = [
    { label: 'Transaction ID', value: (p) => p.transaction_id || '—' },
    { label: 'Client', value: (p) => p.reservation?.user || '—' },
    { label: 'Voyage', value: (p) => p.reservation?.voyage || '—' },
    { label: 'Montant', value: (p) => formatMAD(p.montant) },
    { label: 'Méthode', value: 'methode' },
    { label: 'Date', value: 'date_paiement' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-secondary">{t('payments')}</h1>
            <p className="text-muted text-sm mt-0.5">{t('paymentTracking')}</p>
          </div>
          <ExportCsvButton filename="paiements.csv" columns={exportColumns} rows={data?.data || []} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Revenu total', value: formatMAD(totalRevenue || 0), icon: TrendingUp, gradient: 'from-sky-500 to-cyan-500' },
          { label: 'Ce mois', value: formatMAD(monthRevenue || 0), icon: CreditCard, gradient: 'from-emerald-500 to-lime-400' },
          { label: 'Transactions', value: data?.meta?.total || 0, icon: CheckCircle, gradient: 'from-violet-500 to-fuchsia-500' },
        ].map(({ label, value, icon: Icon, gradient }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -4 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="relative overflow-hidden rounded-[28px] bg-slate-950/90 border border-white/10 p-5 shadow-xl shadow-slate-950/20"
          >
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-10 bottom-4 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="flex items-center gap-4 relative">
              <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-2xl shadow-slate-950/40`}>
                <span className="absolute inset-0 rounded-full opacity-20 bg-white" />
                <Icon size={22} className="relative text-white" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-premium p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom de client..."
            className="input-premium pl-10 w-full"
          />
        </div>
      </div>

      {selectedPayment && (
        <div className="card-premium p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-lg text-secondary">Détails du paiement</h2>
              <p className="text-muted text-sm">Transaction {selectedPayment.transaction_id || selectedPayment.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleViewPayment(selectedPayment)}
                className="btn-secondary px-4 py-2">Voir</button>
              <button onClick={() => handleEditPayment(selectedPayment)}
                className="btn-primary px-4 py-2">Modifier</button>
              <button onClick={() => { deleteMutation.mutate(selectedPayment.id) }}
                className="btn-danger px-4 py-2">Supprimer</button>
              <button onClick={() => setSelectedPayment(null)}
                className="btn-secondary px-4 py-2">Fermer</button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdatePayment} className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm text-secondary mb-2 block">Montant</label>
                <input
                  type="number"
                  value={editData.montant}
                  onChange={e => setEditData(prev => ({ ...prev, montant: e.target.value }))}
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="text-sm text-secondary mb-2 block">Méthode</label>
                <select
                  value={editData.methode}
                  onChange={e => setEditData(prev => ({ ...prev, methode: e.target.value }))}
                  className="input-premium w-full"
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-secondary mb-2 block">Transaction ID</label>
                <input
                  value={editData.transaction_id}
                  onChange={e => setEditData(prev => ({ ...prev, transaction_id: e.target.value }))}
                  className="input-premium w-full"
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" className="btn-primary px-4 py-2" disabled={updateMutation.isLoading}>
                  Enregistrer
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary px-4 py-2">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase text-muted">Client</div>
                <div className="text-sm text-secondary">{selectedPayment.reservation?.user || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Voyage</div>
                <div className="text-sm text-secondary">{selectedPayment.reservation?.voyage || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Montant</div>
                <div className="text-sm text-secondary">{formatMAD(selectedPayment.montant)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Méthode</div>
                <div className="text-sm text-secondary">{selectedPayment.methode}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Transaction ID</div>
                <div className="text-sm text-secondary">{selectedPayment.transaction_id || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Date</div>
                <div className="text-sm text-secondary">{selectedPayment.date_paiement || '—'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Transaction ID', 'Client', 'Voyage', 'Montant', 'Statut', 'Méthode', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-3">
                    <div className="skeleton h-8 rounded-xl" />
                  </td></tr>
                ))
                : data?.data?.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <code className="text-xs text-primary font-mono bg-primary/5 px-2 py-1 rounded-lg">
                        {p.transaction_id ? p.transaction_id.slice(0, 20) + '…' : '—'}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-sm text-secondary">
                      {p.reservation?.user || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-secondary max-w-[160px] truncate">
                      {p.reservation?.voyage || '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-secondary text-sm">
                      {formatMAD(p.montant)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${statutConfig[p.statut]?.cls ?? 'badge-muted'} capitalize`}>
                        {statutConfig[p.statut]?.label ?? p.statut ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge badge-accent capitalize">{p.methode}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{p.date_paiement || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewPayment(p)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-muted transition-colors">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEditPayment(p)}
                          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(p.id)}
                          className="p-2 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta?.last_page > 1 && (
          <div className="flex justify-center gap-2 px-5 py-4 border-t border-gray-100">
            {[...Array(data.meta.last_page)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                  ${page === i + 1
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
