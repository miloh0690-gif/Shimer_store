import Image from 'next/image'
import { HeroParallax } from './HeroParallax'
import { Reveal } from '@/components/motion/Reveal'
import { ShippingBanners } from './ShippingBanners'

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-20 sm:pt-28">
      <HeroParallax />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
            Librería, papelería y arte · Cochabamba
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-white drop-shadow-sm sm:text-6xl md:text-7xl">
            Todo lo que necesitás
            <br />
            para crear y estudiar
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">
            Cuadernos, marcadores, acuarelas y útiles escolares. Elegidos uno por uno para la
            escuela, la oficina y el taller.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/productos"
              className="rounded-full bg-marca-violeta px-8 py-4 font-semibold text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              Ver productos
            </a>
            <a
              href="/contacto"
              className="rounded-full border-2 border-white px-8 py-4 font-semibold text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              Escribinos
            </a>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl px-6">
        <Image
          src="/logo.jpg"
          alt="SHIMER"
          width={96}
          height={96}
          // El logo del hero es el elemento LCP: sin priority llega tarde y
          // el Lighthouse movil lo marca como lcp-lazy-loaded.
          priority
          className="mx-auto rounded-2xl shadow-xl ring-4 ring-white/60"
        />
        <ShippingBanners />
      </div>
    </section>
  )
}