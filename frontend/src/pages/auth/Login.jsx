import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  const { t } = useTranslation()

  const onSubmit = async (data) => {
    const result = await login(data)
    if (result.success) {
      toast.success(t('welcomeBack'))
      const redirectMap = {
        admin: '/admin',
        fournisseur: '/fournisseur',
        support: '/support',
        client: from,
      }
      navigate(redirectMap[result.user.role] || from, { replace: true })
    } else {
      toast.error(result.error || t('invalidCredentials'))
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-secondary mb-2">{t('welcomeBack')}</h2>
            <p className="text-muted">{t('loginSubtitle')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">{t('email')}</label>
          <div className="relative">
            <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              {...register('email')}
              type="email"
              placeholder={t('emailPlaceholder')}
              className={`input-premium pl-11 ${errors.email ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}`}
            />
          </div>
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-secondary">{t('motDePasse')}</label>
            <a href="#" className="text-xs text-primary hover:underline">{t('forgotPassword')}</a>
          </div>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`input-premium pl-11 pr-11 ${errors.password ? 'border-danger' : ''}`}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* demo accounts hint removed */}

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          {isLoading ? <><Loader2 size={18} className="animate-spin" /> {t('signingIn')}</> : t('connexion')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-muted text-sm">{t('noAccount')} </span>
        <button onClick={() => navigate('/register')} className="text-primary font-semibold text-sm hover:underline">
          {t('createAccount')}
        </button>
      </div>
    </div>
  )
}
