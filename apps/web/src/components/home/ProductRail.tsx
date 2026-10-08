import Link from 'next/link'
import { ImagenProducto } from '@/components/producto/ImagenProducto'
import { formatBob } from '@/lib/format'
import type { ProductView } from '@/lib/types'

function Precio({ producto }: { producto: ProductView }) {
  if (producto.en_oferta) {
    return (
      <span className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-sm text-tinta/40 line-through">{formatBob(producto.precio_bob_cents)}</span>
        <span
          className="bg-clip-text font-bold text-transparent"
          style={{ backgroundImage: 'var(--gradiente-marca)' }}
        >
          {formatBob(producto.precio_efectivo_bob_cents)}
        </span>
      </span>
    );
  }
  return (
    <span className="mt-2 block font-bold text-marca-violeta">
      {formatBob(producto.precio_efectivo_bob_cents)}
    </span>
  );
}

function Tarjeta({ producto }: { producto: ProductView }) {
  const foto = producto.imagenes[0] ?? null;
  const sinStock = producto.stock <= 0;

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-tinta/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <ImagenProducto
        src={foto}
        alt={producto.nombre}
        className="aspect-square w-full border-b border-tinta/8"
      />
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
        ) : null}
      </div>
    </Link>
  );
}

export function ProductRail({
  titulo,
  items,
  hrefMas = '/productos',
}: {
  titulo: string;
  items: ProductView[];
  hrefMas?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-tinta sm:text-3xl">{titulo}</h2>
        <Link href={hrefMas} className="text-sm font-semibold text-marca-magenta hover:underline">
          Ver todo →
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} />
        ))}
      </div>
    </section>
  )
}