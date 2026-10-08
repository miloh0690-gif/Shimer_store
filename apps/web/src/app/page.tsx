import Image from 'next/image'
import { Reveal } from '@/components/motion/Reveal'

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
        <Image
          src="/logo.jpg"
          alt="SHIMER"
          width={220}
          height={220}
          priority
          className="rounded-3xl shadow-xl"
        />
        <Reveal>
          <h1 className="font-display text-5xl font-semibold text-tinta sm:text-6xl">
            Librería, papelería y{' '}
            <span
              className="bg-gradient-to-br from-marca-violeta to-marca-rosa bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradiente-marca)' }}
            >
              arte
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-xl text-lg text-tinta/70">
            Todo lo que necesitás para la escuela, la oficina y el taller, en un solo lugar.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <a
            href="/productos"
            className="rounded-full px-7 py-3 font-semibold text-white transition-transform duration-200 hover:scale-105"
            style={{ backgroundImage: 'var(--gradiente-marca)' }}
          >
            Ver productos
          </a>
        </Reveal>
      </section>
    </main>
  )
}