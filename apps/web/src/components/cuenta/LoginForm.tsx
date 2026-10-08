'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

type Modo = 'entrar' | 'crear';

function mensajeDe(error: unknown): string {
  const crudo = error instanceof Error ? error.message : String(error);
  if (/Invalid login credentials/i.test(crudo)) {
    return 'Correo o contraseña incorrectos.';
  }
  if (/User already registered/i.test(crudo)) {
    return 'Ya existe una cuenta con ese correo. Podes entrar con tu contraseña.';
  }
  if (/Password should be at least/i.test(crudo)) {
    return 'La contraseña necesita al menos 6 caracteres.';
  }
  if (/rate limit|too many/i.test(crudo)) {
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
  }
  return 'No pudimos completar la operación. Intenta de nuevo.';
}

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setAviso(null);
    const supabase = getSupabaseBrowser();
    try {
      if (modo === 'entrar') {
        const { error: fallo } = await supabase.auth.signInWithPassword({ email, password });
        if (fallo) throw fallo;
      } else {
        const { data, error: fallo } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (fallo) throw fallo;
        if (data.session === null) {
          setAviso(
            'Cuenta creada. Revisa tu correo para confirmar la direccion y despues podes entrar.'
          );
          setModo('entrar');
          setPassword('');
          return;
        }
      }
      router.push(next);
      router.refresh();
    } catch (fallo) {
      setError(mensajeDe(fallo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-8 w-full max-w-md">
      <div className="rounded-3xl border border-tinta/10 bg-white/70 p-6 shadow-sm">
        <div className="flex gap-1 rounded-full bg-tinta/5 p-1">
          {(['entrar', 'crear'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setError(null);
                setAviso(null);
              }}
              className={
                'flex-1 rounded-full px-4 py-2 text-sm font-medium transition ' +
                (modo === m ? 'bg-white text-tinta shadow-sm' : 'text-tinta/60 hover:text-tinta')
              }
            >
              {m === 'entrar' ? 'Entrar' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          {modo === 'crear' && (
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-tinta">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-tinta/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-marca-violeta"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-tinta">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-tinta/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-marca-violeta"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-tinta">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              required
              className="mt-1 w-full rounded-xl border border-tinta/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-marca-violeta"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-marca-rosa/12 px-4 py-3 text-sm text-marca-rosa">
              {error}
            </p>
          )}
          {aviso && (
            <p role="status" className="rounded-xl bg-menta/12 px-4 py-3 text-sm text-menta">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3 font-semibold text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Un momento...' : modo === 'entrar' ? 'Entrar' : 'Crear mi cuenta'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs text-tinta/50">
        Con tu cuenta ves el historial de tus pedidos. Si prefieres no registrarte, podes comprar
        como invitado: solo perdes el historial.
      </p>
    </div>
  );
}

export function CerrarSesionBoton() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  return (
    <button
      type="button"
      disabled={saliendo}
      onClick={async () => {
        setSaliendo(true);
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();
        router.push('/cuenta');
        router.refresh();
      }}
      className="rounded-full border border-tinta/15 px-5 py-2 text-sm font-medium text-tinta/70 transition hover:border-marca-violeta hover:text-marca-violeta disabled:opacity-60"
    >
      {saliendo ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  );
}
