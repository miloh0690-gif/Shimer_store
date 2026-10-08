import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para el navegador. A diferencia de `createClient` de
 * `supabase-js`, este escribe la sesion en la cookie que leen los server
 * components: sin esto, iniciar sesion en `/cuenta` no haria que `/admin`
 * reconociera al usuario.
 */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
