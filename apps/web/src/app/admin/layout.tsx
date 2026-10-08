import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Administracion — SHIMER',
  robots: { index: false, follow: false },
}

const pestanas = [
  { href: '/admin', etiqueta: 'Resumen' },
  { href: '/admin/pedidos', etiqueta: 'Pedidos' },
  { href: '/admin/productos', etiqueta: 'Productos' },
]

/**
 * Guard de todo `/admin`. Corre en el servidor: el rol se lee de `profiles` en
 * la base, nunca de lo que mande el navegador. Sin sesion redirigimos a
 * `/cuenta`; con sesion pero sin rol de admin devolvemos 404 para no confirmar
 * que la ruta existe.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/cuenta?next=/admin')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  if (perfil?.rol !== 'admin') notFound()

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-tinta">Administracion</h1>
          <p className="mt-1 text-sm text-tinta/60">
            Sesion de {user.email}. El control de acceso se valida en el servidor y en la API.
          </p>
        </div>
      </div>

      <nav aria-label="Secciones de administracion" className="mt-6 flex flex-wrap gap-2">
        {pestanas.map((pestana) => (
          <Link
            key={pestana.href}
            href={pestana.href}
            className="rounded-full border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta/70 transition hover:border-marca-violeta hover:text-marca-violeta"
          >
            {pestana.etiqueta}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  )
}
