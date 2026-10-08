import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Términos y condiciones — SHIMER' };

export default function TerminosPage() {
  return (
    <LegalPage titulo="Términos y condiciones" actualizado="2026-10-07">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">1. Sobre estos terminos</h2>
        <p className="mt-2">
          Estos terminos regulan el uso de la tienda de SHIMER. Al navegar el sitio, agregar
          productos al carrito o enviar un pedido, aceptas las condiciones que se describen aqui.
          Si no estas de acuerdo con alguna de ellas, te pedimos que no completes un pedido.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">2. Productos y precios</h2>
        <p className="mt-2">
          Los precios se muestran en bolivianos (Bs.) e incluyen los impuestos aplicables. El
          precio que se confirma es siempre el que calcula el servidor al momento de registrar el
          pedido, nunca el que se ve en pantalla antes de confirmar. Si un producto aparece con
          un precio que ya no podemos sostener, te contactamos antes de despachar.
        </p>
        <p className="mt-2">
          Las imagenes de los productos son ilustrativas. Las variaciones de color y presentacion
          se eligen en la pagina de cada producto y quedan registradas con el pedido.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">3. Pedidos y disponibilidad</h2>
        <p className="mt-2">
          Al confirmar un pedido te damos un numero de folio con el formato SHM-000000. Ese folio
          es la referencia para cualquier consulta. Un pedido se acepta cuando el stock del
          producto y el de la variation elegida alcanzan la cantidad pedida; si no alcanzan,
          el pedido se rechaza y te avisamos por el medio de contacto que registraste.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">4. Pagos</h2>
        <p className="mt-2">
          Por ahora el pago se coordina fuera del sitio: efectivo en el momento de la entrega o
          transferencia bancaria. El pedido queda registrado igual, y el pago se confirma por
          separado. Cuando se active una pasarela de pago en linea, esta seccion se actualiza
          antes de usarla.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">5. Entregas y plazos</h2>
        <p className="mt-2">
          Los plazos de entrega dependen de la cobertura y se detallan en la pagina de envios.
          Los dias habiles no incluyen domingos ni feriados. Si el pedido no puede entregarse en
          el plazo acordado, te lo avisamos para coordinar otra fecha o la devolucion del pago.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">6. Responsabilidad del cliente</h2>
        <p className="mt-2">
          Es responsabilidad del cliente revisar que los datos de contacto y de entrega sean
          correctos antes de confirmar. Datos erroneos hacen que el pedido no llegue, y en ese
          caso no podemos asumir el costo de un nuevo envio.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">7. Cambios a estos terminos</h2>
        <p className="mt-2">
          Podemos actualizar estas condiciones para reflejar cambios en la tienda o en la
          legislacion. La fecha de la ultima actualizacion aparece al inicio de la pagina. Los
          pedidos ya confirmados se rigen por las condiciones vigentes al momento de confirmarlos.
        </p>
      </section>
    </LegalPage>
  );
}
