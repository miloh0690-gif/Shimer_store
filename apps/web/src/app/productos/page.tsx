import Link from 'next/link'
import { Reveal } from '@/components/motion/Reveal'
import Filtros, { type SearchParams } from '@/components/producto/Filtros'
import { ProductCard } from '@/components/producto/ProductCard'
import { getCategorias, getMarcas, getProductos } from '@/lib/queries'
import type { ProductOrden } from '@/lib/types'

export const metadata = {
  title: 'Productos — SHIMER',
  description: 'Catálogo de papelería, arte, escolar y manualidades de SHIMER.',
}

const POR_PAGINA = 24

function comoLista(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function numero(v: string | string[] | undefined): number | undefined {
  const crudo = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined
  if (crudo === undefined || crudo === '') return undefined
  const n = Number(crudo)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function entero(v: string | string[] | undefined, porDefecto: number): number {
  const n = Number(typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : porDefecto
}

export default async function PaginaProductos({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const categorias = await getCategorias()
  const marcas = await getMarcas()

  const pagina = entero(params.pagina, 1)
  const orden = (typeof params.orden === 'string' ? params.orden : 'destacado') as ProductOrden
  const enOferta = params.en_oferta === 'true'

  const { items, total } = await getProductos({
    pagina,
    orden,
    limite: POR_PAGINA,
    categoria: comoLista(params.categoria).join(','),
    marca: comoLista(params.marca).join(','),
    color: comoLista(params.color).join(','),
    precio_min: numero(params.precio_min),
    precio_max: numero(params.precio_max),
    en_oferta: enOferta ? true : undefined,
    q: typeof params.q === 'string' ? params.q : undefined,
  })

  const universo = await getProductos({ pagina: 1, limite: 60, orden: 'nombre' })
  const colores = [...new Set(universo.items.map((p) => p.color).filter((c): c is string => Boolean(c)))].sort()

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-4xl text-tinta">Productos</h1>
        <p className="text-tinta/70">
          Explorá el catálogo por categoría, marca, color y precio. Los filtros viven en la URL, así que podés
          compartir la búsqueda.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filtros
          categorias={categorias}
          marcas={marcas}
          colores={colores}
          total={total}
          searchParams={params}
        />

        <section className="flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-tinta/20 bg-white/60 p-8">
              <p className="font-display text-xl text-tinta">No encontramos productos con esos filtros</p>
              <p className="text-tinta/70">Probá quitando alguno o mirá todo el catálogo.</p>
              <Link
                href="/productos"
                className="rounded-full bg-[image:var(--gradiente-marca)] px-6 py-2.5 font-semibold text-white hover:scale-[1.03]"
              >
                Ver todo el catálogo
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((producto, i) => (
                <Reveal as="li" key={producto.id} delay={(i % 4) * 0.06} className="h-full">
                  <ProductCard product={producto} />
                </Reveal>
              ))}
            </ul>
          )}

          {paginas > 1 ? (
            <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => {
                const params2 = new URLSearchParams()
                for (const [clave, valor] of Object.entries(params)) {
                  if (typeof valor === 'string') params2.set(clave, valor)
                  else if (Array.isArray(valor)) params2.set(clave, valor.join(','))
                }
                if (n === 1) params2.delete('pagina')
                else params2.set('pagina', String(n))
                const activo = n === pagina
                return (
                  <a
                    key={n}
                    href={`/productos?${params2.toString()}`}
                    aria-current={activo ? 'page' : undefined}
                    className={`h-10 min-w-10 rounded-xl border px-3 py-2 text-center text-sm transition ${
                      activo
                        ? 'border-transparent bg-[image:var(--gradiente-marca)] font-semibold text-white'
                        : 'border-tinta/15 bg-white text-tinta/80 hover:border-marca-violeta hover:text-marca-violeta'
                    }`}
                  >
                    {n}
                  </a>
                )
              })}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  )
}
