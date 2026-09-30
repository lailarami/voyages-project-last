import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import {
  Search, MessageSquare, CheckCircle, Clock,
  AlertTriangle, ChevronDown, Send, X, Trash2
} from 'lucide-react'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { ticketService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'
import toast from 'react-hot-toast'

const prioriteConfig = {
  faible: { cls: 'badge-muted', label: 'Faible' },
  normale: { cls: 'badge-accent', label: 'Normale' },
  haute: { cls: 'badge-primary', label: 'Haute' },
  urgente: { cls: 'badge-danger', label: 'Urgente' },
}

const statutConfig = {
  ouvert: { cls: 'badge-accent', label: 'Ouvert', icon: Clock },
  en_cours: { cls: 'badge-primary', label: 'En cours', icon: MessageSquare },
  resolu: { cls: 'badge-success', label: 'Résolu', icon: CheckCircle },
}

export default function AdminTickets() {
  const [statut, setStatut] = useState('')
  const [priorite, setPriorite] = useState('')
  const [search, setSearch] = useState('')
  const { t } = useTranslation()
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const location = useLocation()
  const isSupportRoute = location.pathname.startsWith('/support')
  const isAdminRoute = location.pathname.startsWith('/admin')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', statut, priorite, search, isSupportRoute],
    queryFn: () => isSupportRoute
      ? ticketService.getSupportAll({ statut, priorite, search }).then(r => r.data)
      : ticketService.getAdminAll({ statut, priorite, search }).then(r => r.data),
  })

  const { data: ticketDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['ticket-detail', selectedTicket?.id, isSupportRoute],
    queryFn: () => isSupportRoute
      ? ticketService.getSupportById(selectedTicket.id).then(r => r.data.data)
      : ticketService.getById(selectedTicket.id).then(r => r.data.data),
    enabled: !!selectedTicket,
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => ticketService.replySupport(id, { message }),
    onSuccess: () => {
      toast.success('Réponse envoyée')
      setReplyText('')
      qc.invalidateQueries(['ticket-detail', selectedTicket?.id, isSupportRoute])
      qc.invalidateQueries(['tickets', statut, priorite, search, isSupportRoute])
    },
  })

  const closeMutation = useMutation({
    mutationFn: (id) => isSupportRoute
      ? ticketService.closeSupport(id)
      : ticketService.closeAdmin(id),
    onSuccess: () => {
      toast.success('Ticket résolu')
      qc.invalidateQueries(['tickets', statut, priorite, search, isSupportRoute])
      qc.invalidateQueries(['ticket-detail', selectedTicket?.id, isSupportRoute])
    },
  })

  const assignMutation = useMutation({
    mutationFn: (id) => ticketService.assignSupport(id),
    onSuccess: () => {
      toast.success('Ticket marqué en cours')
      qc.invalidateQueries(['tickets', statut, priorite, search, isSupportRoute])
      qc.invalidateQueries(['ticket-detail', selectedTicket?.id, isSupportRoute])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => ticketService.delete(id),
    onSuccess: () => {
      toast.success('Ticket supprimé')
      setSelectedTicket(null)
      qc.invalidateQueries(['tickets', statut, priorite, search, isSupportRoute])
    },
  })

  const exportColumns = [
    { label: 'Numéro', value: 'numero' },
    { label: 'Sujet', value: 'sujet' },
    { label: 'Client', value: (ticket) => ticket.user?.nom || '—' },
    { label: 'Statut', value: 'statut' },
    { label: 'Priorité', value: 'priorite' },
    { label: 'Date', value: 'created_at' },
    { label: 'Message', value: 'message' },
  ]

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    replyMutation.mutate({ id: selectedTicket.id, message: replyText })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('supportTickets')}</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta?.total || 0} {t('supportTickets')}</p>
        </div>
        <ExportCsvButton filename="tickets.csv" columns={exportColumns} rows={data?.data || []} />
      </div>

      {/* Filters */}
      <div className="card-premium p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input placeholder="Rechercher..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-premium pl-10" />
        </div>
        <select value={statut} onChange={e => setStatut(e.target.value)}
          className="input-premium w-auto px-4">
          <option value="">Tous les statuts</option>
          {Object.entries(statutConfig).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select value={priorite} onChange={e => setPriorite(e.target.value)}
          className="input-premium w-auto px-4">
          <option value="">Toutes priorités</option>
          {Object.entries(prioriteConfig).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className={`${selectedTicket ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : ''}`}>
        {/* Tickets list */}
        <div className="space-y-3">
          {isLoading
            ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
            : data?.data?.map(ticket => {
              const sConfig = statutConfig[ticket.statut] || {}
              const pConfig = prioriteConfig[ticket.priorite] || {}
              const isSelected = selectedTicket?.id === ticket.id
              return (
                <motion.div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(isSelected ? null : ticket)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card-premium p-4 cursor-pointer transition-all border-2
                      ${isSelected ? 'border-primary shadow-glow' : 'border-transparent hover:border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <code className="text-xs text-primary font-mono">{ticket.numero}</code>
                        <span className={`badge ${sConfig.cls || 'badge-muted'}`}>
                          {sConfig.label || ticket.statut}
                        </span>
                        <span className={`badge ${pConfig.cls || 'badge-muted'}`}>
                          {pConfig.label || ticket.priorite}
                        </span>
                      </div>
                      <div className="font-semibold text-secondary text-sm mb-1 truncate">
                        {ticket.sujet}
                      </div>
                      <div className="text-muted text-xs truncate">{ticket.message}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted">{ticket.user?.nom}</div>
                      <div className="text-xs text-muted mt-0.5">{ticket.created_at}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          }
          {!isLoading && data?.data?.length === 0 && (
            <div className="card-premium p-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-muted">Aucun ticket correspondant</p>
            </div>
          )}
        </div>

        {/* Ticket detail + reply */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="card-premium flex flex-col"
              style={{ maxHeight: '75vh' }}
            >
              {/* Detail header */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs text-primary font-mono">{selectedTicket.numero}</code>
                    {isSupportRoute && selectedTicket.statut === 'ouvert' && (
                      <button
                        onClick={() => assignMutation.mutate(selectedTicket.id)}
                        className="badge badge-primary cursor-pointer hover:bg-primary/20 transition-colors mr-2"
                      >
                        <MessageSquare size={11} /> Marquer en cours
                      </button>
                    )}
                    {selectedTicket.statut !== 'resolu' && (
                      <button
                        onClick={() => closeMutation.mutate(selectedTicket.id)}
                        className="badge badge-success cursor-pointer hover:bg-success/20 transition-colors mr-2"
                      >
                        <CheckCircle size={11} /> Marquer résolu
                      </button>
                    )}
                    {isAdminRoute && (
                      <button
                        onClick={() => deleteMutation.mutate(selectedTicket.id)}
                        className="badge badge-danger cursor-pointer hover:bg-danger/20 transition-colors"
                      >
                        <Trash2 size={11} /> Supprimer
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold text-secondary">{selectedTicket.sujet}</h3>
                  <p className="text-muted text-xs mt-0.5">
                    {selectedTicket.user?.nom} · {selectedTicket.created_at}
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {selectedTicket.user?.nom?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-secondary text-sm">{selectedTicket.message}</p>
                    </div>
                    <div className="text-xs text-muted mt-1">{selectedTicket.created_at}</div>
                  </div>
                </div>

                {/* Replies */}
                {loadingDetail ? (
                  <div className="skeleton h-16 rounded-2xl" />
                ) : (
                  ticketDetail?.reponses?.map(rep => (
                    <div key={rep.id} className={`flex gap-3 ${rep.is_staff ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${rep.is_staff ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {rep.is_staff ? '🎧' : rep.user?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`flex-1 ${rep.is_staff ? 'items-end' : ''}`}>
                        <div className={`rounded-2xl px-4 py-3 inline-block max-w-[85%]
                          ${rep.is_staff
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-gray-50 text-secondary rounded-tl-sm'}`}>
                          <p className="text-sm">{rep.message}</p>
                        </div>
                        <div className={`text-xs text-muted mt-1 ${rep.is_staff ? 'text-right' : ''}`}>
                          {rep.user} · {rep.date}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply box */}
              {isSupportRoute && selectedTicket.statut !== 'resolu' && (
                <form onSubmit={handleReply}
                  className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Répondre au ticket..."
                    className="input-premium flex-1 py-2.5 text-sm"
                  />
                  <button type="submit" disabled={!replyText.trim() || replyMutation.isPending}
                    className="btn-primary px-4 py-2.5 disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
