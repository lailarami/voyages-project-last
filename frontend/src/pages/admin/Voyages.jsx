import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, Star, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { voyageService, adminService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const initialFormValues = {
  titre: '',
  destination: '',
  pays: '',
  description: '',
  description_longue: '',
  prix: '',
  date_depart: '',
  date_retour: '',
  places_disponibles: 1,
  places_totales: 1,
  categorie: '',
  transport: '',
  fournisseur_id: '',
  image: null,
}

export default function AdminVoyages() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedView, setSelectedView] = useState(null)
  const [page, setPage] = useState(1)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [imagePreview, setImagePreview] = useState(null)
  const qc = useQueryClient()
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-voyages', search, page],
    queryFn: () => voyageService.getAdminAll({ search, page, per_page: 15 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => voyageService.delete(id),
    onSuccess: () => {
      toast.success('Voyage supprimé')
      qc.invalidateQueries(['admin-voyages'])
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const handleDelete = (voyage) => {
    if (window.confirm(`Supprimer "${voyage.titre}" ?`)) {
      deleteMutation.mutate(voyage.id)
    }
  }

  const { data: fournisseurs, isLoading: isLoadingFournisseurs } = useQuery({
    queryKey: ['admin-fournisseurs'],
    queryFn: () => adminService.getFournisseurs().then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['voyage-categories'],
    queryFn: () => voyageService.getCategories().then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!showModal) return

    if (selected) {
      setFormValues({
        titre: selected.titre || '',
        destination: selected.destination || '',
        pays: selected.pays || '',
        description: selected.description || '',
        description_longue: selected.description_longue || '',
        prix: selected.prix || '',
        date_depart: selected.date_depart || '',
        date_retour: selected.date_retour || '',
        places_disponibles: selected.places_disponibles || 1,
        places_totales: selected.places_totales || 1,
        categorie: selected.categorie || '',
        transport: selected.transport || '',
        fournisseur_id: selected.fournisseur?.id || '',
        image: null,
      })
      setImagePreview(selected.image || null)
      return
    }

    const defaultFournisseur = fournisseurs?.data?.[0]?.id || ''
    const defaultCategory = categories?.data?.[0] || ''
    setFormValues({
      ...initialFormValues,
      fournisseur_id: defaultFournisseur,
      categorie: defaultCategory,
      transport: '',
    })
    setImagePreview(null)
  }, [showModal, selected, fournisseurs, categories])

  const formatApiError = (error) => {
    const errors = error.response?.data?.errors
    if (errors) {
      return Object.values(errors).flat().join(' ')
    }
    return error.response?.data?.message || 'Une erreur est survenue'
  }

  const createMutation = useMutation({
    mutationFn: (formData) => voyageService.create(formData),
    onSuccess: () => {
      toast.success('Voyage créé avec succès')
      setShowModal(false)
      setSelected(null)
      setFormValues(initialFormValues)
      setImagePreview(null)
      qc.invalidateQueries({ queryKey: ['admin-voyages'], exact: false })
      qc.invalidateQueries({ queryKey: ['voyages'], exact: false })
    },
    onError: (error) => toast.error(formatApiError(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => voyageService.update(id, data),
    onSuccess: () => {
      toast.success('Voyage mis à jour')
      setShowModal(false)
      setSelected(null)
      setFormValues(initialFormValues)
      setImagePreview(null)
      qc.invalidateQueries({ queryKey: ['admin-voyages'], exact: false })
      qc.invalidateQueries({ queryKey: ['voyages'], exact: false })
    },
    onError: (error) => toast.error(formatApiError(error)),
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const data = new FormData()

    Object.entries(formValues).forEach(([key, value]) => {
      if (key === 'image') {
        if (value) data.append('image', value)
        return
      }
      data.append(key, value ?? '')
    })

    if (!data.get('fournisseur_id') && fournisseurs?.data?.[0]?.id) {
      data.set('fournisseur_id', fournisseurs.data[0].id)
    }

    if (selected) {
      data.append('_method', 'PUT')
      updateMutation.mutate({ id: selected.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const formatMAD = (v) => new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v) + ' MAD'

  const exportColumns = [
    { label: 'Titre', value: 'titre' },
    { label: 'Destination', value: 'destination' },
    { label: 'Prix', value: (voyage) => formatMAD(voyage.prix_final) },
    { label: 'Départ', value: 'date_depart' },
    { label: 'Places disponibles', value: 'places_disponibles' },
    { label: 'Notes', value: (voyage) => voyage.moyenne_notes ?? '—' },
    { label: 'Statut', value: 'statut' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('voyages')}</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta?.total || 0} {t('voyages')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCsvButton filename="voyages.csv" columns={exportColumns} rows={data?.data || []} />
          <button
            onClick={() => { setSelected(null); setShowModal(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> {t('newTrip')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t('searchTrips')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-premium pl-10 max-w-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Voyage</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Destination</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Prix</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Départ</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Places</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Statut</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-6 py-4"><div className="skeleton h-10 rounded-xl" /></td></tr>
                ))
              ) : data?.data?.map((voyage) => (
                <motion.tr
                  key={voyage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {voyage.image ? (
                          <img src={voyage.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted text-xs">📍</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-secondary text-sm max-w-[180px] truncate">{voyage.titre}</div>
                        <div className="text-muted text-xs capitalize">{voyage.categorie}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-secondary">
                      <MapPin size={12} className="text-muted" />
                      {voyage.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary text-sm">{formatMAD(voyage.prix_final)}</div>
                    {voyage.reduction > 0 && <div className="text-xs text-muted line-through">{formatMAD(voyage.prix)}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {new Date(voyage.date_depart).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${voyage.places_disponibles > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {voyage.places_disponibles} places
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {voyage.nombre_avis > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-secondary">{voyage.moyenne_notes}</span>
                        <span className="text-xs text-muted">({voyage.nombre_avis})</span>
                      </div>
                    ) : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${voyage.is_disponible ? 'badge-success' : 'badge-danger'}`}>
                      {voyage.is_disponible ? <><CheckCircle size={11} /> Actif</> : <><XCircle size={11} /> Inactif</>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setSelectedView(voyage); setShowDetailsModal(true) }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-muted hover:text-primary transition-colors">
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { setSelected(voyage); setShowModal(true) }}
                        className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors">
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(voyage)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors disabled:opacity-50">
                        {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta?.last_page > 1 && (
          <div className="flex justify-center gap-2 px-6 py-4 border-t border-gray-100">
            {[...Array(data.meta.last_page)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                  ${page === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && data?.data?.length === 0 && (
        <div className="card-premium p-16 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-display text-xl font-bold text-secondary mb-2">Aucun voyage</h3>
          <p className="text-muted text-sm mb-5">Commencez par créer votre premier voyage.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Créer un voyage
          </button>
        </div>
      )}

      {showDetailsModal && selectedView && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 px-4 py-10">
          <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-secondary">Détails du voyage</h2>
                <p className="text-sm text-muted mt-1">Aperçu rapide du voyage sans quitter la page.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDetailsModal(false); setSelectedView(null) }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-secondary hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
              {selectedView.image && (
                <div className="rounded-3xl overflow-hidden bg-gray-100">
                  <img src={selectedView.image} alt={selectedView.titre} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold text-secondary">{selectedView.titre}</h3>
                  <p className="text-sm text-muted mt-1">{selectedView.destination} • {selectedView.categorie}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Prix</p>
                    <p className="mt-2 text-lg font-semibold text-secondary">{formatMAD(selectedView.prix_final)}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Départ</p>
                    <p className="mt-2 text-lg font-semibold text-secondary">{new Date(selectedView.date_depart).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Places</p>
                    <p className="mt-2 text-lg font-semibold text-secondary">{selectedView.places_disponibles} disponibles</p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
                    <p className="mt-2 text-lg font-semibold text-secondary">{selectedView.is_disponible ? 'Actif' : 'Inactif'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary">Description courte</p>
                    <p className="mt-2 text-sm text-muted">{selectedView.description || 'Aucune description fournie.'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary">Description longue</p>
                    <p className="mt-2 text-sm text-muted">{selectedView.description_longue || 'Aucune description longue disponible.'}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Fournisseur</p>
                    <p className="mt-2 text-sm text-secondary">{selectedView.fournisseur?.nom || 'Non spécifié'}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Réductions</p>
                    <p className="mt-2 text-sm text-secondary">{selectedView.reduction > 0 ? `${selectedView.reduction}%` : 'Aucune'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 px-4 py-10">
          <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-secondary">
                  {selected ? 'Modifier le voyage' : 'Nouveau voyage'}
                </h2>
                <p className="text-sm text-muted mt-1">Remplissez les informations et confirmez pour publier.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setSelected(null) }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-secondary hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-secondary">
                  Titre
                  <input
                    value={formValues.titre}
                    onChange={e => setFormValues({ ...formValues, titre: e.target.value })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Destination
                  <input
                    value={formValues.destination}
                    onChange={e => setFormValues({ ...formValues, destination: e.target.value })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Pays
                  <input
                    value={formValues.pays}
                    onChange={e => setFormValues({ ...formValues, pays: e.target.value })}
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Catégorie
                  {categories?.data?.length ? (
                    <select
                      value={formValues.categorie}
                      onChange={e => setFormValues({ ...formValues, categorie: e.target.value })}
                      required
                      className="input-premium w-full"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.data.map((categorie) => (
                        <option key={categorie} value={categorie}>{categorie}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={formValues.categorie}
                      onChange={e => setFormValues({ ...formValues, categorie: e.target.value })}
                      required
                      className="input-premium w-full"
                    />
                  )}
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Transport
                  <select
                    value={formValues.transport}
                    onChange={e => setFormValues({ ...formValues, transport: e.target.value })}
                    required
                    className="input-premium w-full"
                  >
                    <option value="">Sélectionner un transport</option>
                    <option value="avion">Avion</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                    <option value="train">Train</option>
                    <option value="bateau">Bateau</option>
                    <option value="autre">Autre</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Prix (MAD)
                  <input
                    type="number"
                    min="0"
                    value={formValues.prix}
                    onChange={e => setFormValues({ ...formValues, prix: e.target.value })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Places disponibles
                  <input
                    type="number"
                    min="1"
                    value={formValues.places_disponibles}
                    onChange={e => setFormValues({ ...formValues, places_disponibles: Number(e.target.value) })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Places totales
                  <input
                    type="number"
                    min="1"
                    value={formValues.places_totales}
                    onChange={e => setFormValues({ ...formValues, places_totales: Number(e.target.value) })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Date de départ
                  <input
                    type="date"
                    value={formValues.date_depart}
                    onChange={e => setFormValues({ ...formValues, date_depart: e.target.value })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Date de retour
                  <input
                    type="date"
                    value={formValues.date_retour}
                    onChange={e => setFormValues({ ...formValues, date_retour: e.target.value })}
                    required
                    className="input-premium w-full"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary lg:col-span-2">
                  Description courte
                  <textarea
                    value={formValues.description}
                    onChange={e => setFormValues({ ...formValues, description: e.target.value })}
                    required
                    rows={3}
                    className="input-premium w-full min-h-[96px] resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary lg:col-span-2">
                  Description longue
                  <textarea
                    value={formValues.description_longue}
                    onChange={e => setFormValues({ ...formValues, description_longue: e.target.value })}
                    rows={4}
                    className="input-premium w-full min-h-[128px] resize-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Fournisseur
                  <select
                    value={formValues.fournisseur_id}
                    onChange={e => setFormValues({ ...formValues, fournisseur_id: e.target.value })}
                    required
                    className="input-premium w-full"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs?.data?.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-secondary">
                  Image principale
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      setFormValues({ ...formValues, image: file })
                      setImagePreview(file ? URL.createObjectURL(file) : null)
                    }}
                    className="input-premium w-full"
                    required={!selected}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Aperçu" className="mt-2 h-28 w-full rounded-2xl object-cover border border-gray-200" />
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelected(null) }}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-secondary hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {selected ? 'Mettre à jour le voyage' : 'Créer le voyage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
