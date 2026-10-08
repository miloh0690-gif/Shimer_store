import type { Metadata } from 'next'
import { getSupabaseServer } from '@/lib/supabase/server'
import { TablaPedidos } from '@/components/admin/TablaPedidos'

export const metadata: Metadata = { title: 'Pedidos — SHIMER' }

export default async function AdminPedidosPage() {
  const supabase = await getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token ?? ''

  return (
    <section>
      <h2 className="font-display text-2xl text-tinta">Pedidos</h2>
      <p className="mt-1 text-sm text-tinta/60">
        Cambiar el estado escribe en la base mediante la API, que exige rol de administrador.
      </p>
      <div className="mt-5">
        <TablaPedidos token={token} />
      </div>
    </section>
  )
}
