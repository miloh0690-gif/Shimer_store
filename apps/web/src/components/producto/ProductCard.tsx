import Link from 'next/link'
import { ImagenProducto } from './ImagenProducto'
import { formatBob } from '@/lib/format'
import type { ProductView } from '@/lib/types'

function Precio({ producto }: { producto: ProductView }) {
  if (!producto.en_oferta) {
    return (
      <span className="mt-2 block whitespace-nowrap font-bold text-marca-violeta">
        {formatBob(producto.precio_efectivo_bob_cents)}
      </span>
    )
  }

  const ahorro = producto.precio_bob_cents - producto.precio_efectivo_bob_cents;

  return (
    <span className="mt-2 flex flex-col gap-1">
      <span className="text-sm text-tinta/40 line-through">
        {formatBob(producto.precio_bob_cents)}
      </span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="whitespace-nowrap bg-clip-text font-bold text-transparent"
          style={{ backgroundImage: 'var(--gradiente-marca)' }}
        >
          {formatBob(producto.precio_efectivo_bob_cents)}
        </span>
        {ahorro > 0 ? (
          <span className="whitespace-nowrap rounded-full bg-menta/12 px-2 py-0.5 text-xs font-semibold text-menta">
            Ahorrás {formatBob(ahorro)}
          </span>
        ) : null}
      </span>
    </span>
  )
}

export function ProductCard({ product }: { product: ProductView }) {
  const producto = product;
  const sinStock = producto.stock <= 0;

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-tinta/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-tinta/8 bg-white">
        <ImagenProducto src={producto.imagenes[0] ?? null} alt={producto.nombre} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        {producto.marca ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta/40">
            {producto.marca.nombre}
          </span>
        ) : null}
        <span className="mt-1 font-display text-base font-semibold leading-snug text-tinta">
          {producto.nombre}
        </span>
        <Precio producto={producto} />
        {sinStock ? (
          <span className="mt-2 inline-block w-fit rounded-full bg-tinta/8 px-3 py-1 text-xs font-semibold text-tinta/60">
            Sin stock
          </span>
        ) : (
          <span className="mt-2 text-xs font-medium text-tinta/40">
            Quedan {producto.stock} disponibles
          </span>
        )}
      </div>
    </Link>
  )
}
