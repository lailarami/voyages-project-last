// src/pages/admin/Avis.jsx
import { useState } from 'react'
import useTranslation from '@/hooks/useTranslation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, CheckCircle, XCircle, Trash2, Search, Eye, Edit3 } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { avisService } from '@/services/api'
import toast from 'react-hot-toast'

export default function AdminAvis() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedAvis, setSelectedAvis] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ note: 1, titre: '', commentaire: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-avis', search],
    queryFn: () => avisService.getAdminAll({ approuve: 'all', search }).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => avisService.approve(id),
    onSuccess: () => { toast.success('Statut modifié'); qc.invalidateQueries(['admin-avis', search]) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => avisService.delete(id),
    onSuccess: () => {
      toast.success('Avis supprimé')
      qc.invalidateQueries(['admin-avis', search])
      if (selectedAvis?.id === id) setSelectedAvis(null)
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => avisService.update(id, payload),
    onSuccess: () => {
      toast.success('Avis mis à jour')
      qc.invalidateQueries(['admin-avis', search])
      setIsEditing(false)
    },
  })

  const handleViewAvis = (avis) => {
    setSelectedAvis(avis)
    setIsEditing(false)
  }

  const handleEditAvis = (avis) => {
    setSelectedAvis(avis)
    setIsEditing(true)
    setEditData({ note: avis.note, titre: avis.titre || '', commentaire: avis.commentaire || '' })
  }

  const handleUpdateAvis = (e) => {
    e.preventDefault()
    if (!selectedAvis) return

    updateMutation.mutate({
      id: selectedAvis.id,
      payload: {
        note: editData.note,
        titre: editData.titre,
        commentaire: editData.commentaire,
      },
    })
  }

  const exportColumns = [
    { label: 'Utilisateur', value: (avis) => avis.user?.nom || '—' },
    { label: 'Note', value: 'note' },
    { label: 'Titre', value: 'titre' },
    { label: 'Commentaire', value: 'commentaire' },
    { label: 'Voyage', value: (avis) => avis.voyage?.titre || '—' },
    { label: 'Statut', value: (avis) => (avis.approuve ? 'Approuvé' : 'En attente') },
    { label: 'Date', value: 'date' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('reviews')}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Recherche par utilisateur, voyage ou texte..."
              className="input-premium pl-10 w-full"
            />
          </div>
          <ExportCsvButton filename="avis.csv" columns={exportColumns} rows={data?.data || []} />
        </div>
      </div>

      {selectedAvis && (
        <div className="card-premium p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-lg text-secondary">Détails de l'avis</h2>
              <p className="text-muted text-sm">{selectedAvis.user?.nom} - {selectedAvis.voyage?.titre}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleViewAvis(selectedAvis)} className="btn-secondary px-4 py-2">Voir</button>
              <button onClick={() => handleEditAvis(selectedAvis)} className="btn-primary px-4 py-2">Modifier</button>
              <button onClick={() => setSelectedAvis(null)} className="btn-secondary px-4 py-2">Fermer</button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateAvis} className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm text-secondary mb-2 block">Note</label>
                <select
                  value={editData.note}
                  onChange={e => setEditData(prev => ({ ...prev, note: Number(e.target.value) }))}
                  className="input-premium w-full"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-secondary mb-2 block">Titre</label>
                <input
                  value={editData.titre}
                  onChange={e => setEditData(prev => ({ ...prev, titre: e.target.value }))}
                  className="input-premium w-full"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm text-secondary mb-2 block">Commentaire</label>
                <textarea
                  rows={4}
                  value={editData.commentaire}
                  onChange={e => setEditData(prev => ({ ...prev, commentaire: e.target.value }))}
                  className="input-premium w-full min-h-[120px]"
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" className="btn-primary px-4 py-2" disabled={updateMutation.isLoading}>Enregistrer</button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary px-4 py-2">Annuler</button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase text-muted">Utilisateur</div>
                <div className="text-sm text-secondary">{selectedAvis.user?.nom}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Voyage</div>
                <div className="text-sm text-secondary">{selectedAvis.voyage?.titre}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted">Note</div>
                <div className="text-sm text-secondary">{selectedAvis.note}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-xs uppercase text-muted">Commentaire</div>
                <div className="text-sm text-secondary">{selectedAvis.commentaire}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {isLoading
          ? [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
          : data?.data?.map(avis => (
            <motion.div key={avis.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card-premium p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {avis.user?.nom?.slice(0, 2).toUpperCase() || 'AN'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-secondary text-sm">{avis.user?.nom}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12}
                        className={i < avis.note ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className={`badge ${avis.approuve ? 'badge-success' : 'badge-accent'} text-xs`}>
                    {avis.approuve ? 'Approuvé' : 'En attente'}
                  </span>
                </div>
                {avis.titre && <div className="font-medium text-secondary text-sm mb-1">{avis.titre}</div>}
                <p className="text-muted text-sm line-clamp-2">{avis.commentaire}</p>
                <div className="text-xs text-muted mt-1">
                  {avis.voyage?.titre} · {avis.date}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleViewAvis(avis)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-muted transition-colors">
                  <Eye size={15} />
                </button>
                <button onClick={() => handleEditAvis(avis)}
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <Edit3 size={15} />
                </button>
                <button onClick={() => approveMutation.mutate(avis.id)}
                  className={`p-2 rounded-lg transition-colors ${avis.approuve
                    ? 'bg-danger/10 hover:bg-danger/20 text-danger'
                    : 'bg-success/10 hover:bg-success/20 text-success'}`}>
                  {avis.approuve ? <XCircle size={15} /> : <CheckCircle size={15} />}
                </button>
                <button onClick={() => deleteMutation.mutate(avis.id)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-danger/10 text-muted hover:text-danger transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        {!isLoading && data?.data?.length === 0 && (
          <div className="card-premium p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-muted">Aucun avis à modérer</p>
          </div>
        )}
      </div>
    </div>
  )
}
