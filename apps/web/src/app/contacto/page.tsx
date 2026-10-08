import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Contacto — SHIMER' };

export default function ContactoPage() {
  return (
    <LegalPage titulo="Contacto" actualizado="2026-10-07">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Escribinos</h2>
        <p className="mt-2">
          La forma mas segura es el correo. Respondemos en horario de atencion y normalmente
          dentro del mismo dia habil.
        </p>
        <p className="mt-2">
          Correo: <span className="font-mono">contacto@shimer.test</span>
        </p>
        <p className="mt-2">
          Telefono / WhatsApp: <span className="font-mono">+591 700 00000</span>
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Horario de atencion</h2>
        <p className="mt-2">
          Lunes a sabado de 14:00 a 19:00. Domingo cerrado.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Consultas de un pedido</h2>
        <p className="mt-2">
          Incluye siempre el numero de folio (SHM-000000) en el mensaje. Con eso encontramos el
          pedido al instante y te damos el estado exacto.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Productos a pedido</h2>
        <p className="mt-2">
          Si buscas algo que no aparece en el catalogo, escribinos con el nombre o una foto.
          Confirmamos disponibilidad y plazo antes de reservar.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Ventas por mayoreo</h2>
        <p className="mt-2">
          Atendemos pedidos por mayor para escuelas, oficinas y talleres. Escribinos cantidades
          y el lugar de entrega para cotizar.
        </p>
      </section>
    </LegalPage>
  );
}
