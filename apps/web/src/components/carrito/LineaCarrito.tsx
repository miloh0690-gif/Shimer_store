'use client'

import { ImagenProducto } from '@/components/producto/ImagenProducto'
import { formatBob } from '@/lib/format'
import type { CartLine } from '@/lib/cart'
import { useCarrito } from './CartProvider'

export function LineaCarrito({ linea }: { linea: CartLine }) {
  const { dispatch } = useCarrito()
  const subtotal = linea.precio_bob_cents * linea.cantidad

  function cambiar(cantidad: number) {
    dispatch({
      type: 'set-cantidad',
      product_id: linea.product_id,
      variant_id: linea.variant_id,
      cantidad,
    })
  }

  return (
    <li className="rounded-2xl bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-tinta/8">
          <ImagenProducto src={linea.imagen} alt={linea.nombre} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-tinta">{linea.nombre}</p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-tinta/55">
            {formatBob(linea.precio_bob_cents)} c/u
          </p>
        </div>

        <p className="shrink-0 whitespace-nowrap text-sm font-bold text-tinta">{formatBob(subtotal)}</p>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-[4.75rem]">
        <div className="flex items-center gap-1 rounded-full border border-tinta/12 bg-crema p-1">
          <button
            type="button"
            onClick={() => cambiar(linea.cantidad - 1)}
            aria-label={`Quitar una unidad de ${linea.nombre}`}
            className="grid h-7 w-7 place-items-center rounded-full text-tinta/70 transition hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 12h12" strokeLinecap="round" />
            </svg>
          </button>
          <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-tinta">
            {linea.cantidad}
          </span>
          <button
            type="button"
            onClick={() => cambiar(linea.cantidad + 1)}
            aria-label={`Agregar una unidad de ${linea.nombre}`}
            className="grid h-7 w-7 place-items-center rounded-full text-tinta/70 transition hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 6v12M6 12h12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'quitar', product_id: linea.product_id, variant_id: linea.variant_id })
          }
          aria-label={`Quitar ${linea.nombre} del carrito`}
          className="whitespace-nowrap text-xs text-tinta/45 underline-offset-2 transition hover:text-rosa hover:underline"
        >
          Quitar
        </button>
      </div>
    </li>
  )
}

export default LineaCarrito
