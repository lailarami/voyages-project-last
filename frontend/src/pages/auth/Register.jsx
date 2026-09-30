import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

const schema = z.object({
  nom: z.string().min(2, 'Nom requis (min 2 caractères)'),
  prenom: z.string().min(2, 'Prénom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

export default function Register() {
  const [showPass, setShowPass] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    const result = await registerUser(data)
    if (result.success) {
      toast.success(t('accountCreatedSuccess'))
      navigate('/')
    } else {
      const errs = result.errors
      if (errs) {
        Object.values(errs).flat().forEach(e => toast.error(e))
      } else {
        toast.error(result.error || t('accountCreationError'))
      }
    }
  }

  const Field = ({ name, label, type = 'text', placeholder, icon: Icon, extraRight }) => (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />}
        <input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={`input-premium ${Icon ? 'pl-11' : ''} ${extraRight ? 'pr-11' : ''} ${errors[name] ? 'border-danger' : ''}`}
        />
        {extraRight}
      </div>
      {errors[name] && <p className="text-danger text-xs mt-1">{errors[name].message}</p>}
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-secondary mb-2">{t('createAccountTitle')}</h2>
            <p className="text-muted">{t('createAccountSubtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field name="prenom" label={t('prenom')} placeholder={t('firstNamePlaceholder')} icon={User} />
          <Field name="nom" label={t('nom')} placeholder={t('lastNamePlaceholder')} />
        </div>
        <Field name="email" label={t('email')} type="email" placeholder={t('emailPlaceholder')} icon={Mail} />
        <Field name="telephone" label={t('telephone')} placeholder={t('phonePlaceholder')} icon={Phone} />

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">{t('motDePasse')}</label>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`input-premium pl-11 pr-11 ${errors.password ? 'border-danger' : ''}`}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">{t('confirmPassword')}</label>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              {...register('password_confirmation')}
              type={showPass ? 'text' : 'password'}
              placeholder={t('confirmPasswordPlaceholder')}
              className={`input-premium pl-11 ${errors.password_confirmation ? 'border-danger' : ''}`}
            />
          </div>
          {errors.password_confirmation && <p className="text-danger text-xs mt-1">{errors.password_confirmation.message}</p>}
        </div>

        <p className="text-xs text-muted">
          {t('byCreatingAccount')} <a href="#" className="text-primary hover:underline">{t('termsAndConditions')}</a> {t('and')} <a href="#" className="text-primary hover:underline">{t('privacyPolicy')}</a>.
        </p>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {isLoading ? <><Loader2 size={18} className="animate-spin" /> {t('creatingAccount')}</> : t('createAccountButton')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-muted text-sm">{t('alreadyHaveAccount')} </span>
        <button onClick={() => navigate('/login')} className="text-primary font-semibold text-sm hover:underline">{t('connexion')}</button>
      </div>
    </div>
  )
}
