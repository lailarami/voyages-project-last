import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, UserCheck, UserX, Plus, Edit, Trash2 } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { adminService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const initialFormValues = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  role: 'client',
  status: 'actif',
  password: '',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role],
    queryFn: () => adminService.getUsers({ search, role }).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleUserStatus(id),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries(['admin-users']) },
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createUser(data),
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès')
      setShowModal(false)
      setSelectedUser(null)
      setFormValues(initialFormValues)
      setFormErrors({})
      qc.invalidateQueries(['admin-users'])
    },
    onError: (error) => {
      const response = error.response?.data
      if (response?.errors) {
        setFormErrors(response.errors)
      } else {
        toast.error('Erreur lors de la création')
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateUser(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour')
      setShowModal(false)
      setSelectedUser(null)
      setFormValues(initialFormValues)
      setFormErrors({})
      qc.invalidateQueries(['admin-users'])
    },
    onError: (error) => {
      const response = error.response?.data
      if (response?.errors) {
        setFormErrors(response.errors)
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('Utilisateur supprimé')
      qc.invalidateQueries(['admin-users'])
    },
    onError: (error) => {
      const response = error.response?.data
      toast.error(response?.message || 'Erreur lors de la suppression')
    },
  })

  const openCreateModal = () => {
    setSelectedUser(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormValues({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      role: user.role || 'client',
      status: user.status || 'actif',
      password: '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: null }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const { prenom, nom, email, role, status, password, telephone } = formValues
    const payload = { prenom, nom, email, role, status, telephone }
    if (!selectedUser || password) payload.password = password

    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const exportColumns = [
    { label: 'Utilisateur', value: (u) => u.full_name || u.nom },
    { label: 'Email', value: 'email' },
    { label: 'Rôle', value: 'role' },
    { label: 'Téléphone', value: 'telephone' },
    { label: 'Statut', value: 'status' },
    { label: 'Inscrit le', value: 'created_at' },
  ]

  const isEditMode = Boolean(selectedUser)
  const roleColors = { admin: 'badge-primary', client: 'badge-accent', fournisseur: 'badge-success', support: 'badge-muted' }
  const statusColors = { actif: 'badge-success', inactif: 'badge-muted', suspendu: 'badge-danger' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('users')}</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta?.total || 0} {t('users')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCsvButton filename="utilisateurs.csv" columns={exportColumns} rows={data?.data || []} />
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> {t('newUser')}
          </button>
        </div>
      </div>

      <div className="card-premium p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-10" />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="input-premium w-auto px-4">
          <option value="">Tous les rôles</option>
          <option value="client">Client</option>
          <option value="admin">Admin</option>
          <option value="fournisseur">Fournisseur</option>
          <option value="support">Support</option>
        </select>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Utilisateur', 'Email', 'Rôle', 'Téléphone', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? [...Array(10)].map((_, i) => <tr key={i}><td colSpan={7} className="px-6 py-3"><div className="skeleton h-8 rounded-xl" /></td></tr>)
                : data?.data?.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.nom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-secondary text-sm">{u.full_name || u.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{u.email}</td>
                    <td className="px-6 py-4"><span className={`badge ${roleColors[u.role] || 'badge-muted'} capitalize`}>{u.role}</span></td>
                    <td className="px-6 py-4 text-sm text-muted">{u.telephone || '—'}</td>
                    <td className="px-6 py-4"><span className={`badge ${statusColors[u.status] || 'badge-muted'} capitalize`}>{u.status}</span></td>
                    <td className="px-6 py-4 text-sm text-muted">{u.created_at}</td>
                    <td className="px-6 py-4 flex flex-wrap gap-2">
                      <button onClick={() => toggleMutation.mutate(u.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${u.status === 'actif' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
                        {u.status === 'actif' ? <><UserX size={12} /> Suspendre</> : <><UserCheck size={12} /> Activer</>}
                      </button>
                      <button onClick={() => openEditModal(u)} className="btn-secondary inline-flex items-center gap-2 py-2 px-3 text-xs">
                        <Edit size={14} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="btn-danger inline-flex items-center gap-2 py-2 px-3 text-xs">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-6">
                <div>
                  <h2 className="text-lg font-semibold text-secondary">{isEditMode ? 'Modifier un utilisateur' : 'Créer un utilisateur'}</h2>
                  <p className="text-sm text-muted">{isEditMode ? 'Mettez à jour les informations du compte.' : 'Ajoutez un nouvel utilisateur et assignez-lui un rôle.'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">Fermer</button>
              </div>
              <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Prénom</span>
                      <input value={formValues.prenom} onChange={(e) => handleFormChange('prenom', e.target.value)} className="input-premium mt-2" />
                      {formErrors.prenom && <p className="text-xs text-danger mt-1">{formErrors.prenom[0]}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Nom</span>
                      <input value={formValues.nom} onChange={(e) => handleFormChange('nom', e.target.value)} className="input-premium mt-2" />
                      {formErrors.nom && <p className="text-xs text-danger mt-1">{formErrors.nom[0]}</p>}
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Email</span>
                      <input type="email" value={formValues.email} onChange={(e) => handleFormChange('email', e.target.value)} className="input-premium mt-2" />
                      {formErrors.email && <p className="text-xs text-danger mt-1">{formErrors.email[0]}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Téléphone</span>
                      <input value={formValues.telephone} onChange={(e) => handleFormChange('telephone', e.target.value)} className="input-premium mt-2" />
                      {formErrors.telephone && <p className="text-xs text-danger mt-1">{formErrors.telephone[0]}</p>}
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Rôle</span>
                      <select value={formValues.role} onChange={(e) => handleFormChange('role', e.target.value)} className="input-premium mt-2">
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                        <option value="fournisseur">Fournisseur</option>
                        <option value="support">Support</option>
                      </select>
                      {formErrors.role && <p className="text-xs text-danger mt-1">{formErrors.role[0]}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-secondary">Statut</span>
                      <select value={formValues.status} onChange={(e) => handleFormChange('status', e.target.value)} className="input-premium mt-2">
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="suspendu">Suspendu</option>
                      </select>
                      {formErrors.status && <p className="text-xs text-danger mt-1">{formErrors.status[0]}</p>}
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">Mot de passe</span>
                    <input type="password" value={formValues.password} onChange={(e) => handleFormChange('password', e.target.value)} className="input-premium mt-2" placeholder={isEditMode ? 'Laissez vide pour conserver le mot de passe actuel' : ''} />
                    {formErrors.password && <p className="text-xs text-danger mt-1">{formErrors.password[0]}</p>}
                  </label>
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5 py-2.5">Annuler</button>
                    <button type="submit" className="btn-primary px-5 py-2.5">{isEditMode ? 'Enregistrer' : 'Créer'}</button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
