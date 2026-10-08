import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Envíos — SHIMER',
  description: 'Entregas en Cochabamba el mismo día y envíos nacionales por transportista.',
}

export default function EnviosPage() {
  return (
    <LegalPage titulo="Envíos" actualizado="7 de octubre de 2026">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Cochabamba</h2>
        <p>
          Entregamos en el día dentro de Cochabamba si el pedido se confirma antes de las 14:00.
          El envío es gratis a partir de Bs. 150 de compra; por debajo de ese monto tiene un costo
          fijo que te confirmamos por WhatsApp antes de despacho.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Nacional</h2>
        <p>
          Para el resto del Bolivia usamos transportista. El costo se calcula según el peso y el
          destino, y lo calculamos al confirmar el pedido. El tiempo de entrega suele ser de 2 a 5
          días hábiles según la ciudad.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Cómo pedir</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Armás tu carrito en el sitio y vas al checkout.</li>
          <li>Completás tus datos y elegís si el envío es en Cochabamba o nacional.</li>
          <li>Te contactamos por WhatsApp para confirmar disponibilidad, envío y forma de pago.</li>
          <li>Preparamos tu pedido y te enviamos el número de folio para que lo sigas.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Seguimiento</h2>
        <p>
          Cada pedido tiene un folio con el formato <span className="font-mono">SHM-000001</span>. Podés
          verlo en tu cuenta o en el mensaje de confirmación que te mandamos.
        </p>
      </section>
    </LegalPage>
  )
}
