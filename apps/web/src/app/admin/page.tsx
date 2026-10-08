import type { Metadata } from 'next'
import Link from 'next/link'
import { apiGet, qs } from '@/lib/api'
import { getSupabaseServer } from '@/lib/supabase/server'
import { formatBob } from '@/lib/format'
import type { OrderView, ProductListResponse } from '@/lib/types'

export const metadata: Metadata = { title: 'Administracion — SHIMER' }

const ULTIMOS = 5

async function resumen(token: string) {
  const vacio = { pedidos: [] as OrderView[], productos: 0, enOferta: 0, total: 0, ingreso: 0 }

  try {
    const [pedidos, productos] = await Promise.all([
      apiGet<{ items: OrderView[] }>('/api/orders', {
        headers: { authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }),
      apiGet<ProductListResponse>(
        `/api/products${qs({ por_pagina: 60, orden: 'nombre' })}`,
        { next: { revalidate: 0 } },
      ),
    ])

    const sinCancelar = pedidos.items.filter((p) => p.estado !== 'cancelado')

    return {
      pedidos: pedidos.items.slice(0, ULTIMOS),
      productos: productos.total,
      enOferta: productos.items.filter((p) => p.en_oferta).length,
      total: sinCancelar.length,
      ingreso: sinCancelar.reduce((suma, p) => suma + p.total_bob_cents, 0),
    }
  } catch {
    return vacio
  }
}

export default async function AdminHome() {
  const supabase = await getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const datos = await resumen(token)

  const tarjetas = [
    { etiqueta: 'Pedidos sin cancelar', valor: String(datos.total) },
    { etiqueta: 'Ingreso acumulado', valor: formatBob(datos.ingreso) },
    { etiqueta: 'Productos activos', valor: String(datos.productos) },
    { etiqueta: 'Productos en oferta', valor: String(datos.enOferta) },
  ]

  return (
    <section>
      <h2 className="font-display text-2xl text-tinta">Resumen</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.etiqueta} className="rounded-2xl border border-tinta/10 bg-white p-5">
            <p className="text-sm text-tinta/55">{tarjeta.etiqueta}</p>
            <p className="mt-1 font-display text-2xl text-tinta">{tarjeta.valor}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-10 font-display text-xl text-tinta">Ultimos pedidos</h3>
      {datos.pedidos.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-tinta/10 bg-white px-5 py-6 text-center text-tinta/60">
          Todavia no hay pedidos registrados.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-tinta/8 overflow-hidden rounded-2xl border border-tinta/10 bg-white">
          {datos.pedidos.map((pedido) => (
            <li key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-display text-tinta">{pedido.folio}</p>
                <p className="text-sm text-tinta/55">
                  {pedido.cliente_nombre} · {pedido.cliente_email}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-tinta">{formatBob(pedido.total_bob_cents)}</p>
                <p className="text-sm capitalize text-tinta/55">{pedido.estado}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/pedidos"
          className="rounded-full bg-[image:var(--gradiente-marca)] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.03]"
        >
          Gestionar pedidos
        </Link>
        <Link
          href="/admin/productos"
          className="rounded-full border border-tinta/15 px-5 py-2.5 text-sm font-semibold text-tinta/70 transition hover:border-marca-violeta hover:text-marca-violeta"
        >
          Gestionar productos
        </Link>
      </div>
    </section>
  )
}
