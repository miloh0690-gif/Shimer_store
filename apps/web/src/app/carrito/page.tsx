import type { Metadata } from 'next'
import { CarritoVivo } from '@/components/carrito/CarritoVivo'

export const metadata: Metadata = {
  title: 'Carrito — SHIMER',
  description: 'Revisa los productos de tu pedido antes de finalizar la compra.',
}

export default function PaginaCarrito() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-tinta sm:text-4xl">Tu carrito</h1>
      <p className="mt-2 text-sm text-tinta/60">
        Estos productos se guardan en este navegador. El total final lo calcula el servidor.
      </p>
      <div className="mt-8">
        <CarritoVivo />
      </div>
    </main>
  )
}
