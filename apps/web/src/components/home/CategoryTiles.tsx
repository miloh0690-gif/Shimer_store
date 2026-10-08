import Link from 'next/link'
import { Reveal } from '@/components/motion/Reveal'
import type { CategoryView } from '@/lib/types'

const STAGGER = 0.06

export function CategoryTiles({ categorias }: { categorias: CategoryView[] }) {
  if (categorias.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Reveal>
        <h2 className="text-center font-display text-3xl font-semibold text-tinta sm:text-4xl">
          Comprar por categoría
        </h2>
      </Reveal>
      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {categorias.map((categoria, i) => (
          <Reveal key={categoria.id} delay={i * STAGGER}>
            <Link
              href={`/productos?categoria=${categoria.slug}`}
              className="group flex h-full flex-col justify-between rounded-2xl border border-tinta/8 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="font-display text-lg font-semibold text-marca-violeta">
                {categoria.nombre}
              </span>
              {categoria.descripcion ? (
                <span className="mt-2 text-sm text-tinta/60">{categoria.descripcion}</span>
              ) : null}
              <span className="mt-4 text-sm font-semibold text-marca-rosa opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Ver productos →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}