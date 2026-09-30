import { Link } from 'react-router-dom'
import { Plane, MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Plane size={18} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold">
                Voyages<span className="text-accent">MA</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Votre partenaire de confiance pour des voyages organisés d'exception à travers le Maroc et au-delà.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group">
                  <Icon size={16} className="text-white/60 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Voyages */}
          <div>
            <h4 className="font-semibold text-white mb-5">Destinations</h4>
            <ul className="space-y-3 text-sm text-white/60">
              {['Sahara & Désert', 'Villes Impériales', 'Côte Atlantique', 'Montagnes Atlas', 'Circuit Maroc Complet'].map(item => (
                <li key={item}>
                  <Link to="/voyages" className="hover:text-accent transition-colors hover:translate-x-1 inline-block transition-transform">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-5">Liens Utiles</h4>
            <ul className="space-y-3 text-sm text-white/60">
              {[
                { label: 'À propos', to: '/' },
                { label: 'Nos voyages', to: '/voyages' },
                { label: 'Devenir partenaire', to: '/register' },
                { label: 'Blog Voyage', to: '/' },
                { label: 'FAQ', to: '/' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="hover:text-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-5">Contact</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-accent mt-0.5 flex-shrink-0" />
                <span>123 Boulevard Mohammed V, Casablanca, Maroc</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-accent flex-shrink-0" />
                <span>+212 522 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-accent flex-shrink-0" />
                <span>contact@voyages.ma</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-white/80 text-sm font-medium mb-3">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent"
                />
                <button className="bg-accent hover:bg-accent/80 text-white px-4 rounded-xl text-sm font-medium transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© 2025 VoyagesMA. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGV</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
