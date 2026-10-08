import type { Metadata } from 'next'
import { getSupabaseServer } from '@/lib/supabase/server'
import { TablaProductos } from '@/components/admin/TablaProductos'

export const metadata: Metadata = { title: 'Productos — SHIMER' }

export default async function AdminProductosPage() {
  const supabase = await getSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <section>
      <h2 className="font-display text-2xl text-tinta">Productos</h2>
      <p className="mt-1 text-sm text-tinta/60">
        Edita stock, destacado y estado. Cada guardado pasa por la API, que exige rol de
        administrador.
      </p>
      <div className="mt-5">
        <TablaProductos token={session?.access_token ?? ''} />
      </div>
    </section>
  )
}
