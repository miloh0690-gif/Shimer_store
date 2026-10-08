import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import LoginForm, { CerrarSesionBoton } from '@/components/cuenta/LoginForm';
import OrdenesCliente from '@/components/cuenta/OrdenesCliente';

export const metadata: Metadata = { title: 'Mi cuenta — SHIMER' };

function destinoSeguro(next: string | undefined): string {
  if (!next) return '/cuenta';
  // Solo rutas internas: evita que ?next= responda a un sitio externo.
  return next.startsWith('/') && !next.startsWith('//') ? next : '/cuenta';
}

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destino = destinoSeguro(next);
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold text-tinta sm:text-5xl">Mi cuenta</h1>
        <p className="mt-2 max-w-prose text-tinta/70">
          Entra para ver el estado de tus pedidos y sus folios. Tambien podes comprar sin cuenta:
          solo no vas a tener historial.
        </p>
        <LoginForm next={destino} />
      </main>
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-tinta sm:text-5xl">Mi cuenta</h1>
          <p className="mt-2 text-tinta/70">
            Sesión iniciada como <span className="font-medium text-tinta">{user.email}</span>
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-tinta">Mis pedidos</h2>
        <div className="mt-4">
          {session?.access_token ? (
            <OrdenesCliente token={session.access_token} />
          ) : (
            <p className="rounded-2xl border border-tinta/10 bg-white/70 p-6 text-sm text-tinta/70">
              No pudimos leer tu sesión. Vuelve a entrar para ver tus pedidos.
            </p>
          )}
        </div>
      </section>

      <p className="mt-8 text-sm text-tinta/60">
        Consultas sobre un pedido? Escribenos con el folio y te respondemos. Ver{' '}
        <Link href="/contacto" className="text-marca-violeta underline">
          contacto
        </Link>
        .
      </p>
    </main>
  );
}
