import Image from 'next/image'
import Link from 'next/link'

const ENLACES = [
  { href: '/productos', texto: 'Productos' },
  { href: '/envios', texto: 'Envíos' },
  { href: '/formas-de-pago', texto: 'Formas de pago' },
  { href: '/ubicacion', texto: 'Ubicación' },
  { href: '/contacto', texto: 'Contacto' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-tinta/8 bg-crema/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="SHIMER"
            width={44}
            height={44}
            className="rounded-xl shadow-sm"
            priority
          />
          <span className="font-display text-xl font-semibold text-tinta">SHIMER</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-6 md:flex">
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-sm font-semibold text-tinta/70 transition-colors duration-200 hover:text-marca-violeta"
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/productos"
            aria-label="Buscar productos"
            className="rounded-full p-2 text-tinta/70 transition-colors hover:bg-white hover:text-marca-violeta"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href="/carrito"
            aria-label="Ver carrito"
            className="rounded-full p-2 text-tinta/70 transition-colors hover:bg-white hover:text-marca-violeta"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 4h2l2.4 11h10L20 7H6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="19" r="1.4" />
              <circle cx="17" cy="19" r="1.4" />
            </svg>
          </Link>
        </div>
      </div>

      <nav aria-label="Principal móvil" className="flex gap-4 overflow-x-auto px-6 pb-3 md:hidden">
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="whitespace-nowrap text-sm font-semibold text-tinta/70"
          >
            {e.texto}
          </Link>
        ))}
      </nav>
    </header>
  )
}