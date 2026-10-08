import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pedido confirmado — SHIMER',
  description: 'Recibimos tu pedido de SHIMER.',
}

const proximosPasos = [
  {
    titulo: 'Te escribimos al correo',
    detalle: 'Dentro de las próximas horas te llega la confirmación con el detalle del pedido.',
  },
  {
    titulo: 'Te llamamos para coordinar',
    detalle: 'Confirmamos por teléfono o WhatsApp la entrega y el pago.',
  },
  {
    titulo: 'Preparamos tu pedido',
    detalle: 'Verificamos el stock y te avisamos apenas esté listo para salir.',
  },
]

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ folio?: string | string[] }>
}) {
  const params = await searchParams
  const bruto = Array.isArray(params.folio) ? params.folio[0] : params.folio
  const folio = bruto?.trim() ? bruto.trim() : null

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-menta/12 text-menta">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="mt-6 font-display text-4xl text-tinta">¡Pedido confirmado!</h1>

      {folio ? (
        <>
          <p className="mt-3 text-tinta/65">Guardá este folio, es la referencia de tu pedido.</p>
          <p className="mt-4 font-display text-5xl tracking-tight text-marca-violeta">{folio}</p>
        </>
      ) : (
        <p className="mt-3 text-tinta/65">
          Recibimos tu pedido. Si no encontrás el folio, escribinos y lo buscamos.
        </p>
      )}

      <ol className="mx-auto mt-10 grid gap-4 text-left sm:grid-cols-3">
        {proximosPasos.map((paso, i) => (
          <li key={paso.titulo} className="rounded-2xl border border-tinta/10 bg-white p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-marca-violeta/10 font-display text-sm text-marca-violeta">
              {i + 1}
            </span>
            <h2 className="mt-3 font-display text-base text-tinta">{paso.titulo}</h2>
            <p className="mt-1 text-sm text-tinta/60">{paso.detalle}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/productos"
          className="rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3 font-display text-white shadow-lg transition hover:scale-[1.03]"
        >
          Seguir comprando
        </Link>
        <Link
          href="/contacto"
          className="rounded-full border border-tinta/15 px-6 py-3 font-semibold text-tinta/70 transition hover:border-tinta/35"
        >
          Escribinos
        </Link>
      </div>
    </main>
  )
}
