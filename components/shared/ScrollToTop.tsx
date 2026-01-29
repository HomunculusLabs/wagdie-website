'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 500)
    }

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-soul-950 border border-soul-accent/30 text-soul-accent shadow-2xl hover:border-soul-accent hover:shadow-soul-glow transition-all rounded-sm group"
          aria-label="Scroll to top"
        >
          {/* Gothic Decorative Corner inside button */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-soul-accent/40" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-soul-accent/40" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-soul-accent/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-soul-accent/40" />
          
          <ChevronUp size={24} className="relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
