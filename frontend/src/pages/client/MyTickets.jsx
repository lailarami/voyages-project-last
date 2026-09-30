import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Search, Plus, MessageSquare, Send, ChevronDown, X,
  Clock, CheckCircle, Loader2
} from 'lucide-react'
import { ticketService } from '@/services/api'
import toast from 'react-hot-toast'
import useTranslation from '@/hooks/useTranslation'

const statutConfig = {
  ouvert: { cls: 'badge-accent', labelKey: 'statusOpen' },
  en_cours: { cls: 'badge-primary', labelKey: 'statusInProgress' },
  resolu: { cls: 'badge-success', labelKey: 'statusResolved' },
  ferme: { cls: 'badge-secondary', labelKey: 'statusClosed' },
}

export default function MyTickets() {
  const { t } = useTranslation()
  const [showCreate, setShowCreate] = useState(false)
  const [openTicket, setOpenTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [statut, setStatut] = useState('')
  const [search, setSearch] = useState('')
  const [newReplyAlert, setNewReplyAlert] = useState(null)
  const qc = useQueryClient()

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['my-tickets', statut, search],
    queryFn: () => ticketService.getMy({ statut, search }).then(r => r.data.data || []),
  })

  // Poll for new staff replies and notify the client
  const lastUnreadRef = useRef({})
  const lastReplyRef = useRef({})

  useEffect(() => {
    // initialize refs from current data so first poll doesn't spam
    if (data && data.length) {
      data.forEach(t => {
        lastUnreadRef.current[t.id] = !!t.has_unread_responses
        lastReplyRef.current[t.id] = t.last_reply_date
      })
    }

    const poll = async () => {
      try {
        const res = await ticketService.getMy()
        const list = res.data.data || []
        let shouldRefresh = false

        list.forEach(ticket => {
          const wasUnread = !!lastUnreadRef.current[ticket.id]
          const prevReply = lastReplyRef.current[ticket.id]
          const currReply = ticket.last_reply_date
          const isStaffReply = ticket.last_reply_is_staff

          if (ticket.has_unread_responses && !wasUnread && isStaffReply) {
            shouldRefresh = true
            setNewReplyAlert({ ticket, message: `Support a répondu à votre ticket ${ticket.numero}` })
            toast.success(`Support a répondu à votre ticket ${ticket.numero}`)
          } else if (currReply && prevReply && currReply !== prevReply && isStaffReply) {
            shouldRefresh = true
            setNewReplyAlert({ ticket, message: `Support a répondu à votre ticket ${ticket.numero}` })
            toast.success(`Support a répondu à votre ticket ${ticket.numero}`)
          } else if (currReply && !prevReply && isStaffReply) {
            shouldRefresh = true
            setNewReplyAlert({ ticket, message: `Support a répondu à votre ticket ${ticket.numero}` })
            toast.success(`Support a répondu à votre ticket ${ticket.numero}`)
          }

          lastUnreadRef.current[ticket.id] = !!ticket.has_unread_responses
          lastReplyRef.current[ticket.id] = ticket.last_reply_date
        })

        if (shouldRefresh) {
          qc.invalidateQueries(['my-tickets'])
          if (openTicket?.id) {
            qc.invalidateQueries(['ticket-detail', openTicket.id])
          }
        }
      } catch (e) {
        // ignore polling errors
      }
    }

    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [data, openTicket, qc])

  const { data: detail = {} } = useQuery({
    queryKey: ['ticket-detail', openTicket?.id],
    queryFn: () => ticketService.getById(openTicket.id).then(r => r.data.data || {}),
    enabled: !!openTicket,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMutation = useMutation({
    mutationFn: (d) => ticketService.create(d),
    onSuccess: () => {
      toast.success(t('ticketCreatedSuccess') || 'Ticket created!')
      reset()
      setShowCreate(false)
      qc.invalidateQueries(['my-tickets'])
    },
    onError: (error) => {
      const message = error.response?.data?.message ||
        error.response?.data?.errors?.message?.[0] ||
        error.response?.data?.errors?.sujet?.[0] ||
        'Impossible de créer le ticket.'
      toast.error(message)
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => ticketService.reply(id, { message }),
    onSuccess: () => {
      setReplyText('')
      qc.invalidateQueries(['ticket-detail', openTicket?.id])
    },
  })

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary">{t('supportTitle')}</h1>
            <p className="text-muted mt-0.5">{t('supportDescription')}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {t('newTicket')}
          </button>
        </div>

        <div className="card-premium p-4 mb-6 grid gap-3 sm:grid-cols-2 items-end">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchTicketsPlaceholder')}
              className="input-premium pl-11 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">{t('filterByStatus')}</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}
              className="input-premium w-full">
              <option value="">{t('allStatuses')}</option>
              <option value="ouvert">{t('statusOpen')}</option>
              <option value="en_cours">{t('statusInProgress')}</option>
              <option value="resolu">{t('statusResolved')}</option>
            </select>
          </div>
        </div>

        {newReplyAlert && (
          <div className="rounded-3xl border border-yellow-300 bg-yellow-50 p-5 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-800">{newReplyAlert.message}</p>
              <p className="text-sm text-yellow-700/80">{t('clickTicketToReply')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOpenTicket(newReplyAlert.ticket)
                  setNewReplyAlert(null)
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                {t('viewTicket')}
              </button>
              <button onClick={() => setNewReplyAlert(null)} className="text-yellow-700 underline text-sm">
                {t('ignore')}
              </button>
            </div>
          </div>
        )}

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="card-premium p-7 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-secondary">{t('newTicket')}</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">{t('ticketSubject')} *</label>
                    <input {...register('sujet', { required: true })} placeholder={t('ticketMessagePlaceholder')}
                      className={`input-premium ${errors.sujet ? 'border-danger' : ''}`} />
                    {errors.sujet && (
                      <p className="text-xs text-danger mt-1">{t('ticketSubject')} est requis.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">Catégorie</label>
                    <select {...register('categorie')} className="input-premium">
                      <option value="">Choisir…</option>
                      <option value="reservation">Réservation</option>
                      <option value="paiement">Paiement</option>
                      <option value="info">Information</option>
                      <option value="reclamation">Réclamation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">Priorité</label>
                    <select {...register('priorite')} className="input-premium">
                      <option value="normale">Normale</option>
                      <option value="faible">Faible</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1.5">Message *</label>
                    <textarea {...register('message', { required: true, minLength: 10 })}
                      rows={4} placeholder="Décrivez votre demande en détail…"
                      className={`input-premium resize-none ${errors.message ? 'border-danger' : ''}`} />
                    {errors.message && (
                      <p className="text-xs text-danger mt-1">
                        {errors.message.type === 'minLength'
                          ? 'Le message doit contenir au moins 10 caractères.'
                          : 'Le message est requis.'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary px-5 py-2.5">
                      Annuler
                    </button>
                    <button type="submit" disabled={createMutation.isPending}
                      className="btn-primary px-5 py-2.5 flex items-center gap-2">
                      {createMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Envoi…</> : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tickets list */}
        {error && (
          <div className="card-premium p-14 text-center bg-danger/5 border border-danger/20">
            <MessageSquare size={40} className="text-danger mx-auto mb-4 opacity-30" />
            <h3 className="font-display text-xl font-bold text-danger mb-2">Erreur</h3>
            <p className="text-danger/70 mb-5">{error.message || t('ticketError')}</p>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : data.length === 0 ? (
          <div className="card-premium p-14 text-center">
            <MessageSquare size={40} className="text-muted mx-auto mb-4 opacity-30" />
            <h3 className="font-display text-xl font-bold text-secondary mb-2">{t('noTickets')}</h3>
            <p className="text-muted mb-5">{t('noSupportTickets')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map(ticket => {
              const cfg = statutConfig[ticket.statut] || {}
              const isOpen = openTicket?.id === ticket.id
              return (
                <div key={ticket.id} className="card-premium overflow-hidden">
                  <button onClick={() => setOpenTicket(isOpen ? null : ticket)}
                    className="w-full p-5 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors relative">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                      <MessageSquare size={18} className="text-primary" />
                      {ticket.has_unread_responses && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-xs text-primary font-mono">{ticket.numero}</code>
                        <span className={`badge ${cfg.cls}`}>{t(cfg.labelKey)}</span>
                        {ticket.has_unread_responses && (
                          <span className="badge-danger text-xs">Nouveau</span>
                        )}
                      </div>
                      <div className="font-semibold text-secondary text-sm">{ticket.sujet}</div>
                      <div className="text-xs text-muted truncate">{ticket.message}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted">{ticket.created_at}</span>
                      <ChevronDown size={16} className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                        <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
                          {/* Original */}
                          <div className="bg-gray-50 rounded-xl p-4 text-sm text-secondary">{ticket.message}</div>

                          {/* Replies */}
                          {detail?.reponses?.map(rep => (
                            <div key={rep.id} className={`flex gap-3 ${rep.is_staff ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                ${rep.is_staff ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {rep.is_staff ? '🎧' : 'M'}
                              </div>
                              <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm
                                ${rep.is_staff ? 'bg-primary text-white rounded-tr-sm' : 'bg-gray-100 text-secondary rounded-tl-sm'}`}>
                                {rep.message}
                              </div>
                            </div>
                          ))}
                        </div>

                        {ticket.statut !== 'resolu' && (
                          <div className="px-5 pb-5 flex gap-2">
                            <input value={replyText} onChange={e => setReplyText(e.target.value)}
                              placeholder={t('ticketMessagePlaceholder')}
                              className="input-premium flex-1 py-2.5 text-sm" />
                            <button
                              onClick={() => replyMutation.mutate({ id: ticket.id, message: replyText })}
                              disabled={!replyText.trim() || replyMutation.isPending}
                              className="btn-primary px-4 py-2.5 disabled:opacity-50">
                              <Send size={16} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

