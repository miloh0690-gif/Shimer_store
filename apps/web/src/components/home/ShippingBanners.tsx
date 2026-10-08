import { Reveal } from '@/components/motion/Reveal'

const BANNERS = [
  {
    titulo: 'Envíos en Cochabamba',
    texto: 'Entrega en 24 horas dentro de la ciudad.',
    fondo: 'bg-marca-violeta',
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    titulo: 'Envíos a todo el país',
    texto: 'A todo Bolivia por transporte y correo.',
    fondo: 'bg-marca-magenta',
    icono: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 4v6c0 4-3.4 7-8 8-4.6-1-8-4-8-8V7z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function ShippingBanners() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {BANNERS.map((banner, i) => (
        <Reveal key={banner.titulo} delay={i * 0.06}>
          <div
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-lg transition-transform duration-300 hover:scale-[1.02] ${banner.fondo}`}
          >
            <span className="shrink-0">{banner.icono}</span>
            <span>
              <span className="block font-display text-base font-semibold">{banner.titulo}</span>
              <span className="block text-sm text-white/85">{banner.texto}</span>
            </span>
          </div>
        </Reveal>
      ))}
    </div>
  )
}