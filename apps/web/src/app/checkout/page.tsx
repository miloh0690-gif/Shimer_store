import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout — SHIMER',
  description: 'Confirmá tu pedido de SHIMER y coordinamos la entrega.',
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <nav aria-label="Migas de pan" className="text-sm text-tinta/55">
        <Link href="/" className="transition hover:text-marca-violeta">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link href="/carrito" className="transition hover:text-marca-violeta">
          Carrito
        </Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-tinta">Checkout</span>
      </nav>

      <h1 className="mt-4 font-display text-4xl text-tinta">Confirmar pedido</h1>
      <p className="mt-2 max-w-2xl text-tinta/65">
        Revisá tus datos y decinos cómo lo querés recibir. El total lo calcula el servidor, no el
        navegador.
      </p>

      <div className="mt-8">
        <CheckoutForm />
      </div>
    </main>
  )
}
