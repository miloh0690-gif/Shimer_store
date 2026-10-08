import { apiGet } from '@/lib/api';
import { formatBob } from '@/lib/format';
import type { OrderView } from '@/lib/types';

const ESTADOS: Record<string, string> = {
  nuevo: 'Nuevo',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function fecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Lista los pedidos del usuario autenticado usando su token real. */
export default async function OrdenesCliente({ token }: { token: string }) {
  let pedidos: OrderView[] = [];
  let fallo = false;
  try {
    const respuesta = await apiGet<{ items: OrderView[] }>('/api/orders/mine', {
      headers: { authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    pedidos = respuesta.items ?? [];
  } catch {
    fallo = true;
  }

  if (fallo) {
    return (
      <div className="rounded-2xl border border-marca-rosa/25 bg-marca-rosa/8 p-4 text-sm text-tinta/80">
        No pudimos cargar tus pedidos en este momento. Recarga la pagina o probamos más tarde.
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-tinta/10 bg-white/70 p-6 text-sm text-tinta/70">
        Todavia no tenes pedidos con esta cuenta. Cuando confirmes uno, lo vas a ver aqui con su
        folio y su estado.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {pedidos.map((p) => (
        <li key={p.id} className="rounded-2xl border border-tinta/10 bg-white/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-tinta">{p.folio}</p>
              <p className="mt-0.5 text-xs text-tinta/50">
                {fecha(p.created_at)} &middot; {ESTADOS[p.estado] ?? p.estado}
              </p>
            </div>
            <p className="font-display text-xl font-semibold text-marca-violeta">
              {formatBob(p.total_bob_cents)}
            </p>
          </div>

          <ul className="mt-4 space-y-2 border-t border-tinta/8 pt-4">
            {p.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-tinta/80">
                  {item.nombre_snapshot}
                  <span className="text-tinta/50"> &times; {item.cantidad}</span>
                </span>
                <span className="whitespace-nowrap text-tinta/70">
                  {formatBob(item.subtotal_bob_cents)}
                </span>
              </li>
            ))}
          </ul>

          {p.envio_ciudad && (
            <p className="mt-3 text-xs text-tinta/50">
              Entrega: {p.envio_ciudad}
              {p.envio_direccion ? `, ${p.envio_direccion}` : ''}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
