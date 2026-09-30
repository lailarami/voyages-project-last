// src/pages/admin/Fournisseurs.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { adminService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const initialFormValues = {
  nom: '',
  email: '',
  service: '',
  telephone: '',
  statut: 'actif',
  commission: '0',
}

export default function AdminFournisseurs() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { t } = useTranslation()
  const [selectedFournisseur, setSelectedFournisseur] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fournisseurs', search],
    queryFn: () => adminService.getFournisseurs({ search }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createFournisseur(data),
    onSuccess: () => {
      toast.success(t('supplierCreatedSuccess'))
      setShowModal(false)
      setSelectedFournisseur(null)
      setFormValues(initialFormValues)
      setFormErrors({})
      qc.invalidateQueries(['admin-fournisseurs'])
    },
    onError: (error) => {
      const response = error.response?.data
      if (response?.errors) {
        setFormErrors(response.errors)
      } else {
        toast.error(t('supplierCreateError'))
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateFournisseur(id, data),
    onSuccess: () => {
      toast.success(t('supplierUpdatedSuccess'))
      setShowModal(false)
      setSelectedFournisseur(null)
      setFormValues(initialFormValues)
      setFormErrors({})
      qc.invalidateQueries(['admin-fournisseurs'])
    },
    onError: (error) => {
      const response = error.response?.data
      if (response?.errors) {
        setFormErrors(response.errors)
      } else {
        toast.error(t('supplierUpdateError'))
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteFournisseur(id),
    onSuccess: () => {
      toast.success(t('supplierDeletedSuccess'))
      qc.invalidateQueries(['admin-fournisseurs'])
    },
    onError: () => toast.error(t('supplierDeleteError')),
  })

  const exportColumns = [
    { label: t('name'), value: 'nom' },
    { label: t('email'), value: 'email' },
    { label: t('service'), value: 'service' },
    { label: t('telephone'), value: 'telephone' },
    { label: t('status'), value: 'statut' },
    { label: t('commission'), value: (f) => `${f.commission}%` },
  ]

  const openCreateModal = () => {
    setSelectedFournisseur(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (fournisseur) => {
    setSelectedFournisseur(fournisseur)
    setFormValues({
      nom: fournisseur.nom || '',
      email: fournisseur.email || '',
      service: fournisseur.service || '',
      telephone: fournisseur.telephone || '',
      statut: fournisseur.statut || 'actif',
      commission: fournisseur.commission?.toString() || '0',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm(t('deleteSupplierConfirm'))) {
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
    const { nom, email, service, telephone, statut, commission } = formValues
    const payload = { nom, email, service, telephone, statut, commission: Number(commission) }

    if (selectedFournisseur) {
      updateMutation.mutate({ id: selectedFournisseur.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isEditMode = Boolean(selectedFournisseur)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('suppliers')}</h1>
          <p className="text-muted text-sm">{data?.meta?.total || 0} {t('suppliers')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1 md:flex-initial">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input-premium pl-10 w-full" />
          </div>
          <ExportCsvButton filename="fournisseurs.csv" columns={exportColumns} rows={data?.data || []} />
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> {t('newSupplier')}
          </button>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[t('name'), t('email'), t('service'), t('telephone'), t('status'), t('commission'), t('actions')].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="skeleton h-8 rounded-xl" /></td></tr>
              ))
              : data?.data?.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-medium text-secondary text-sm">{f.nom}</td>
                  <td className="px-5 py-4 text-sm text-muted">{f.email}</td>
                  <td className="px-5 py-4 text-sm text-secondary">{f.service}</td>
                  <td className="px-5 py-4 text-sm text-muted">{f.telephone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${f.statut === 'actif' ? 'badge-success' : f.statut === 'en_attente' ? 'badge-accent' : 'badge-danger'} capitalize`}>
                      {f.statut === 'actif' ? t('active') : f.statut === 'en_attente' ? t('pending') : t('suspended')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-secondary">{f.commission}%</td>
                  <td className="px-5 py-4 flex flex-wrap gap-2">
                    <button onClick={() => openEditModal(f)} className="btn-secondary inline-flex items-center gap-2 py-2 px-3 text-xs">
                      <Edit size={14} /> {t('edit')}
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="btn-danger inline-flex items-center gap-2 py-2 px-3 text-xs">
                      <Trash2 size={14} /> {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white p-6">
              <div>
                <h2 className="text-lg font-semibold text-secondary">{isEditMode ? t('editSupplier') : t('createSupplier')}</h2>
                <p className="text-sm text-muted">{isEditMode ? t('supplierUpdateHelp') : t('supplierCreateHelp')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">{t('close')}</button>
            </div>
            <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('name')}</span>
                    <input value={formValues.nom} onChange={(e) => handleFormChange('nom', e.target.value)} className="input-premium mt-2" />
                    {formErrors.nom && <p className="text-xs text-danger mt-1">{formErrors.nom[0]}</p>}
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('email')}</span>
                    <input type="email" value={formValues.email} onChange={(e) => handleFormChange('email', e.target.value)} className="input-premium mt-2" />
                    {formErrors.email && <p className="text-xs text-danger mt-1">{formErrors.email[0]}</p>}
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('service')}</span>
                    <input value={formValues.service} onChange={(e) => handleFormChange('service', e.target.value)} className="input-premium mt-2" />
                    {formErrors.service && <p className="text-xs text-danger mt-1">{formErrors.service[0]}</p>}
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('telephone')}</span>
                    <input value={formValues.telephone} onChange={(e) => handleFormChange('telephone', e.target.value)} className="input-premium mt-2" />
                    {formErrors.telephone && <p className="text-xs text-danger mt-1">{formErrors.telephone[0]}</p>}
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('status')}</span>
                    <select value={formValues.statut} onChange={(e) => handleFormChange('statut', e.target.value)} className="input-premium mt-2">
                      <option value="actif">{t('active')}</option>
                      <option value="en_attente">{t('pending')}</option>
                      <option value="suspendu">{t('suspended')}</option>
                    </select>
                    {formErrors.statut && <p className="text-xs text-danger mt-1">{formErrors.statut[0]}</p>}
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-secondary">{t('commission')} (%)</span>
                    <input type="number" min="0" value={formValues.commission} onChange={(e) => handleFormChange('commission', e.target.value)} className="input-premium mt-2" />
                    {formErrors.commission && <p className="text-xs text-danger mt-1">{formErrors.commission[0]}</p>}
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5 py-2.5">{t('cancel')}</button>
                  <button type="submit" className="btn-primary px-5 py-2.5">{isEditMode ? t('save') : t('create')}</button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
