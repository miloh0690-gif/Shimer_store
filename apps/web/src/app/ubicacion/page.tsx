import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Ubicacion — SHIMER' };

export default function UbicacionPage() {
  return (
    <LegalPage titulo="Donde estamos" actualizado="2026-10-07">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Direccion</h2>
        <p className="mt-2">
          Calle de ejemplo 123, zona Las Cuadras
          <br />
          Cochabamba, Bolivia
        </p>
        <p className="mt-2">
          Telefono: <span className="font-mono">+591 700 00000</span>
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Como llegar</h2>
        <p className="mt-2">
          El local esta a pocas cuadras del mercado de Las Cuadras. Se puede estacionar en la calle; para entregas grandes
          conviene coordinar antes por WhatsApp.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Recogida en tienda</h2>
        <p className="mt-2">
          Si eliges la entrega en Cochabamba, tambien podes pasar a recoger tu pedido al local
          en horario de atencion. Te avisamos por correo cuando este listo.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Mapa</h2>
        <p className="mt-2">
          El mapa es aproximado y sirve para ubicarse en la zona, no para el local exacto.
        </p>
        <iframe
          title="Mapa aproximado de la zona de Las Cuadras, Cochabamba"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-66.1868%2C-17.3695%2C-66.1268%2C-17.4095&amp;layer=mapnik&amp;marker=-17.3895%2C-66.1568"
          className="mt-3 h-72 w-full rounded-2xl border border-tinta/10"
          loading="lazy"
        />
      </section>
    </LegalPage>
  );
}
