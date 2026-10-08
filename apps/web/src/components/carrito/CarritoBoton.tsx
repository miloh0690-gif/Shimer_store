'use client'

import { useCarrito } from './CartProvider'

export function CarritoBoton() {
  const { count, setAbierto } = useCarrito()

  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      aria-label={`Ver carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
      className="relative rounded-full p-2 text-tinta/70 transition-colors hover:bg-white hover:text-marca-violeta"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 4h2l2.4 11h10L20 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="19" r="1.4" />
        <circle cx="17" cy="19" r="1.4" />
      </svg>
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-marca-magenta px-1 text-[11px] font-bold leading-none text-white"
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

export default CarritoBoton
