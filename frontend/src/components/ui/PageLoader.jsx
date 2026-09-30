import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg z-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4"
        >
          <Plane size={28} className="text-white" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-display text-secondary font-bold text-xl"
        >
          Voyages<span className="text-primary">MA</span>
        </motion.div>
      </div>
    </div>
  )
}
