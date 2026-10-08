import { apiGet, qs } from '@/lib/api'
import { formatBob } from '@/lib/format'
import type { ProductListResponse } from '@/lib/types'
import { EditarProducto } from './EditarProducto'

const POR_PAGINA = 60

/**
 * Server component: lee el catalogo por la API y delega la edicion en
 * `EditarProducto`, que es client. El token llega por prop y se pasa hacia
 * abajo: viaja en el payload RSC del HTML, no en el bundle descargable, y solo
 * se pide en las tres rutas de /admin.
 *
 * La API filtra siempre por `activo = true`, asi que esta tabla muestra solo el
 * catalogo activo y por eso no edita ese campo.
 */
export async function TablaProductos({ token }: { token: string }) {
  let productos: ProductListResponse['items'] = []

  try {
    const respuesta = await apiGet<ProductListResponse>(
      `/api/products${qs({ por_pagina: POR_PAGINA, orden: 'nombre' })}`,
      { next: { revalidate: 0 } },
    )
    productos = respuesta.items
  } catch {
    return (
      <p className="rounded-2xl border border-rosa/30 bg-rosa/8 px-4 py-3 text-sm text-rosa">
        No pudimos cargar los productos. Revisa que la API este disponible.
      </p>
    )
  }

  if (productos.length === 0) {
    return (
      <p className="rounded-2xl border border-tinta/10 bg-white px-5 py-8 text-center text-tinta/60">
        No hay productos activos en el catalogo.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-tinta/10 bg-white">
      <table className="w-full min-w-[52rem] text-sm">
        <caption className="sr-only">Productos del catalogo</caption>
        <thead>
          <tr className="border-b border-tinta/10 text-left text-xs uppercase tracking-wide text-tinta/50">
            <th scope="col" className="px-4 py-3">Producto</th>
            <th scope="col" className="px-4 py-3 text-right">Precio</th>
            <th scope="col" className="px-4 py-3 text-right">Oferta</th>
            <th scope="col" className="px-4 py-3">Edicion</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id} className="border-b border-tinta/6 last:border-0">
              <td className="px-4 py-3">
                <span className="block font-semibold text-tinta">{producto.nombre}</span>
                <span className="block text-xs text-tinta/55">
                  {producto.categoria?.nombre ?? 'Sin categoria'} ·{' '}
                  {producto.marca?.nombre ?? 'Sin marca'}
                  {producto.color ? ` · ${producto.color}` : ''}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-tinta">
                {formatBob(producto.precio_bob_cents)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-tinta/70">
                {producto.precio_oferta_bob_cents === null
                  ? '—'
                  : formatBob(producto.precio_oferta_bob_cents)}
              </td>
              <td className="px-4 py-3">
                <EditarProducto
                  productoId={producto.id}
                  stockInicial={producto.stock}
                  destacadoInicial={producto.destacado}
                  precioInicial={producto.precio_bob_cents}
                  precioOfertaInicial={producto.precio_oferta_bob_cents}
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

export default TablaProductos
