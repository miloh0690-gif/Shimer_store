import Image from 'next/image'
import Link from 'next/link'

const ENLACES = [
  { href: '/productos', texto: 'Productos' },
  { href: '/envios', texto: 'Envíos' },
  { href: '/formas-de-pago', texto: 'Formas de pago' },
  { href: '/devoluciones', texto: 'Devoluciones' },
  { href: '/ubicacion', texto: 'Ubicación' },
  { href: '/contacto', texto: 'Contacto' },
]

const LEGALES = [
  { href: '/terminos', texto: 'Términos y condiciones' },
  { href: '/privacidad', texto: 'Privacidad' },
]

// Los `#` se reemplazan con las URLs reales cuando Milo las pase.
const REDES = [
  {
    nombre: 'Facebook',
    href: '#',
    icono: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M13 22v-8h3l1-4h-4V8.5c0-1.1.3-1.8 1.9-1.8H17V3.2C16.7 3.2 15.5 3 14.2 3 11.4 3 9.5 4.6 9.5 7.7V10H6.5v4h3v8z" />
      </svg>
    ),
  },
  {
    nombre: 'Instagram',
    href: '#',
    icono: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    nombre: 'TikTok',
    href: '#',
    icono: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M16.5 3h-2.6v11.4a2.3 2.3 0 1 1-2.3-2.3c.24 0 .47.04.7.1V9.5a5 5 0 1 0 4.2 4.94V8.9a6 6 0 0 0 3.4 1.05V7.3a3.7 3.7 0 0 1-3.4-4.3z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="mt-16 bg-tinta text-crema/80">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="SHIMER" width={48} height={48} className="rounded-xl" />
              <span className="font-display text-xl font-semibold text-crema">
                SHIMER — Librería, Papelería y Arte
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-crema/60">
              Datos de ejemplo: la dirección, el NIT y los horarios se reemplazan por los reales
              cuando estén confirmados.
            </p>
            <div className="mt-5 flex gap-3">
              {REDES.map((red) => (
                <a
                  key={red.nombre}
                  href={red.href}
                  aria-label={red.nombre}
                  className="rounded-full bg-crema/10 p-2.5 transition-colors hover:bg-marca-violeta"
                >
                  {red.icono}
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Tienda">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-crema">
              Tienda
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {ENLACES.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="transition-colors hover:text-marca-rosa">
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-crema">
              Visitanos
            </h3>
            <address className="mt-4 space-y-2 text-sm not-italic text-crema/70">
              <p>Av. M.I. Belzu S-0734, Las Cuadras</p>
              <p>Cochabamba, Bolivia</p>
              <p>Lun a Sáb · 14:00 – 19:00</p>
              <p>
                NIT <span className="text-crema/50">595963024</span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-crema/10 pt-6 text-xs text-crema/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SHIMER. Todos los derechos reservados.</p>
          <ul className="flex gap-4">
            {LEGALES.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="transition-colors hover:text-marca-rosa">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}