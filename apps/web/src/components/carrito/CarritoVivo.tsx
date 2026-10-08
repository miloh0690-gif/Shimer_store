'use client'

import Link from 'next/link'
import { ImagenProducto } from '@/components/producto/ImagenProducto'
import { formatBob } from '@/lib/format'
import { useCarrito } from './CartProvider'

export function CarritoVivo() {
  const { state, dispatch, subtotal, setAbierto } = useCarrito()

  if (state.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-tinta/15 bg-white/70 px-6 py-20 text-center">
        <h2 className="font-display text-2xl text-tinta">Tu carrito esta vacio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-tinta/60">
          Todavia no agregaste productos. Dale una vuelta por el catalogo y armá tu pedido.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-full bg-[image:var(--gradiente-marca)] px-7 py-3 font-display text-white shadow-lg transition hover:scale-[1.03]"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {state.lines.map((linea) => {
          const subtotalLinea = linea.precio_bob_cents * linea.cantidad
          return (
            <li
              key={`${linea.product_id}:${linea.variant_id ?? ''}`}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-tinta/8 bg-white p-4"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-tinta/8">
                <ImagenProducto src={linea.imagen} alt={linea.nombre} />
              </div>

              <div className="min-w-40 flex-1">
                <p className="font-semibold text-tinta">{linea.nombre}</p>
                <p className="text-sm text-tinta/55">{formatBob(linea.precio_bob_cents)} c/u</p>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-tinta/12 bg-crema p-1">
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'set-cantidad',
                      product_id: linea.product_id,
                      variant_id: linea.variant_id,
                      cantidad: linea.cantidad - 1,
                    })
                  }
                  aria-label={`Quitar una unidad de ${linea.nombre}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-tinta/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={linea.cantidad <= 1}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 12h12" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="min-w-7 text-center font-semibold tabular-nums text-tinta">
                  {linea.cantidad}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'set-cantidad',
                      product_id: linea.product_id,
                      variant_id: linea.variant_id,
                      cantidad: linea.cantidad + 1,
                    })
                  }
                  aria-label={`Agregar una unidad de ${linea.nombre}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-tinta/70 transition hover:bg-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 6v12M6 12h12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex w-28 flex-col items-end gap-1">
                <p className="whitespace-nowrap font-display text-lg text-marca-violeta">
                  {formatBob(subtotalLinea)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: 'quitar', product_id: linea.product_id, variant_id: linea.variant_id })
                  }
                  className="text-xs text-tinta/45 transition hover:text-rosa hover:underline"
                >
                  Quitar
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <aside className="h-fit rounded-3xl border border-tinta/8 bg-white p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-tinta">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-tinta/60">Productos</dt>
            <dd className="font-semibold text-tinta">
              {state.lines.reduce((n, l) => n + l.cantidad, 0)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-tinta/8 pt-3">
            <dt className="text-tinta/60">Subtotal estimado</dt>
            <dd className="whitespace-nowrap font-display text-2xl text-marca-violeta">{formatBob(subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-tinta/50">
          El envío y el total final los confirmamos al revisar el pedido.
        </p>

        <Link
          href="/checkout"
          className="mt-5 block w-full rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3.5 text-center font-display text-white shadow-lg transition hover:scale-[1.02]"
        >
          Finalizar compra
        </Link>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            href="/productos"
            className="flex-1 rounded-full border border-tinta/15 px-4 py-2.5 whitespace-nowrap text-center text-sm font-semibold text-tinta/70 transition hover:border-tinta/35"
          >
            Seguir comprando
          </Link>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="flex-1 rounded-full border border-tinta/15 px-4 py-2.5 text-sm font-semibold text-tinta/70 transition hover:border-tinta/35"
          >
            Ver resumen
          </button>
        </div>
      </aside>
    </div>
  )
}

export default CarritoVivo
