import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, CardElement, useStripe, useElements
} from '@stripe/react-stripe-js'
import useTranslation from '@/hooks/useTranslation'
import {
  ShieldCheck, CreditCard, MapPin, CalendarCheck,
  Users, ArrowLeft, Loader2, CheckCircle, XCircle, Clock
} from 'lucide-react'
import { reservationService, paiementService } from '@/services/api'
import toast from 'react-hot-toast'

const stripeRawKey = import.meta.env.VITE_STRIPE_KEY || ''
const isStripePublishableKey = stripeRawKey.startsWith('pk_')
const stripePromise = isStripePublishableKey ? loadStripe(stripeRawKey) : null

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#0F172A',
      fontFamily: '"DM Sans", sans-serif',
      '::placeholder': { color: '#94A3B8' },
      iconColor: '#2563EB',
    },
    invalid: { color: '#EF4444', iconColor: '#EF4444' },
  },
}

// ── Inner form component (needs Stripe context) ─────────────────────────────
function CheckoutForm({ reservation, clientSecret, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const { t, formatCurrency } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setLoading(true)

    try {
      const card = elements.getElement(CardElement)
      if (!card) {
        toast.error(t('enterCardDetails') || 'Veuillez renseigner les informations de carte.')
        setLoading(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${reservation?.user?.nom || ''} ${reservation?.user?.prenom || ''}`.trim(),
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        await paiementService.confirm({
          payment_intent_id: paymentIntent.id,
          reservation_id: reservation.id,
        })
        onSuccess()
      } else {
        toast.error(t('paymentNotFinalized') || 'Paiement non finalisé. Réessayez.')
        setLoading(false)
      }
    } catch (err) {
      toast.error(t('paymentError') || 'Erreur lors du paiement. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Informations de carte
        </label>
        <div className="input-premium p-4">
          <CardElement options={CARD_OPTIONS} onChange={e => setCardComplete(e.complete)} />
        </div>
        <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-success" />
          {t('paymentSecureStripe')}
        </p>
      </div>

      {/* Test card hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        <div className="font-semibold mb-1">🧪 {t('testStripeCard')}</div>
        <div>4242 4242 4242 4242 · Exp: 12/28 · CVC: 123</div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !cardComplete || loading}
        className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50"
      >
        {loading
          ? <><Loader2 size={20} className="animate-spin" /> {t('processing')}</>
          : <><CreditCard size={20} /> {t('pay')} {formatCurrency(reservation?.montant_total)}</>
        }
      </button>
    </form>
  )
}

function SimulatedCheckoutForm({ reservation, paymentIntentId, onSuccess }) {
  const { t, formatCurrency } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('carte')
  const [card, setCard] = useState({ numero: '', expiration: '', cvc: '', titulaire: '' })
  const [formErrors, setFormErrors] = useState({})

  const validateSimulatedPayment = () => {
    const errors = {}
    if (!method) {
      errors.method = t('requiredField') || 'Sélectionnez une méthode de paiement.'
    }
    if (method === 'carte') {
      if (!card.numero.trim()) errors.numero = t('requiredField') || 'Le numéro de carte est requis.'
      if (!card.expiration.trim()) errors.expiration = t('requiredField') || 'La date d’expiration est requise.'
      if (!card.cvc.trim()) errors.cvc = t('requiredField') || 'Le code CVC est requis.'
      if (!card.titulaire.trim()) errors.titulaire = t('requiredField') || 'Le titulaire est requis.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSimSubmit = async (e) => {
    e.preventDefault()
    if (!validateSimulatedPayment()) {
      toast.error(t('fillAllRequiredFields') || 'Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true)
    try {
      await paiementService.confirm({ payment_intent_id: paymentIntentId, reservation_id: reservation.id })
      onSuccess()
    } catch (err) {
      toast.error(t('simulatedPaymentError') || 'Erreur lors du paiement simulé.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSimSubmit} className="space-y-6">
      <div className="rounded-3xl border border-slate-200 p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-secondary mb-5">{t('paymentMethod')}</h3>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-secondary">{t('cardNumber')}</span>
            <input
              type="text"
              value={card.numero}
              onChange={(e) => setCard({ ...card, numero: e.target.value })}
              placeholder="1234 5678 9012 3456"
              className={`input-premium mt-2 ${formErrors.numero ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}`}
            />
            {formErrors.numero && <p className="text-danger text-xs mt-1">{formErrors.numero}</p>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-secondary">{t('expiration')}</span>
              <input
                type="text"
                value={card.expiration}
                onChange={(e) => setCard({ ...card, expiration: e.target.value })}
                placeholder="MM / AA"
                className={`input-premium mt-2 ${formErrors.expiration ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}`}
              />
              {formErrors.expiration && <p className="text-danger text-xs mt-1">{formErrors.expiration}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-secondary">{t('cvc')}</span>
              <input
                type="text"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                placeholder="123"
                className={`input-premium mt-2 ${formErrors.cvc ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}`}
              />
              {formErrors.cvc && <p className="text-danger text-xs mt-1">{formErrors.cvc}</p>}
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-secondary">{t('cardHolderName')}</span>
            <input
              type="text"
              value={card.titulaire}
              onChange={(e) => setCard({ ...card, titulaire: e.target.value })}
              placeholder="Tel que sur la carte"
              className={`input-premium mt-2 ${formErrors.titulaire ? 'border-danger focus:ring-danger/30 focus:border-danger' : ''}`}
            />
            {formErrors.titulaire && <p className="text-danger text-xs mt-1">{formErrors.titulaire}</p>}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 text-base"
      >
        {loading ? t('processing') : `${t('pay')} ${reservation && formatCurrency(reservation.montant_total)}`}
      </button>
    </form>
  )
}

// ── Main Checkout Page ───────────────────────────────────────────────────────
export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, formatCurrency, formatDate } = useTranslation()
  const [clientSecret, setClientSecret] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loadingIntent, setLoadingIntent] = useState(true)
  const [initError, setInitError] = useState('')
  const [simulatedMode, setSimulatedMode] = useState(false)
  const [simPaymentIntentId, setSimPaymentIntentId] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const { data: res } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationService.getById(id).then(r => r.data.data),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => reservationService.cancel(id, { motif: 'Annulée par le client' }),
    onSuccess: () => {
      toast.success(t('reservationCanceled') || 'Réservation annulée.')
      navigate('/mes-reservations')
    },
    onError: () => toast.error(t('reservationCancelError') || 'Impossible d’annuler la réservation.'),
  })

  useEffect(() => {
    if (!id) return
    if (res?.statut !== 'confirmee') {
      setClientSecret(null)
      setSimulatedMode(false)
      setSimPaymentIntentId(null)
      setLoadingIntent(false)
      return
    }

    setLoadingIntent(true)
    setInitError('')
    paiementService.createIntent({ reservation_id: id })
      .then((response) => {
        const secret = response?.data?.client_secret
        if (!secret) {
          throw new Error(response?.data?.message || t('paymentInitError'))
        }
        setClientSecret(secret)
        if (response?.data?.simulated) {
          setSimulatedMode(true)
          setSimPaymentIntentId(response?.data?.payment_intent_id || null)
        } else {
          setSimulatedMode(false)
          setSimPaymentIntentId(null)
        }
      })
      .catch((error) => {
        const message = error.response?.data?.message || error.message || t('paymentInitError')
        setInitError(message)
        toast.error(message)
      })
      .finally(() => setLoadingIntent(false))
  }, [id, retryKey, res?.statut])

  const handleSuccess = () => {
    setSuccess(true)
    toast.success(t('paymentConfirmed') || 'Paiement confirmé ! 🎉')
  }

  const handleDownloadInvoice = async () => {
    if (!id) return
    setInvoiceLoading(true)
    try {
      const response = await paiementService.downloadInvoiceByReservation(id)

      // If server returned JSON (error) instead of PDF, try to parse and show message
      const contentType = response.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        // convert blob/arraybuffer to text then parse
        const text = await new Response(response.data).text()
        let msg = 'Impossible de télécharger la facture.'
        try { const json = JSON.parse(text); msg = json.message || msg } catch { msg = text || msg }
        throw new Error(msg)
      }

      // Support Blob or ArrayBuffer
      const data = response.data
      let blob
      if (data instanceof Blob) blob = data
      else blob = new Blob([data], { type: 'application/pdf' })

      const link = document.createElement('a')
      const blobUrl = URL.createObjectURL(blob)
      link.href = blobUrl
      link.download = `facture-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // revoke after a short delay to ensure download started
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
      toast.success(t('invoiceDownloaded') || 'Facture téléchargée')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('invoiceDownloadError') || 'Impossible de télécharger la facture.'
      toast.error(msg)
    } finally {
      setInvoiceLoading(false)
    }
  }

  if (!isStripePublishableKey) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="card-premium p-10 max-w-xl text-center">
          <h1 className="text-2xl font-bold text-secondary mb-4">{t('stripeErrorTitle')}</h1>
          <p className="text-muted mb-4">
            {t('stripeErrorDescription')}
          </p>
          <p className="text-sm text-danger mb-6">
            {t('stripeErrorInstructions')}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-3"
          >
            {t('retryAfterFix')}
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-12 text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-success" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-secondary mb-3">
            {t('paymentSuccess')}
          </h2>
          <p className="text-muted mb-2">
            {t('reservationConfirmed')}
          </p>
          <div className="space-y-4 mt-8">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3"
            >
              {invoiceLoading ? <><Loader2 size={18} className="animate-spin" /> {t('downloadInvoice')}</> : t('downloadInvoice')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mes-reservations')}
              className="btn-secondary w-full py-4"
            >
              {t('backToReservations')}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted hover:text-primary transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> {t('back')}
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-secondary mb-8"
        >
          {t('finalizeBooking')}
        </motion.h1>

        {/* Unconfirmed reservation notice */}
        {res?.statut === 'en_attente' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/10 border border-accent rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <div className="flex-shrink-0 pt-0.5">
              <Clock size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary mb-1">{t('reservationPending')}</h3>
              <p className="text-sm text-muted">
                {t('reservationPendingDesc')}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Payment form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-premium p-7"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-secondary">{t('paymentSecure')}</h2>
                <p className="text-muted text-xs">{t('poweredByStripe')}</p>
              </div>
            </div>

            {loadingIntent ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : res?.statut === 'en_attente' ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <h3 className="text-lg font-semibold mb-2">{t('paymentPendingTitle')}</h3>
                <p className="text-sm text-amber-900/90">
                  {t('paymentPendingMessage')}
                </p>
              </div>
            ) : clientSecret ? (
              simulatedMode ? (
                <SimulatedCheckoutForm reservation={res} paymentIntentId={simPaymentIntentId} onSuccess={handleSuccess} />
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    reservation={res}
                    clientSecret={clientSecret}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              )
            ) : (
              <div className="text-center py-8 text-danger space-y-4">
                <p>{initError || t('paymentInitError')}</p>
                <button
                  type="button"
                  onClick={() => setRetryKey((prev) => prev + 1)}
                  className="btn-secondary mx-auto px-6 py-3"
                >
                  {t('retry')}
                </button>
              </div>
            )}
          </motion.div>

          {/* Right — Order summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Voyage card */}
            {res?.voyage && (
              <div className="card-premium overflow-hidden">
                {res.voyage.image && (
                  <div className="h-44 overflow-hidden">
                    <img src={res.voyage.image} alt={res.voyage.titre}
                      className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display font-bold text-secondary text-lg mb-3">
                    {res.voyage.titre}
                  </h3>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      {res.voyage.destination}
                    </div>
                    {res.voyage.date_depart && (
                      <div className="flex items-center gap-2">
                        <CalendarCheck size={14} className="text-primary" />
                        {formatDate(res.voyage.date_depart)}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-primary" />
                      {res?.nombre_places} place(s)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price summary */}
            <div className="card-premium p-5">
              <h3 className="font-semibold text-secondary mb-4">{t('summary')}</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{t('pricePerPerson')}</span>
                  <span>{res && formatCurrency(res.montant_total / res.nombre_places)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t('numberOfSeats')}</span>
                  <span>× {res?.nombre_places}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-display font-bold text-secondary text-lg">
                  <span>{t('total')}</span>
                  <span className="text-primary">{res && formatCurrency(res.montant_total)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                <ShieldCheck size={14} className="text-success flex-shrink-0" />
                {t('freeCancellation')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cancel button — visible only for unpaid pending reservations */}
        {res?.statut === 'en_attente' && !res.is_payee && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-md mx-auto"
          >
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('cancelConfirmation') || 'Êtes-vous sûr ? Cette action est irréversible.')) {
                  cancelMutation.mutate()
                }
              }}
              disabled={cancelMutation.isLoading}
              className="w-full bg-danger/10 hover:bg-danger/20 border border-danger text-danger rounded-xl px-6 py-4 flex items-center justify-center gap-2 text-base font-medium transition-all disabled:opacity-50"
            >
              {cancelMutation.isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> {t('canceling') || 'Annulation en cours…'}</>
              ) : (
                <><XCircle size={18} /> {t('annuler')}</>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

