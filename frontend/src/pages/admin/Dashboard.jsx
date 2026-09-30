import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, Map, CalendarCheck, CreditCard, TrendingUp, TrendingDown,
  Star, Headphones, ArrowUpRight, RefreshCw, Activity
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { adminService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

const COLORS = ['#2563EB', '#06B6D4', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6']

function KPICard({ title, value, subtitle, icon: Icon, color, trend, trendValue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="card-premium p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg
            ${trend === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-secondary mb-1">{value}</div>
      <div className="text-sm font-medium text-secondary mb-0.5">{title}</div>
      {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.dashboard().then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { t } = useTranslation()
  const formatMAD = (v) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v) + ' MAD'
  const formatNum = (v) => new Intl.NumberFormat('fr-MA').format(v)

  const revenueData = data?.revenu_mensuel?.map(m => ({
    name: new Date(m.jour).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }),
    revenu: parseFloat(m.total),
    reservations: parseInt(m.nb),
  })) || []

  const statusData = data?.reservations_statut
    ? Object.entries(data.reservations_statut).map(([name, value]) => ({ name, value: parseInt(value) }))
    : []

  const statusLabels = {
    confirmee: 'Confirmées',
    en_attente: 'En attente',
    annulee: 'Annulées',
    terminee: 'Terminées',
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('dashboard')}</h1>
          <p className="text-muted text-sm mt-0.5">{t('dashboardOverview')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-muted hover:text-primary transition-colors"
        >
          <RefreshCw size={14} /> {t('refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Total clients" value={formatNum(data?.stats?.total_users || 0)}
          subtitle="Clients inscrits" icon={Users} color="bg-primary" trend="up" trendValue={12} />
        <KPICard title="Voyages actifs" value={formatNum(data?.stats?.total_voyages || 0)}
          subtitle="Disponibles" icon={Map} color="bg-accent" trend="up" trendValue={5} />
        <KPICard title="Réservations" value={formatNum(data?.stats?.total_reservations || 0)}
          subtitle="Total toutes périodes" icon={CalendarCheck} color="bg-success" trend="up" trendValue={8} />
        <KPICard title="Revenu total" value={formatMAD(data?.stats?.total_revenu || 0)}
          subtitle="Paiements confirmés" icon={CreditCard} color="bg-orange-500" trend="up" trendValue={18} />
        <KPICard title="Ce mois" value={formatNum(data?.stats?.reservations_mois || 0)}
          subtitle="Nouvelles réservations" icon={Activity} color="bg-purple-500" />
        <KPICard title="Revenu mois" value={formatMAD(data?.stats?.revenu_mois || 0)}
          subtitle="Mois en cours" icon={TrendingUp} color="bg-emerald-500" />
        <KPICard title="Tickets ouverts" value={formatNum(data?.stats?.tickets_ouverts || 0)}
          subtitle="En attente de réponse" icon={Headphones} color="bg-yellow-500" />
        <KPICard title="Avis en attente" value={formatNum(data?.stats?.nouveaux_avis || 0)}
          subtitle="À modérer" icon={Star} color="bg-pink-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-secondary">Évolution des revenus</h3>
              <p className="text-muted text-xs">Derniers jours</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: 'none', borderRadius: 12, color: '#F8FAFC', fontSize: 12 }}
                formatter={v => [formatMAD(v), 'Revenu']}
              />
              <Line type="monotone" dataKey="revenu" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart statut */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-secondary mb-1">Réservations par statut</h3>
          <p className="text-muted text-xs mb-6">Répartition actuelle</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={4} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F172A', border: 'none', borderRadius: 12, color: '#F8FAFC', fontSize: 12 }}
                formatter={(v, name) => [v, statusLabels[name] || name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map(({ name, value }, i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted capitalize">{statusLabels[name] || name}</span>
                </div>
                <span className="font-semibold text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Voyages */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-secondary mb-5">Top voyages</h3>
          <div className="space-y-3">
            {data?.top_voyages?.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white
                  ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-secondary text-sm truncate">{v.titre}</div>
                  <div className="text-muted text-xs">{v.destination}</div>
                </div>
                <div className="text-primary font-semibold text-sm">{v.reservations}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-secondary mb-5">Activité récente</h3>
          <div className="space-y-3">
            {data?.recent_activity?.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {a.type === 'reservation' ? <CalendarCheck size={14} className="text-primary" /> : <Users size={14} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-secondary truncate">{a.message}</div>
                  <div className="text-xs text-muted">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
