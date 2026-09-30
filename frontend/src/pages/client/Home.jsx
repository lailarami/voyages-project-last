import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useQuery } from '@tanstack/react-query'
import CountUp from 'react-countup'
import {
  Search, MapPin, Calendar, Users, Star, ArrowRight,
  Shield, Headphones, CreditCard, Award, ChevronDown
} from 'lucide-react'
import { voyageService } from '@/services/api'
import VoyageCard from '@/components/cards/VoyageCard'
import { useState } from 'react'
import useAuthStore from '@/store/authStore'
import useTranslation from '@/hooks/useTranslation'

// ─── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [dateDepart, setDateDepart] = useState('')
  const [places, setPlaces] = useState(2)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/voyages?search=${search}&date_depart=${dateDepart}&places=${places}`)
  }

  return (
    <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center overflow-hidden">
      {/* Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1800&q=80')`,
          }}
        />
        <div className="hero-overlay absolute inset-0" />
      </motion.div>

      {/* Animated particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{ left: `${15 + i * 15}%`, top: `${20 + i * 10}%` }}
          animate={{ y: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white text-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {t('heroBadge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
          >
            {t('heroTitleLine1')}
            <br />
            <span className="text-accent">{t('heroTitleAccent')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-white/80 text-lg md:text-xl mb-10 leading-relaxed max-w-xl"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <MapPin size={18} className="text-primary flex-shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 outline-none text-secondary text-sm font-medium placeholder:text-muted bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 md:w-44">
              <Calendar size={18} className="text-primary flex-shrink-0" />
              <input
                type="date"
                value={dateDepart}
                onChange={e => setDateDepart(e.target.value)}
                className="flex-1 outline-none text-secondary text-sm font-medium bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 md:w-36">
              <Users size={18} className="text-primary flex-shrink-0" />
              <select
                value={places}
                onChange={e => setPlaces(e.target.value)}
                className="flex-1 outline-none text-secondary text-sm font-medium bg-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? t('person') : t('people')}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2 md:px-8 justify-center">
              <Search size={18} />
              <span>{t('searchButton')}</span>
            </button>
          </motion.form>

          {/* Quick categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-2 mt-5"
          >
            {[t('categoriesDesert'), '🏙️ Villes', '🏖️ Plages', '⛰️ Montagnes', t('categoriesNature')].map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/voyages?search=${tag.split(' ')[1]}`)}
                className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white/90 text-sm hover:bg-white/25 transition-colors"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  )
}

// ─── Stats Section ──────────────────────────────────────────────────────────────
function StatsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 })
  const stats = [
    { value: 500, suffix: '+', label: 'Voyages organisés', icon: '✈️' },
    { value: 12000, suffix: '+', label: 'Clients satisfaits', icon: '😊' },
    { value: 15, suffix: 'ans', label: "D'expérience", icon: '🏆' },
    { value: 4.9, suffix: '★', label: 'Note moyenne', decimals: 1, icon: '⭐' },
  ]

  return (
    <section ref={ref} className="py-16 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, decimals = 0, icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-display text-4xl lg:text-5xl font-bold text-white">
                {inView && (
                  <CountUp end={value} duration={2.5} decimals={decimals} delay={i * 0.1} />
                )}
                <span className="text-accent">{suffix}</span>
              </div>
              <div className="text-white/60 text-sm mt-1">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Voyages ───────────────────────────────────────────────────────────
function FeaturedVoyages() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuthStore()
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    if (!isAuthenticated && !token) {
      navigate('/login')
    }
  }, [isAuthenticated, token, navigate])

  let urlParams = Object.fromEntries(new URLSearchParams(window.location.search))
  if (!urlParams || Object.keys(urlParams).length === 0) {
    try {
      const last = localStorage.getItem('lastVoyageSearch')
      if (last) urlParams = JSON.parse(last)
    } catch {
      urlParams = {}
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['voyages-recommended', urlParams],
    queryFn: () => voyageService.getRecommended(urlParams).then(r => r.data.data),
  })

  return (
    <section ref={ref} className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <div className="text-primary font-semibold text-sm mb-2 tracking-widest uppercase">{t('featuredLabel')}</div>
            <h2 className="section-title">{t('featuredTitle')}</h2>
            <p className="section-subtitle mt-3 max-w-xl">{t('featuredSubtitle')}</p>
            <div className="mt-4 max-w-xl">
              <div className="p-3 bg-white/5 border border-gray-100 rounded-lg text-sm text-muted">
                {t('recommendedNote')}
              </div>
            </div>
          </div>
          <Link to="/voyages" className="btn-secondary whitespace-nowrap flex items-center gap-2 self-start sm:self-auto">
            {t('allTripsBtn')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-2xl" />
            ))}
          </div>
        ) : data?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((voyage, i) => (
              <motion.div
                key={voyage.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <VoyageCard voyage={voyage} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-10 text-center">
            <h3 className="font-semibold text-lg text-secondary mb-2">Aucune proposition personnalisée disponible</h3>
            <p className="text-muted">Utilisez le moteur de recherche et appliquez des filtres pour voir des suggestions basées sur vos préférences.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Why Us Section ─────────────────────────────────────────────────────────────
function WhyUsSection() {
  const [ref, inView] = useInView({ triggerOnce: true })
  const features = [
    { icon: Shield, title: 'Voyages sécurisés', desc: 'Paiement 100% sécurisé avec Stripe. Votre argent est protégé à chaque étape.', color: 'text-primary bg-primary/10' },
    { icon: Award, title: 'Qualité premium', desc: 'Des hébergements et services sélectionnés selon des critères d\'excellence stricts.', color: 'text-accent bg-accent/10' },
    { icon: Headphones, title: 'Support 24/7', desc: 'Notre équipe est disponible à toute heure pour répondre à vos questions.', color: 'text-success bg-success/10' },
    { icon: CreditCard, title: 'Paiement flexible', desc: 'Payez en ligne par carte bancaire. Remboursement facile en cas d\'annulation.', color: 'text-orange-500 bg-orange-50' },
  ]

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <div className="text-primary font-semibold text-sm mb-2 tracking-widest uppercase">Pourquoi nous ?</div>
          <h2 className="section-title">L'excellence à votre service</h2>
          <p className="section-subtitle mt-3 max-w-2xl mx-auto">
            Depuis 15 ans, nous créons des expériences de voyage mémorables pour des milliers de clients satisfaits.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="card-premium p-7 text-center group"
            >
              <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
              </div>
              <h3 className="font-display font-bold text-secondary text-lg mb-3">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Destinations Section ───────────────────────────────────────────────────────
function DestinationsSection() {
  const navigate = useNavigate()
  const [ref, inView] = useInView({ triggerOnce: true })
  const destinations = [
    { name: 'Marrakech', count: '45 voyages', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80', large: true },
    { name: 'Sahara', count: '28 voyages', image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80' },
    { name: 'Chefchaouen', count: '19 voyages', image: 'https://images.unsplash.com/photo-1586647086836-9abe1be09adb?w=600&q=80' },
    { name: 'Essaouira', count: '22 voyages', image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80' },
    { name: 'Agadir', count: '31 voyages', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80' },
  ]

  return (
    <section ref={ref} className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="text-primary font-semibold text-sm mb-2 tracking-widest uppercase">Destinations</div>
          <h2 className="section-title">Les plus populaires</h2>
        </motion.div>

        {/* Destinations section removed per request */}
      </div>
    </section>
  )
}

// ─── Testimonials ───────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const [ref, inView] = useInView({ triggerOnce: true })
  const testimonials = [
    { name: 'Youssef El Amrani', role: 'Casablanca', text: 'Une organisation parfaite du début à la fin ! Le circuit Sahara était magique. Je recommande vivement à tous mes amis.', note: 5, avatar: 'YE' },
    { name: 'Fatima Zahra Idrissi', role: 'Rabat', text: 'Excellent rapport qualité/prix. Le guide était très professionnel et les hébergements sélectionnés avec soin. À refaire !', note: 5, avatar: 'FZ' },
    { name: 'Mehdi Benjelloun', role: 'Fès', text: 'J\'ai découvert ma propre ville autrement grâce à ce circuit. Service impeccable, équipe réactive. Bravo !', note: 5, avatar: 'MB' },
  ]

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="text-primary font-semibold text-sm mb-2 tracking-widest uppercase">Témoignages</div>
          <h2 className="section-title">Ils nous font confiance</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, text, note, avatar }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="card-premium p-7"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(note)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted text-sm leading-relaxed mb-6 italic">"{text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <div className="font-semibold text-secondary text-sm">{name}</div>
                  <div className="text-muted text-xs">{role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ────────────────────────────────────────────────────────────────
function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true })
  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="relative z-10 max-w-3xl mx-auto text-center px-4"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
          Prêt pour votre prochaine aventure ?
        </h2>
        <p className="text-white/80 text-lg mb-8 leading-relaxed">
          Des centaines de voyages vous attendent. Réservez dès maintenant et bénéficiez des meilleures offres.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/voyages"
            className="bg-white text-primary font-semibold px-8 py-4 rounded-xl hover:shadow-hard transition-all hover:-translate-y-0.5 flex items-center gap-2 justify-center">
            Explorer les voyages <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturedVoyages />
      <WhyUsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}
