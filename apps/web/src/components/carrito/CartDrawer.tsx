'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { formatBob } from '@/lib/format'
import { useCarrito } from './CartProvider'
import { LineaCarrito } from './LineaCarrito'

export function CartDrawer() {
  const { state, abierto, setAbierto, subtotal } = useCarrito()

  return (
    <AnimatePresence>
      {abierto ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar el carrito"
            onClick={() => setAbierto(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-tinta/40"
          />
          <motion.aside
            role="dialog"
            aria-label="Carrito de compras"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-crema shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-tinta/8 px-5 py-4">
              <h2 className="font-display text-xl text-tinta">Tu carrito</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar el carrito"
                className="rounded-full p-1.5 text-tinta/60 transition hover:bg-white hover:text-tinta"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {state.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="font-display text-lg text-tinta">Tu carrito esta vacio</p>
                <p className="text-sm text-tinta/60">Agrega productos y aqui los vas a ver.</p>
                <Link
                  href="/productos"
                  onClick={() => setAbierto(false)}
                  className="mt-2 rounded-full bg-[image:var(--gradiente-marca)] px-6 py-2.5 font-display text-sm text-white"
                >
                  Ver productos
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-2 overflow-y-auto p-4">
                  {state.lines.map((linea) => (
                    <LineaCarrito key={`${linea.product_id}:${linea.variant_id ?? ''}`} linea={linea} />
                  ))}
                </ul>

                <footer className="border-t border-tinta/8 bg-white px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-tinta/65">Subtotal estimado</span>
                    <span className="whitespace-nowrap font-display text-2xl text-marca-violeta">
                      {formatBob(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-tinta/50">El total se confirma en el servidor.</p>
                  <Link
                    href="/checkout"
                    onClick={() => setAbierto(false)}
                    className="mt-3 block w-full rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3.5 text-center font-display text-white shadow-lg transition hover:scale-[1.02]"
                  >
                    Ir al checkout
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default CartDrawer
