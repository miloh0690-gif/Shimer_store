import { Reveal } from '@/components/motion/Reveal'
import type { BrandView } from '@/lib/types'

export function BrandStrip({ marcas }: { marcas: BrandView[] }) {
  if (marcas.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-semibold text-tinta sm:text-3xl">
            Nuestras marcas
          </h2>
        </Reveal>
      </div>
      <div className="relative mt-7 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-crema to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-crema to-transparent" />
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-6">
          {marcas.map((marca) => (
            <li
              key={marca.id}
              className="font-display text-lg font-semibold text-tinta/70 transition-colors duration-300 hover:text-marca-violeta"
            >
              {marca.nombre}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}