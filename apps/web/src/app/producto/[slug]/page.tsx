import CompraProducto from '@/components/producto/CompraProducto'
import Galeria from '@/components/producto/Galeria'
import { ProductCard } from '@/components/producto/ProductCard'
import { Reveal } from '@/components/motion/Reveal'
import { getProductoPorSlug, getProductos } from '@/lib/queries'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const producto = await getProductoPorSlug(slug)
  if (!producto) return { title: 'Producto no encontrado — SHIMER' }
  return {
    title: `${producto.nombre} — SHIMER`,
    description: (producto.descripcion ?? producto.nombre).slice(0, 150),
  }
}

export default async function PaginaProducto({ params }: Params) {
  const { slug } = await params
  const producto = await getProductoPorSlug(slug)
  if (!producto) notFound()

  const relacionados = await getProductos({
    categoria: producto.categoria?.slug,
    limite: 5,
    orden: 'destacado',
  })
  const sugeridos = relacionados.items.filter((p) => p.id !== producto.id).slice(0, 4)

  const disponibilidad = producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const imagenPrincipal = producto.imagenes[0] ?? '/placeholder.svg'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion ?? producto.nombre,
    image: [imagenPrincipal],
    sku: producto.sku || undefined,
    brand: producto.marca ? { '@type': 'Brand', name: producto.marca.nombre } : undefined,
    offers: {
      '@type': 'Offer',
      price: (producto.precio_efectivo_bob_cents / 100).toFixed(2),
      priceCurrency: 'BOB',
      availability: disponibilidad,
    },
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Migas de pan" className="mb-6 text-sm text-tinta/60">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-marca-violeta">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/productos" className="hover:text-marca-violeta">Productos</Link>
          </li>
          {producto.categoria ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/productos?categoria=${producto.categoria.slug}`}
                  className="hover:text-marca-violeta"
                >
                  {producto.categoria.nombre}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-tinta">{producto.nombre}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Galeria imagenes={producto.imagenes} alt={producto.nombre} />
        <CompraProducto producto={producto} />
      </div>

      <section className="mt-12 max-w-3xl">
        <details className="group rounded-2xl border border-tinta/10 bg-white p-5">
          <summary className="cursor-pointer font-display text-lg text-tinta">
            Descripción
            <span className="ml-2 text-tinta/40 group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="mt-3 whitespace-pre-line text-tinta/75">{producto.descripcion ?? producto.nombre}</p>
        </details>
      </section>

      {sugeridos.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl text-tinta">También te puede interesar</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {sugeridos.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <li className="h-full">
                  <ProductCard product={p} />
                </li>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
