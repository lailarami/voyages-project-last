import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, Grid, List } from 'lucide-react'
import { voyageService } from '@/services/api'
import VoyageCard from '@/components/cards/VoyageCard'
import useTranslation from '@/hooks/useTranslation'

const CATEGORIES = [
  { value: '', label: 'Toutes' },
  { value: 'desert', label: '🏜️ Désert' },
  { value: 'culture', label: '🏛️ Culture' },
  { value: 'plage', label: '🏖️ Plage' },
  { value: 'aventure', label: '🧗 Aventure' },
  { value: 'montagne', label: '⛰️ Montagne' },
  { value: 'nature', label: '🌿 Nature' },
]

const SORTS = [
  { value: 'created_at', label: 'Plus récents' },
  { value: 'prix', label: 'Prix croissant' },
  { value: 'vues', label: 'Popularité' },
  { value: 'date_depart', label: 'Date départ' },
]

export default function VoyageSearch() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categorie: searchParams.get('categorie') || '',
    prix_min: searchParams.get('prix_min') || '',
    prix_max: searchParams.get('prix_max') || '',
    date_depart: searchParams.get('date_depart') || '',
    places: searchParams.get('places') || '',
    sort: 'created_at',
    page: 1,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['voyages', filters],
    queryFn: () => voyageService.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  })

  // Persist filters to URL and localStorage so homepage can reuse them
  useEffect(() => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.categorie) params.categorie = filters.categorie
    if (filters.prix_min) params.prix_min = filters.prix_min
    if (filters.prix_max) params.prix_max = filters.prix_max
    if (filters.date_depart) params.date_depart = filters.date_depart
    if (filters.places) params.places = filters.places
    // Update URL
    setSearchParams(params)
    // Save a lightweight copy to localStorage
    try {
      localStorage.setItem('lastVoyageSearch', JSON.stringify(params))
    } catch {
      // ignore storage errors
    }
  }, [filters.search, filters.categorie, filters.prix_min, filters.prix_max, filters.date_depart, filters.places])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }


  const getCategoryLabel = (value) => {
    switch (value) {
      case 'desert': return t('categoriesDesert')
      case 'culture': return t('categoriesCulture')
      case 'plage': return t('categoriesBeach')
      case 'aventure': return t('categoriesAdventure')
      case 'montagne': return t('categoriesMountain')
      case 'nature': return t('categoriesNature')
      default: return t('categoriesAll')
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header banner */}
      <div className="bg-secondary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-white mb-3"
          >
            {t('tripsHeader')}
          </motion.h1>
          <p className="text-white/60 text-lg">{t('tripsAvailable')?.replace('{count}', String(data?.meta?.total || 0))}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & controls bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="input-premium pl-11"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-medium transition-all text-sm
              ${showFilters ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-secondary hover:border-primary'}`}
          >
            <SlidersHorizontal size={16} />
            {t('filters')}
            {Object.values(filters).some(v => v && v !== 'created_at' && v !== 1 && v !== '') && (
              <span className="w-2 h-2 rounded-full bg-danger" />
            )}
          </button>
          <select
            value={filters.sort}
            onChange={e => updateFilter('sort', e.target.value)}
            className="input-premium w-auto px-4"
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-primary'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Categories pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(({ value }) => (
            <button
              key={value}
              onClick={() => updateFilter('categorie', value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${filters.categorie === value
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-white border border-gray-200 text-secondary hover:border-primary hover:text-primary'
                }`}
            >
              {getCategoryLabel(value)}
            </button>
          ))}
        </div>


        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Prix minimum (MAD)</label>
                  <input type="number" placeholder="0" value={filters.prix_min}
                    onChange={e => updateFilter('prix_min', e.target.value)}
                    className="input-premium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Prix maximum (MAD)</label>
                  <input type="number" placeholder="50 000" value={filters.prix_max}
                    onChange={e => updateFilter('prix_max', e.target.value)}
                    className="input-premium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Date de départ</label>
                  <input type="date" value={filters.date_depart}
                    onChange={e => updateFilter('date_depart', e.target.value)}
                    className="input-premium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Nombre de places</label>
                  <input type="number" min="1" max="20" placeholder="1" value={filters.places}
                    onChange={e => updateFilter('places', e.target.value)}
                    className="input-premium" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setFilters({ search: '', categorie: '', prix_min: '', prix_max: '', date_depart: '', places: '', sort: 'created_at', page: 1 })}
                  className="flex items-center gap-2 text-sm text-muted hover:text-danger transition-colors"
                >
                  <X size={14} /> {t('resetFilters')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display text-2xl font-bold text-secondary mb-3">Aucun voyage trouvé</h3>
            <p className="text-muted">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {data?.data?.map((voyage, i) => (
                <motion.div
                  key={voyage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VoyageCard voyage={voyage} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {data?.meta?.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(data.meta.last_page)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                    className={`w-10 h-10 rounded-xl font-medium text-sm transition-all
                      ${filters.page === i + 1 ? 'bg-primary text-white shadow-glow' : 'bg-white border border-gray-200 text-secondary hover:border-primary'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
