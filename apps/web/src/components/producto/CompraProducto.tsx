'use client'

import { useState } from 'react'
import AddToCartButton from '@/components/carrito/AddToCartButton'
import { formatBob } from '@/lib/format'
import type { ProductView } from '@/lib/types'

type Props = {
  producto: ProductView
}

export default function CompraProducto({ producto }: Props) {
  const conVariantes = producto.variantes.length > 0
  const [variantId, setVariantId] = useState<string | null>(
    conVariantes ? (producto.variantes[0]?.id ?? null) : null
  )
  const variante = producto.variantes.find((v) => v.id === variantId) ?? null
  const stock = variante ? variante.stock : producto.stock
  const ahorro =
    producto.en_oferta && producto.precio_bob_cents > producto.precio_efectivo_bob_cents
      ? producto.precio_bob_cents - producto.precio_efectivo_bob_cents
      : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-tinta/60">
          {producto.categoria?.nombre}
          {producto.marca ? <span> · {producto.marca.nombre}</span> : null}
        </p>
        <h1 className="font-display text-3xl leading-tight text-tinta sm:text-4xl">{producto.nombre}</h1>
        {producto.sku ? <p className="text-xs text-tinta/50">Código {producto.sku}</p> : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        {producto.en_oferta ? (
          <span className="text-lg text-tinta/40 line-through">
            {formatBob(producto.precio_bob_cents)}
          </span>
        ) : null}
        <span className="font-display text-3xl text-marca-violeta">
          {formatBob(producto.precio_efectivo_bob_cents)}
        </span>
        {ahorro > 0 ? (
          <span className="rounded-full bg-menta/12 px-3 py-1 text-sm font-semibold text-menta">
            Ahorrás {formatBob(ahorro)}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-tinta/70">
        {stock > 0 ? (
          <span className="text-menta">Disponible</span>
        ) : (
          <span className="font-semibold text-rosa">Sin stock</span>
        )}
        {stock > 0 && stock <= 5 ? ` · quedan ${stock}` : ''}
      </p>

      {conVariantes ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="font-display text-sm uppercase tracking-wide text-tinta/70">Color</legend>
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                aria-pressed={v.id === variantId}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  v.id === variantId
                    ? 'border-marca-violeta bg-marca-violeta/8 font-semibold text-marca-violeta'
                    : 'border-tinta/15 bg-white text-tinta/75 hover:border-tinta/35'
                } ${v.stock <= 0 ? 'opacity-50 line-through' : ''}`}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <AddToCartButton
        product={{
          id: producto.id,
          nombre: producto.nombre,
          precio_bob_cents: producto.precio_efectivo_bob_cents,
          stock,
        }}
        variantId={variantId}
        imagen={producto.imagenes[0] ?? null}
      />

      <p className="text-xs text-tinta/50">
        Envíos a Cochabamba y a todo el país. El pago se coordina con el local; confirmamos tu pedido por
        teléfono o WhatsApp.
      </p>
    </div>
  )
}
