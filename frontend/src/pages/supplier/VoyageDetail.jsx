import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
    MapPin, Calendar, Users, Star, Clock, Shield, CheckCircle,
    XCircle, ArrowLeft, Heart, Share2, ChevronLeft, ChevronRight,
    Plane, Mountain
} from 'lucide-react'
import { voyageService } from '@/services/api'
import { getFakeVoyageById } from '@/data/fakeVoyages'

export default function SupplierVoyageDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [imgIndex, setImgIndex] = useState(0)

    const fakeVoyage = getFakeVoyageById(id)

    const { data: voyage, isLoading } = useQuery({
        queryKey: ['supplier-voyage-detail', id],
        queryFn: async () => {
            if (fakeVoyage) return fakeVoyage
            const res = await voyageService.getById(id)
            return res.data.data
        },
        retry: false,
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg">
                <div className="max-w-6xl mx-auto px-4 py-10 space-y-4">
                    <div className="skeleton h-96 rounded-3xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 skeleton h-64 rounded-2xl" />
                        <div className="skeleton h-64 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!voyage && !isLoading) {
        return (
            <div className="min-h-screen bg-bg">
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <h1 className="font-display text-3xl font-bold text-secondary mb-4">Voyage introuvable</h1>
                    <p className="text-muted mb-8">Ce voyage n'existe pas encore ou n'est pas accessible pour le moment.</p>
                    <button onClick={() => navigate('/fournisseur/voyages')} className="btn-primary px-6 py-3">
                        Retour aux voyages fournisseur
                    </button>
                </div>
            </div>
        )
    }

    const allImages = [voyage.image, ...(voyage.images_gallery || [])].filter(Boolean)

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 text-sm">
                    <ArrowLeft size={16} /> Retour aux voyages fournisseur
                </button>

                <div className="relative rounded-3xl overflow-hidden h-80 md:h-[480px] mb-8 group">
                    <img src={allImages[imgIndex] || 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200'}
                        alt={voyage.titre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {allImages.length > 1 && (
                        <>
                            <button onClick={() => setImgIndex((imgIndex - 1 + allImages.length) % allImages.length)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center text-white transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setImgIndex((imgIndex + 1) % allImages.length)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center text-white transition-all">
                                <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {allImages.map((_, i) => (
                                    <button key={i} onClick={() => setImgIndex(i)}
                                        className={`transition-all rounded-full ${i === imgIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}

                    <div className="absolute top-5 left-5 flex gap-2">
                        {voyage.featured && <span className="badge bg-accent text-white px-3 py-1.5">⭐ Vedette</span>}
                        {voyage.reduction > 0 && <span className="badge bg-danger text-white px-3 py-1.5">-{voyage.reduction}%</span>}
                    </div>
                    <div className="absolute top-5 right-5 flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center text-white transition-all">
                            <Heart size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center text-white transition-all">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="badge badge-accent capitalize">{voyage.categorie}</span>
                                {voyage.niveau_difficulte && (
                                    <span className="badge badge-muted capitalize">
                                        <Mountain size={11} /> {voyage.niveau_difficulte}
                                    </span>
                                )}
                            </div>
                            <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-3">{voyage.titre}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-muted text-sm">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={15} className="text-primary" />
                                    {voyage.destination}{voyage.pays ? `, ${voyage.pays}` : ''}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={15} className="text-primary" />
                                    {voyage.duree} jours
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={15} className="text-primary" />
                                    {new Date(voyage.date_depart).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                {voyage.nombre_avis > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Star size={15} className="fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold text-secondary">{voyage.moyenne_notes}</span>
                                        <span className="text-muted">({voyage.nombre_avis} avis)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <h2 className="font-display font-bold text-xl text-secondary mb-4">Description</h2>
                            <p className="text-muted leading-relaxed">{voyage.description}</p>
                            {voyage.description_longue && (
                                <p className="text-muted leading-relaxed mt-3">{voyage.description_longue}</p>
                            )}
                        </div>

                        {(voyage.inclus || voyage.non_inclus) && (
                            <div className="card-premium p-6">
                                <h2 className="font-display font-bold text-xl text-secondary mb-5">Ce qui est inclus</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {voyage.inclus?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-success text-sm mb-3 flex items-center gap-1.5">
                                                <CheckCircle size={15} /> Inclus
                                            </h3>
                                            <ul className="space-y-2">
                                                {voyage.inclus.map((item, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-secondary">
                                                        <CheckCircle size={13} className="text-success flex-shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {voyage.non_inclus?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-danger text-sm mb-3 flex items-center gap-1.5">
                                                <XCircle size={15} /> Non inclus
                                            </h3>
                                            <ul className="space-y-2">
                                                {voyage.non_inclus.map((item, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-muted">
                                                        <XCircle size={13} className="text-danger flex-shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {voyage.programme?.length > 0 && (
                            <div className="card-premium p-6">
                                <h2 className="font-display font-bold text-xl text-secondary mb-5">Programme</h2>
                                <div className="space-y-4">
                                    {voyage.programme.map((jour, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                {i < voyage.programme.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                                                )}
                                            </div>
                                            <div className="pb-4">
                                                <h4 className="font-semibold text-secondary text-sm mb-1">
                                                    {jour.titre || `Jour ${i + 1}`}
                                                </h4>
                                                <p className="text-muted text-sm leading-relaxed">{jour.description || jour}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {voyage.avis?.length > 0 && (
                            <div className="card-premium p-6">
                                <h2 className="font-display font-bold text-xl text-secondary mb-2">Avis clients</h2>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="font-display text-5xl font-bold text-primary">{voyage.moyenne_notes}</div>
                                    <div>
                                        <div className="flex gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16}
                                                    className={i < Math.round(voyage.moyenne_notes) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                            ))}
                                        </div>
                                        <div className="text-muted text-sm">{voyage.nombre_avis} avis</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {voyage.avis.slice(0, 4).map((avis) => (
                                        <div key={avis.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {avis.user?.slice(0, 2).toUpperCase() || 'AN'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-secondary text-sm">{avis.user}</div>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={11}
                                                                className={i < avis.note ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="ml-auto text-xs text-muted">{avis.date}</span>
                                            </div>
                                            {avis.titre && <div className="font-medium text-secondary text-sm mb-1">{avis.titre}</div>}
                                            <p className="text-muted text-sm leading-relaxed">{avis.commentaire}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
