import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { ExportCsvButton } from '@/components/ui/ExportCsvButton'
import { adminService } from '@/services/api'
import useTranslation from '@/hooks/useTranslation'

const COLORS = ['#22C55E', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

export default function AdminAnalytics() {
  const [periode, setPeriode] = useState('30')
  const { t } = useTranslation()
  const [selectedDay, setSelectedDay] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', periode],
    queryFn: () => adminService.analytics({ periode }).then(r => r.data.data),
  })

  const reservationsData = data?.reservations_par_jour?.map(d => ({
    date: d.date,
    label: new Date(d.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }),
    weekday: new Date(d.date).toLocaleDateString('fr-MA', { weekday: 'short' }),
    total: parseInt(d.total),
  })) || []

  const dailyData = reservationsData

  const selectedDayData = reservationsData.find(d => d.date === selectedDay) || reservationsData[reservationsData.length - 1] || null
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayReservations = data?.reservations_par_jour?.find(d => d.date === todayKey)?.total ?? 0
  const maxReservations = Math.max(...reservationsData.map(d => d.total), 1)

  useEffect(() => {
    if (!selectedDay && reservationsData.length > 0) {
      setSelectedDay(reservationsData[reservationsData.length - 1].date)
    }
  }, [reservationsData, selectedDay])

  const revenusData = data?.revenus_par_jour?.map(d => ({
    date: new Date(d.date).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' }),
    revenu: parseFloat(d.total),
  })) || []

  const categoriesData = data?.categories?.map(c => ({
    name: c.categorie,
    value: parseInt(c.total),
  })) || []

  const tauxData = data?.taux_annulation
    ? [
      { name: 'Confirmées', value: data.taux_annulation.confirmees },
      { name: 'En attente', value: data.taux_annulation.en_attente },
      { name: 'Annulées', value: data.taux_annulation.annulees },
    ]
    : []

  const exportColumns = [
    { label: '#', value: (v, index) => index + 1 },
    { label: 'Voyage', value: 'titre' },
    { label: 'Destination', value: 'destination' },
    { label: 'Catégorie', value: 'categorie' },
    { label: 'Réservations', value: 'reservations_count' },
  ]

  if (!selectedDay && reservationsData.length > 0) {
    setSelectedDay(reservationsData[reservationsData.length - 1].date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">{t('analytics')}</h1>
          <p className="text-muted text-sm mt-0.5">{t('analyticsOverview')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select value={periode} onChange={e => setPeriode(e.target.value)}
            className="input-premium w-full sm:w-auto px-4">
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">Cette année</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Reservations curve chart */}
          <div className="card-premium p-6 overflow-hidden border border-white/10 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h3 className="font-semibold text-secondary">Réservations par jour</h3>
                <p className="text-muted text-xs">Vue journalière</p>
              </div>
              {selectedDayData && (
                <div className="rounded-3xl bg-slate-950/90 px-4 py-3 text-sm text-slate-300">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Sélection</div>
                  <div className="mt-2 font-semibold text-white">{new Date(selectedDayData.date).toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  <div className="text-slate-400">{selectedDayData.total} réservations</div>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: 'none', borderRadius: 14, color: '#F8FAFC', fontSize: 12 }}
                  formatter={v => [v, 'Réservations']} />
                <Bar dataKey="total" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Calendar heatmap (hidden by default, animated) */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.32 }} className="card-premium p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-semibold text-secondary">Calendrier des réservations</h3>
                    <p className="text-muted text-xs">Cliquez sur un jour pour voir les détails</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-slate-950/90 px-4 py-3 text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Aujourd'hui</div>
                      <div className="mt-2 text-lg font-semibold text-white">{todayReservations} réserv.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(s => !s)}
                      className="rounded-3xl px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
                    >
                      {showCalendar ? 'Masquer' : 'Voir calendrier'}
                    </button>
                  </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.02 }} className="grid grid-cols-7 gap-2">
                  {reservationsData.map(day => (
                    <motion.button
                      key={day.date}
                      type="button"
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.04 }}
                      onClick={() => setSelectedDay(day.date)}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-sm transition-colors border ${selectedDay === day.date ? 'border-primary bg-primary/10 shadow-[0_6px_20px_rgba(34,197,94,0.08)]' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <div className="text-xs text-slate-400">{day.weekday}</div>
                      <div className="text-lg font-semibold text-white">{new Date(day.date).getDate()}</div>
                      <div className="text-[11px] text-muted">{day.total}</div>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Categories pie */}
            <div className="card-premium p-6">
              <h3 className="font-semibold text-secondary mb-5">Réservations par catégorie</h3>
              {categoriesData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={categoriesData} cx="50%" cy="50%"
                        outerRadius={70} innerRadius={40} paddingAngle={4} dataKey="value">
                        {categoriesData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#0F172A', border: 'none', borderRadius: 12,
                          color: '#F8FAFC', fontSize: 12
                        }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {categoriesData.map(({ name }, i) => (
                      <div key={name} className="flex items-center gap-1.5 text-xs text-muted">
                        <div className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="capitalize">{name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Status distribution */}
            <div className="card-premium p-6">
              <h3 className="font-semibold text-secondary mb-5">Taux de conversion</h3>
              {tauxData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tauxData} layout="vertical" barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{
                          background: '#0F172A', border: 'none', borderRadius: 12,
                          color: '#F8FAFC', fontSize: 12
                        }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {tauxData.map((_, i) => (
                          <Cell key={i} fill={['#22C55E', '#06B6D4', '#EF4444'][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {tauxData.map(({ name, value }, i) => {
                      const total = tauxData.reduce((a, c) => a + c.value, 0)
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0
                      return (
                        <div key={name} className="flex items-center justify-between text-xs">
                          <span className="text-muted">{name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: ['#22C55E', '#06B6D4', '#EF4444'][i],
                                }} />
                            </div>
                            <span className="font-semibold text-secondary w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold text-secondary mb-1">Revenus par jour (MAD)</h3>
            <p className="text-muted text-xs mb-5">Sur les {periode} derniers jours</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A', border: 'none', borderRadius: 12,
                    color: '#F8FAFC', fontSize: 12
                  }}
                  formatter={v => [new Intl.NumberFormat('fr-MA').format(v) + ' MAD', 'Revenu']} />
                <Line type="monotone" dataKey="revenu" stroke="#06B6D4" strokeWidth={2.5}
                  dot={false} name="Revenu" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top voyages table */}
          {data?.voyages_populaires?.length > 0 && (
            <div className="card-premium p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="font-semibold text-secondary">Top voyages (par réservations)</h3>
                <ExportCsvButton filename="top-voyages.csv" columns={exportColumns} rows={data.voyages_populaires || []} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['#', 'Voyage', 'Destination', 'Catégorie', 'Réservations'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.voyages_populaires.map((v, i) => (
                      <tr key={v.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white
                            ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-500'}`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-secondary text-sm">{v.titre}</td>
                        <td className="px-4 py-3 text-sm text-muted">{v.destination}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-accent capitalize">{v.categorie}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary text-sm">{v.reservations_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
