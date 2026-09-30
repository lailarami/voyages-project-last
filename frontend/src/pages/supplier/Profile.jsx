import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Lock, Camera, Loader2, Save } from 'lucide-react'
import { authService } from '@/services/api'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

export default function SupplierProfile() {
    const { user, updateUser } = useAuthStore()
    const { t } = useTranslation()
    const [tab, setTab] = useState('profile')
    const [avatarPreview, setAvatarPreview] = useState(null)

    const { register: reg1, handleSubmit: hs1, formState: { isSubmitting: s1 } } = useForm({
        defaultValues: {
            nom: user?.nom,
            prenom: user?.prenom,
            telephone: user?.telephone,
            adresse: user?.adresse,
        },
    })

    const { register: reg2, handleSubmit: hs2, formState: { errors: e2, isSubmitting: s2 } } = useForm()

    const onProfileSave = async (data) => {
        try {
            const fd = new FormData()
            Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v) })
            if (data.avatar?.[0]) fd.append('avatar', data.avatar[0])
            const res = await authService.updateProfile(fd)
            updateUser(res.data.user)
            toast.success(t('sauvegardeProfil'))
        } catch {
            toast.error(t('sauvegardeProfilErreur'))
        }
    }

    const onPasswordSave = async (data) => {
        try {
            await authService.changePassword(data)
            toast.success(t('passwordChanged'))
        } catch (err) {
            toast.error(err.response?.data?.message || t('genericError'))
        }
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-premium p-7 mb-5">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    : user?.avatar
                                        ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        : `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`
                                }
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors shadow-md">
                                <Camera size={13} className="text-white" />
                                <input type="file" className="hidden" accept="image/*"
                                    onChange={e => {
                                        const f = e.target.files?.[0]
                                        if (f) setAvatarPreview(URL.createObjectURL(f))
                                    }}
                                />
                            </label>
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold text-secondary">
                                {user?.prenom} {user?.nom}
                            </h2>
                            <p className="text-muted text-sm">{user?.email}</p>
                            <span className="badge badge-primary capitalize mt-1">{user?.role}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5">
                    {[{ id: 'profile', label: t('informationsPersonnelles') }, { id: 'password', label: t('securite') }].map((tabItem) => (
                        <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tabItem.id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-secondary'}`}>
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                {tab === 'profile' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium p-7">
                        <h3 className="font-semibold text-secondary mb-5">{t('informationsPersonnelles')}</h3>
                        <form onSubmit={hs1(onProfileSave)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">{t('prenom')}</label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                                        <input {...reg1('prenom')} className="input-premium pl-9" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">{t('nom')}</label>
                                    <input {...reg1('nom')} className="input-premium" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5">{t('email')}</label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                                    <input value={user?.email} disabled className="input-premium pl-9 opacity-60 cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5">{t('telephone')}</label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                                    <input {...reg1('telephone')} placeholder="+212 6XX XXX XXX" className="input-premium pl-9" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5">{t('adresse')}</label>
                                <div className="relative">
                                    <MapPin size={15} className="absolute left-3.5 top-3 text-muted" />
                                    <textarea {...reg1('adresse')} rows={2} placeholder={t('adresse')} className="input-premium pl-9 resize-none" />
                                </div>
                            </div>
                            <button type="submit" disabled={s1}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                                {s1 ? <><Loader2 size={16} className="animate-spin" /> {t('enregistrement')}</> : <><Save size={16} /> {t('enregistrer')}</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {tab === 'password' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium p-7">
                        <h3 className="font-semibold text-secondary mb-5">{t('changerMotDePasse')}</h3>
                        <form onSubmit={hs2(onPasswordSave)} className="space-y-4">
                            {['current_password', 'password', 'password_confirmation'].map((name, i) => (
                                <div key={name}>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">
                                        {t(['motDePasseActuel', 'nouveauMotDePasse', 'confirmer'][i])}
                                    </label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                                        <input {...reg2(name, { required: true, minLength: name !== 'current_password' ? 8 : 1 })}
                                            type="password" className="input-premium pl-9" />
                                    </div>
                                </div>
                            ))}
                            <button type="submit" disabled={s2}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                                {s2 ? <><Loader2 size={16} className="animate-spin" /> {t('miseAJour')}</> : t('changerMotDePasse')}
                            </button>
                        </form>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
