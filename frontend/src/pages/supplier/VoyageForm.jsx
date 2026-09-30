// src/pages/supplier/VoyageForm.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react'
import { voyageService } from '@/services/api'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

const initialFormValues = {
    titre: '',
    destination: '',
    pays: '',
    description: '',
    description_longue: '',
    prix: '',
    reduction: 0,
    date_depart: '',
    date_retour: '',
    places_disponibles: 1,
    places_totales: 1,
    categorie: '',
    transport: '',
    image: null,
}

export default function SupplierVoyageForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [formValues, setFormValues] = useState(initialFormValues)
    const [imagePreview, setImagePreview] = useState(null)

    const isEditMode = !!id && id !== 'nouveau'

    const { data: voyage, isLoading: isLoadingVoyage } = useQuery({
        queryKey: ['voyage', id],
        queryFn: () => voyageService.getById(id).then((r) => r.data?.data),
        enabled: isEditMode,
    })

    useEffect(() => {
        if (isEditMode && voyage) {
            setFormValues({
                titre: voyage.titre || '',
                destination: voyage.destination || '',
                pays: voyage.pays || '',
                description: voyage.description || '',
                description_longue: voyage.description_longue || '',
                prix: voyage.prix || '',
                reduction: voyage.reduction || 0,
                date_depart: voyage.date_depart || '',
                date_retour: voyage.date_retour || '',
                places_disponibles: voyage.places_disponibles || 1,
                places_totales: voyage.places_totales || 1,
                categorie: voyage.categorie || '',
                transport: voyage.transport || '',
                image: null,
            })
            setImagePreview(voyage.image || null)
        }
    }, [voyage, isEditMode])

    const createMutation = useMutation({
        mutationFn: (formData) => voyageService.createSupplier(formData),
        onSuccess: () => {
            toast.success(t('voyageCree'))
            navigate('/fournisseur/voyages')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || t('voyageCreationErreur'))
        },
    })

    const updateMutation = useMutation({
        mutationFn: (formData) => voyageService.updateSupplier(id, formData),
        onSuccess: () => {
            toast.success(t('voyageMisAJour'))
            navigate('/fournisseur/voyages')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || t('voyageMiseAJourErreur'))
        },
    })

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormValues({ ...formValues, image: file })
            const reader = new FileReader()
            reader.onload = (event) => setImagePreview(event.target.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData()
        Object.keys(formValues).forEach((key) => {
            if (formValues[key] !== null && formValues[key] !== '') {
                formData.append(key, formValues[key])
            }
        })

        if (isEditMode) {
            updateMutation.mutate(formData)
        } else {
            createMutation.mutate(formData)
        }
    }

    const isLoading = isLoadingVoyage || createMutation.isPending || updateMutation.isPending

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate('/fournisseur/voyages')}
                    className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6 transition-colors"
                >
                    <ChevronLeft size={20} /> {t('retourVoyages')}
                </button>

                <div className="card-premium p-8">
                    <h1 className="font-display text-3xl font-bold text-secondary mb-2">
                        {isEditMode ? t('modifierVoyage') : t('creerNouveauVoyage')}
                    </h1>
                    <p className="text-muted mb-8">
                        {isEditMode
                            ? t('modifierInformationsVoyage')
                            : t('remplirInformationsVoyage')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Image Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-secondary">{t('imageDuVoyage')}</label>
                            <div className="relative w-full h-64 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </>
                                ) : (
                                    <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                        <div className="text-center">
                                            <ImageIcon size={40} className="mx-auto mb-2 text-muted" />
                                            <p className="text-sm text-muted">{t('cliquezGlissezImage')}</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Informations de base */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2 text-sm text-secondary">
                                {t('titre')} *
                                <input
                                    type="text"
                                    value={formValues.titre}
                                    onChange={(e) => setFormValues({ ...formValues, titre: e.target.value })}
                                    placeholder={t('placeholderTripTitle')}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('destination')} *
                                <input
                                    type="text"
                                    value={formValues.destination}
                                    onChange={(e) => setFormValues({ ...formValues, destination: e.target.value })}
                                    placeholder={t('placeholderDestination')}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('pays')} *
                                <input
                                    type="text"
                                    value={formValues.pays}
                                    onChange={(e) => setFormValues({ ...formValues, pays: e.target.value })}
                                    placeholder={t('placeholderCountry')}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('categorie')} *
                                <input
                                    type="text"
                                    value={formValues.categorie}
                                    onChange={(e) => setFormValues({ ...formValues, categorie: e.target.value })}
                                    placeholder={t('placeholderCategory')}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-secondary">
                                Transport *
                                <select
                                    value={formValues.transport}
                                    onChange={(e) => setFormValues({ ...formValues, transport: e.target.value })}
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
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-4">
                            <label className="space-y-2 text-sm text-secondary">
                                {t('descriptionCourte')} *
                                <textarea
                                    value={formValues.description}
                                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                                    placeholder={t('placeholderShortDescription')}
                                    required
                                    rows={2}
                                    className="input-premium w-full resize-none"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('descriptionLongue')}
                                <textarea
                                    value={formValues.description_longue}
                                    onChange={(e) => setFormValues({ ...formValues, description_longue: e.target.value })}
                                    placeholder={t('placeholderLongDescription')}
                                    rows={4}
                                    className="input-premium w-full resize-none"
                                />
                            </label>
                        </div>

                        {/* Pricing & Places */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2 text-sm text-secondary">
                                {t('prixMAD')} *
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.prix}
                                    onChange={(e) => setFormValues({ ...formValues, prix: e.target.value })}
                                    placeholder={t('placeholderPrice')}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('reduction')} (%)
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formValues.reduction}
                                    onChange={(e) => setFormValues({ ...formValues, reduction: e.target.value })}
                                    placeholder={t('placeholderDiscount')}
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('nombreTotalPlaces')} *
                                <input
                                    type="number"
                                    min="1"
                                    value={formValues.places_totales}
                                    onChange={(e) => setFormValues({ ...formValues, places_totales: parseInt(e.target.value) })}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('placesDisponibles')} *
                                <input
                                    type="number"
                                    min="0"
                                    value={formValues.places_disponibles}
                                    onChange={(e) => setFormValues({ ...formValues, places_disponibles: parseInt(e.target.value) })}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2 text-sm text-secondary">
                                {t('dateDepart')} *
                                <input
                                    type="date"
                                    value={formValues.date_depart}
                                    onChange={(e) => setFormValues({ ...formValues, date_depart: e.target.value })}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>

                            <label className="space-y-2 text-sm text-secondary">
                                {t('dateRetour')} *
                                <input
                                    type="date"
                                    value={formValues.date_retour}
                                    onChange={(e) => setFormValues({ ...formValues, date_retour: e.target.value })}
                                    required
                                    className="input-premium w-full"
                                />
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate('/fournisseur/voyages')}
                                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-secondary font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('annuler')}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 size={18} className="animate-spin" />}
                                {isEditMode ? t('mettreAJour') : t('creerVoyage')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
