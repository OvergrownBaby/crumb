'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const WORDS = ['YouTubers', 'influencers', 'friends', 'locals', 'critics', 'strangers']

export function RotatingText() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ height: '1em' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ y: '60%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-60%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.6 }}
          className="inline-block text-[var(--accent)]"
          style={{ lineHeight: 1 }}
        >
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
