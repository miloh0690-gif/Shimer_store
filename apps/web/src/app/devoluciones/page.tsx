import type { Metadata } from 'next'

import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Devoluciones — SHIMER',
  description: 'Cambios y devoluciones dentro de los 7 días de la entrega.',
}

export default function DevolucionesPage() {
  return (
    <LegalPage titulo="Devoluciones" actualizado="7 de octubre de 2026">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Cuándo podés devolver</h2>
        <p>
          Tenés 7 días naturales desde la entrega para pedir un cambio o una devolución. El producto
          tiene que estar sin uso, con su empaque original y con todos los accesorios que venían.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Cómo pedir la devolución</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Escribinos por WhatsApp con tu folio y el motivo de la devolución.</li>
          <li>Traé el pedido a la tienda y lo revisamos con vos.</li>
          <li>Si corresponde, te devolvemos el monto o te entregamos el producto de reemplazo.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Casos que no admiten cambio</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Productos sin uso pero con marcas de uso, mojados o dañados por el cliente.</li>
          <li>Materiales que se cortan o se usan a pedido, como tizas o marcadores de pizarra.</li>
          <li>Artículos de aseo o de limpieza ya abiertos.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Errores nuestros</h2>
        <p>
          Si te entregamos un producto equivocado, con daño o que no corresponde a lo pedido, el
          costo es nuestro: traelo y te lo cambiamos en el momento.
        </p>
      </section>
    </LegalPage>
  )
}
