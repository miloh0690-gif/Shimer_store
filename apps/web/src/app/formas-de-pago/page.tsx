import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Formas de pago — SHIMER',
  description: 'Efectivo, transferencia bancaria y proximamente pago en linea.',
}

export default function FormasDePagoPage() {
  return (
    <LegalPage titulo="Formas de pago" actualizado="7 de octubre de 2026">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Efectivo</h2>
        <p>
          Pagás al recibir el pedido, en el momento de la entrega. Es la forma más usada en
          Cochabamba y la única disponible para envíos por transportista.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Transferencia bancaria</h2>
        <p>
          Si preferís transferir, te enviamos los datos de la cuenta cuando confirmamos tu pedido. La
          orden queda en estado confirmado recién cuando detectamos el pago.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Pago en linea</h2>
        <p>
          El pago en línea llega cuando se active la pasarela. Por ahora el carrito guarda el pedido
          y te contactamos para coordinar el pago; no se cobra nada en el sitio.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Facturas</h2>
        <p>
          Emitimos factura a pedido. Pedíla en la confirmación del pedido indicando tu NIT y la razón
          social.
        </p>
      </section>
    </LegalPage>
  )
}
