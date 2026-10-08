import type { ReactNode } from 'react'

import { Reveal } from '@/components/motion/Reveal'

type Props = {
  titulo: string
  actualizado: string
  children: ReactNode
}

/**
 * Layout compartido de las paginas informativas (envios, formas de pago,
 * devoluciones, terminos, privacidad, contacto y ubicacion). Todas llevan el
 * aviso de "datos de ejemplo": el catalogo es real pero los datos del negocio
 * todavia no fueron entregados.
 */
export function LegalPage({ titulo, actualizado, children }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Reveal>
        <h1 className="font-display text-4xl font-semibold text-tinta sm:text-5xl">{titulo}</h1>
        <p className="mt-2 text-sm text-tinta/50">Última actualización: {actualizado}</p>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="mt-8 max-w-prose space-y-6 text-tinta/80 leading-relaxed">{children}</div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-12 rounded-2xl border border-marca-violeta/20 bg-marca-violeta/10 p-4 text-sm">
          <p className="font-semibold text-marca-violeta">Datos de ejemplo</p>
          <p className="mt-1 text-tinta/70">
            Esta página es una demo: NIT, dirección, teléfonos y horarios son de ejemplo y se
            reemplazan cuando el negocio entregue los datos reales.
          </p>
        </div>
      </Reveal>
    </main>
  )
}
