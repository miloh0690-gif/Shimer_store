import { apiGet } from '@/lib/api'
import { formatBob } from '@/lib/format'
import type { OrderView } from '@/lib/types'
import { CambiarEstado } from './CambiarEstado'

const ETIQUETAS_ENVIO: Record<string, string> = {
  cochabamba: 'Retiro en Cochabamba',
  nacional: 'Envio nacional',
}

function fecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Server component: pide los pedidos a la API con el token del admin y los
 * pasa como prop. El token viaja por props a `CambiarEstado`, nunca queda
 * incrustado en el bundle del navegador.
 */
export async function TablaPedidos({ token }: { token: string }) {
  let pedidos: OrderView[] = []

  try {
    const respuesta = await apiGet<{ items: OrderView[]; total: number }>('/api/orders', {
      headers: { authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })
    pedidos = respuesta.items
  } catch {
    return (
      <p className="rounded-2xl border border-rosa/30 bg-rosa/8 px-4 py-3 text-sm text-rosa">
        No pudimos cargar los pedidos. Revisa que la API este disponible.
      </p>
    )
  }

  if (pedidos.length === 0) {
    return (
      <p className="rounded-2xl border border-tinta/10 bg-white px-5 py-8 text-center text-tinta/60">
        Todavia no hay pedidos registrados.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-tinta/10 bg-white">
      <table className="w-full min-w-[52rem] text-sm">
        <caption className="sr-only">Pedidos registrados</caption>
        <thead>
          <tr className="border-b border-tinta/10 text-left text-xs uppercase tracking-wide text-tinta/50">
            <th scope="col" className="px-4 py-3">Folio</th>
            <th scope="col" className="px-4 py-3">Fecha</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Entrega</th>
            <th scope="col" className="px-4 py-3 text-right">Total</th>
            <th scope="col" className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="border-b border-tinta/6 last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-display text-tinta">{pedido.folio}</td>
              <td className="whitespace-nowrap px-4 py-3 text-tinta/60">{fecha(pedido.created_at)}</td>
              <td className="px-4 py-3">
                <span className="block font-semibold text-tinta">{pedido.cliente_nombre}</span>
                <span className="block text-xs text-tinta/55">
                  {pedido.cliente_email} · {pedido.cliente_telefono}
                </span>
              </td>
              <td className="px-4 py-3 text-tinta/70">
                <span className="block">{ETIQUETAS_ENVIO[pedido.envio_tipo] ?? pedido.envio_tipo}</span>
                {pedido.envio_ciudad && (
                  <span className="block text-xs text-tinta/55">
                    {pedido.envio_direccion}, {pedido.envio_ciudad}
                  </span>
                )}
                <span className="block text-xs text-tinta/55">
                  {pedido.items.length} producto{pedido.items.length === 1 ? '' : 's'}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-tinta">
                {formatBob(pedido.total_bob_cents)}
              </td>
              <td className="px-4 py-3">
                <CambiarEstado
                  pedidoId={pedido.id}
                  estadoInicial={pedido.estado}
                  token={token}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TablaPedidos
