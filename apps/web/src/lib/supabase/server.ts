import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase para servidor. Usa las cookies de la sesion para que
 * `auth.getUser()` valide contra el servidor y no confie en el JWT del cliente.
 * Nunca se usa la `service_role`: esa vive solo en la API de Render.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) =>
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  )
}
