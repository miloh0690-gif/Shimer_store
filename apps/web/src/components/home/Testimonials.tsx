import { Reveal } from '@/components/motion/Reveal'

/**
 * Citas de ejemplo para que la home se vea completa. NO son reales: el catálogo
 * y los precios del sitio también son de demostración hasta que Milo mande los
 * suyos, y estas reseñas se reemplazan por las de los clientes reales.
 */
const TESTIMONIOS = [
  {
    texto:
      'Encontré todo lo que necesitaba para el cole de mis hijos en un solo lugar, y me lo entregaron el mismo día.',
    autor: 'María F.',
    lugar: 'Cochabamba',
  },
  {
    texto:
      'Los marcadores y las acuarelas llegaron perfectos y bien empaquetados. Volveré a comprar.',
    autor: 'Diego R.',
    lugar: 'Quillacollo',
  },
  {
    texto:
      'Me asesoraron por WhatsApp con los cuadernos y me recomendaron exactamente lo que necesitaba para la universidad.',
    autor: 'Carla M.',
    lugar: 'La Paz',
  },
]

const RATING = 4.86
const RESENAS = 732

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <Reveal>
        <div className="text-center">
          <p className="font-display text-4xl font-semibold text-tinta">{RATING}</p>
          <div className="mt-1 flex justify-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className="h-5 w-5 text-marca-rosa" fill="currentColor">
                <path d="M10 1.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" />
              </svg>
            ))}
          </div>
          <p className="mt-2 text-sm text-tinta/60">
            {RESENAS} reseñas · <span className="font-semibold text-marca-magenta">datos de ejemplo</span>
          </p>
        </div>
      </Reveal>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {TESTIMONIOS.map((t, i) => (
          <Reveal key={t.autor} delay={i * 0.06}>
            <figure className="flex h-full flex-col rounded-2xl border border-tinta/8 bg-white p-6 shadow-sm">
              <blockquote className="flex-1 text-tinta/80">“{t.texto}”</blockquote>
              <figcaption className="mt-4 text-sm text-tinta/60">
                <span className="font-semibold text-tinta">{t.autor}</span> · {t.lugar}
              </figcaption>
              <span className="mt-3 inline-block w-fit rounded-full bg-marca-rosa/12 px-3 py-1 text-xs font-semibold text-marca-magenta">
                Demo
              </span>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}