// src/pages/support/Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Headphones, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ticketService } from '@/services/api'
import { Link } from 'react-router-dom'
import useTranslation from '@/hooks/useTranslation'

export default function SupportDashboard() {
  const { t } = useTranslation()
  const { data: dashboardData } = useQuery({
    queryKey: ['support-dashboard'],
    queryFn: () => ticketService.getSupportDashboard().then(r => r.data.data),
  })

  const { data: ticketListData } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => ticketService.getSupportAll().then(r => r.data),
  })

  const stats = [
    { label: t('supportTotalTickets'), value: dashboardData?.status_counts?.total || 0, icon: Headphones, color: 'bg-primary' },
    { label: t('statusOpen'), value: dashboardData?.status_counts?.ouvert || 0, icon: Clock, color: 'bg-accent' },
    { label: t('statusInProgress'), value: dashboardData?.status_counts?.en_cours || 0, icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: t('statusResolved'), value: dashboardData?.status_counts?.resolu || 0, icon: CheckCircle, color: 'bg-success' },
  ]

  const chartData = dashboardData?.tickets_by_day?.map((item) => ({
    name: new Date(item.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }),
    tickets: Number(item.total),
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('supportTitle')}</h1>
          <p className="text-muted text-sm mt-1">Statistiques en temps réel du support</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 w-full lg:w-auto">
          <div className="card-premium p-5">
            <div className="text-muted text-xs uppercase tracking-wide mb-2">Tickets aujourd'hui</div>
            <div className="font-display text-3xl font-bold text-secondary">{dashboardData?.today_count ?? 0}</div>
          </div>
          <div className="card-premium p-5">
            <div className="text-muted text-xs uppercase tracking-wide mb-2">Jours suivis</div>
            <div className="font-display text-3xl font-bold text-secondary">{chartData.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="card-premium p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="font-display text-2xl font-bold text-secondary">{value}</div>
            <div className="text-muted text-xs mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-secondary">Évolution des tickets</h2>
            <p className="text-muted text-xs">Dernières demandes et réponses du support</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: 'none', borderRadius: 12, color: '#F8FAFC', fontSize: 12 }}
                formatter={(value) => [value, 'Tickets']}
              />
              <Line type="monotone" dataKey="tickets" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-secondary">{t('supportRecentTickets')}</h2>
          <Link to="/support/tickets" className="text-primary text-sm hover:underline">{t('allTickets')}</Link>
        </div>
        <div className="space-y-3">
          {ticketListData?.data?.slice(0, 6).map(ticket => (
            <div key={ticket.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {ticket.user?.nom?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <div className="font-medium text-secondary text-sm">{ticket.sujet}</div>
                  <div className="text-xs text-muted">{ticket.user?.nom} · {ticket.created_at}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${ticket.priorite === 'urgente' ? 'badge-danger' :
                  ticket.priorite === 'haute' ? 'badge-primary' : 'badge-muted'} capitalize`}>{ticket.priorite}</span>
                <span className={`badge ${ticket.statut === 'ouvert' ? 'badge-accent' :
                  ticket.statut === 'en_cours' ? 'badge-primary' : 'badge-success'}`}>{ticket.statut}</span>
              </div>
            </div>
          ))}
          {!ticketListData?.data?.length && (
            <div className="text-center py-8 text-muted">{t('supportNoTickets')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
