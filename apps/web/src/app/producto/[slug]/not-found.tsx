import Link from 'next/link'

export default function ProductoNoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="font-display text-sm uppercase tracking-wide text-marca-violeta">Error 404</p>
      <h1 className="font-display text-4xl text-tinta">No encontramos ese producto</h1>
      <p className="text-tinta/70">
        Puede que se haya agotado o que el enlace esté incompleto. Mirá el catálogo completo, seguro
        encontrás algo que te guste.
      </p>
      <Link
        href="/productos"
        className="mt-2 rounded-full bg-[image:var(--gradiente-marca)] px-7 py-3 font-semibold text-white transition hover:scale-[1.03]"
      >
        Ver todos los productos
      </Link>
    </main>
  )
}
