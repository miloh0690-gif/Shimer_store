'use client'

import { useState } from 'react'

type Props = {
  productId: string
  variantId?: string | null
  nombre: string
  precioBobCents: number
  imagen?: string | null
  stock: number
  onAgregar?: (linea: {
    product_id: string
    variant_id: string | null
    cantidad: number
    nombre: string
    precio_bob_cents: number
    imagen: string | null
  }) => void
}

export default function AddToCartButton({
  productId,
  variantId = null,
  nombre,
  precioBobCents,
  imagen = null,
  stock,
  onAgregar,
}: Props) {
  const [agregado, setAgregado] = useState(false)
  const sinStock = stock <= 0

  function agregar() {
    onAgregar?.({ product_id: productId, variant_id: variantId, cantidad: 1, nombre, precio_bob_cents: precioBobCents, imagen })
    setAgregado(true)
    window.setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={agregar}
      disabled={sinStock}
      className="w-full rounded-full px-8 py-4 font-display text-lg text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-tinta/20 disabled:text-tinta/50 disabled:shadow-none enabled:bg-[image:var(--gradiente-marca)] enabled:hover:scale-[1.03] enabled:active:scale-[0.99]"
    >
      {sinStock ? 'Sin stock' : agregado ? 'Agregado al carrito' : 'Agregar al carrito'}
    </button>
  )
}
