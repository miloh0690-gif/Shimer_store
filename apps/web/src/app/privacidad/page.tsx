import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacidad — SHIMER' };

export default function PrivacidadPage() {
  return (
    <LegalPage titulo="Privacidad" actualizado="2026-10-07">
      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Que datos recogemos</h2>
        <p className="mt-2">
          Solo recogemos lo que hace falta para atender un pedido: nombre, correo electronico,
          telefono y los datos de entrega que nos des. Si creas una cuenta en el sitio, guardamos
          tu correo y tu nombre para que puedas ver tus pedidos.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Para que los usamos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Preparar, enviar y hacer seguimiento del pedido.</li>
          <li>Contactarte si hay un problema con el stock, el pago o la entrega.</li>
          <li>Mostrarte el historial de pedidos de tu cuenta.</li>
        </ul>
        <p className="mt-2">
          No vendemos ni alquilamos tus datos, y no los usamos para publicidad de terceros.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Donde se guardan</h2>
        <p className="mt-2">
          Los datos viven en una base de datos en la nube y las contraseñas nunca se guardan: la
          autenticacion la resuelve un servicio externo. El acceso a la base esta restringido al
          personal que lo necesita para atender pedidos.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Tus derechos</h2>
        <p className="mt-2">
          Puedes pedirnos ver, corregir o eliminar los datos que tenemos de ti. Si creaste una
          cuenta, puedes hacerlo escribiendonos. Si solo hiciste pedidos sin cuenta, responde al
          correo con el que compraste y lo gestionamos. Respondemos en un plazo razonable.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Cookies</h2>
        <p className="mt-2">
          Usamos lo minimo indispensable: recordar tu sesion si iniciaste sesion y guardar tu
          carrito en el navegador para que no se pierda al recargar. No usamos cookies de
          seguimiento publicitario.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-tinta">Menores de edad</h2>
        <p className="mt-2">
          El sitio se orienta a compras de personas mayores de edad. Si crees que un menor se
          registro con datos que no le pertenecen, avisanos y los eliminamos.
        </p>
      </section>
    </LegalPage>
  );
}
