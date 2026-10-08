'use client'

import { motion } from 'motion/react'

/**
 * Next.js solo vuelve a montar `layout.tsx` al navegar, así que la animación de
 * entrada de página va en `template.tsx`, que sí se recrea en cada ruta.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}