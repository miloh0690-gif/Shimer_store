'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCarrito } from './CartProvider'

type Props = {
  product: { id: string; nombre: string; precio_bob_cents: number; stock: number }
  variantId?: string | null
  imagen?: string | null
}

export default function AddToCartButton({ product, variantId = null, imagen = null }: Props) {
  const { dispatch } = useCarrito()
  const [agregado, setAgregado] = useState(false)
  const [tick, setTick] = useState(0)
  const sinStock = product.stock <= 0

  useEffect(() => {
    if (!agregado) return
    const t = window.setTimeout(() => {
      setAgregado(false)
      setTick((n) => n + 1)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [agregado, tick])

  function agregar() {
    dispatch({
      type: 'agregar',
      line: {
        product_id: product.id,
        variant_id: variantId,
        cantidad: 1,
        nombre: product.nombre,
        precio_bob_cents: product.precio_bob_cents,
        imagen,
      },
    })
    setAgregado(true)
  }

  return (
    <button
      type="button"
      onClick={agregar}
      disabled={sinStock}
      aria-disabled={sinStock}
      className="flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 font-display text-lg text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-tinta/20 disabled:text-tinta/50 disabled:shadow-none enabled:bg-[image:var(--gradiente-marca)] enabled:hover:scale-[1.03] enabled:active:scale-[0.99]"
    >
      <AnimatePresence initial={false} mode="wait">
        {sinStock ? (
          <motion.span key="sin-stock" exit={{ opacity: 0 }}>
            Sin stock
          </motion.span>
        ) : agregado ? (
          <motion.span
            key={`agregado-${tick}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Agregado al carrito
          </motion.span>
        ) : (
          <motion.span key="agregar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
            Agregar al carrito
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
