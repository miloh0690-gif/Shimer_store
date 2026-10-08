'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { CheckoutSchema, type CheckoutDatos } from '@/lib/checkout-schema'
import { apiUrl } from '@/lib/api'
import type { ApiErrorBody, CreateOrderResponse } from '@/lib/types'
import { useCarrito } from '@/components/carrito/CartProvider'
import { formatBob } from '@/lib/format'
import { borrarIdempotencia, leerIdempotencia } from '@/lib/idempotencia'

type Errores = Partial<Record<keyof CheckoutDatos, string>>

function erroresDeZod(error: z.ZodError): Errores {
  const salida: Errores = {}
  for (const issue of error.issues) {
    const campo = issue.path[0] as keyof CheckoutDatos | undefined
    if (campo && !salida[campo]) salida[campo] = issue.message
  }
  return salida
}

export function CheckoutForm() {
  const router = useRouter()
  const { state, dispatch, subtotal, listo } = useCarrito()

  // La key vive en sessionStorage, no en el estado del componente: si el POST
  // llega a la API pero la respuesta se pierde y el cliente vuelve a /checkout,
  // tiene que mandar la misma key para que la API responda la orden ya creada
  // en vez de duplicar el pedido. Se borra recien con la confirmacion.
  //
  // Se lee en un efecto y no en el inicializador del useState porque esta pagina
  // se prerenderiza en el servidor, donde `window` no existe. El inicializador
  // corre en el servidor y volveria una key distinta a la del cliente.
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  useEffect(() => {
    setIdempotencyKey(leerIdempotencia(window.sessionStorage))
  }, [])

  const [datos, setDatos] = useState<CheckoutDatos>({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    envio_tipo: 'cochabamba',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo: keyof CheckoutDatos, valor: string) {
    setDatos((previo) => ({ ...previo, [campo]: valor }) as CheckoutDatos)
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
    setErrorEnvio(null)
  }

  async function pedir(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) return

    const parsed = CheckoutSchema.safeParse(datos)
    if (!parsed.success) {
      setErrores(erroresDeZod(parsed.error))
      return
    }
    if (state.lines.length === 0) {
      setErrorEnvio('Tu carrito está vacío.')
      return
    }

    setEnviando(true)
    setErrorEnvio(null)

    // Si el efecto todavia no corrio (o el storage fallo), se lee ahora: el
    // importante es que todas las lineas siguientes usen la misma.
    const key = idempotencyKey ?? leerIdempotencia(window.sessionStorage)

    try {
      const respuesta = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': key,
        },
        body: JSON.stringify({
          cliente_nombre: parsed.data.cliente_nombre,
          cliente_email: parsed.data.cliente_email,
          cliente_telefono: parsed.data.cliente_telefono,
          envio_tipo: parsed.data.envio_tipo,
          ...(parsed.data.envio_tipo === 'nacional'
            ? {
                envio_direccion: parsed.data.envio_direccion,
                envio_ciudad: parsed.data.envio_ciudad,
              }
            : {}),
          items: state.lines.map((linea) => ({
            product_id: linea.product_id,
            ...(linea.variant_id ? { variant_id: linea.variant_id } : {}),
            cantidad: linea.cantidad,
          })),
        }),
      })

      if (!respuesta.ok) {
        let mensaje = 'No pudimos registrar tu pedido. Intentá de nuevo.'
        try {
          const cuerpo = (await respuesta.json()) as ApiErrorBody
          if (cuerpo?.error?.message) mensaje = cuerpo.error.message
        } catch {
          // respuesta sin JSON: nos quedamos con el mensaje generico
        }
        setErrorEnvio(mensaje)
        return
      }

      const creado = (await respuesta.json()) as CreateOrderResponse
      // El pedido quedo registrado: la key ya cumplio su funcion y la proxima
      // compra tiene que poder crear su propia orden.
      borrarIdempotencia(window.sessionStorage)
      setIdempotencyKey(null)
      dispatch({ type: 'vaciar' })
      router.push('/exito?folio=' + encodeURIComponent(creado.folio))
    } catch {
      // Fallo de red: el boton se rehabilita y el proximo intento reutiliza
      // la misma idempotencyKey, asi que no se puede duplicar el pedido.
      setErrorEnvio('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (!listo) {
    return (
      <div aria-busy="true" className="rounded-3xl border border-tinta/10 bg-white p-10 text-center">
        <p className="text-tinta/55">Cargando tu carrito…</p>
      </div>
    )
  }

  if (state.lines.length === 0) {
    return (
      <div className="rounded-3xl border border-tinta/10 bg-white p-10 text-center">
        <h2 className="font-display text-2xl text-tinta">Tu carrito está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-tinta/60">
          Agregá algo antes de confirmar el pedido.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3 font-display text-white shadow-lg transition hover:scale-[1.03]"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  const campo = 'w-full rounded-xl border border-tinta/15 bg-white px-4 py-3 text-tinta outline-none transition focus:border-marca-violeta'
  const etiqueta = 'block text-sm font-semibold text-tinta'

  return (
    <form onSubmit={pedir} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5 rounded-3xl border border-tinta/10 bg-white p-6">
        <div>
          <h2 className="font-display text-xl text-tinta">Tus datos</h2>
          <p className="text-sm text-tinta/60">Solo los usamos para coordinar la entrega.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cliente_nombre" className={etiqueta}>
              Nombre completo
            </label>
            <input
              id="cliente_nombre"
              name="nombre"
              autoComplete="name"
              className={`${campo} mt-1`}
              value={datos.cliente_nombre}
              onChange={(e) => cambiar('cliente_nombre', e.target.value)}
              aria-invalid={errores.cliente_nombre ? true : undefined}
              aria-describedby={errores.cliente_nombre ? 'error-cliente_nombre' : undefined}
            />
            {errores.cliente_nombre && (
              <p id="error-cliente_nombre" className="mt-1 text-sm text-rosa">
                {errores.cliente_nombre}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cliente_email" className={etiqueta}>
              Correo electrónico
            </label>
            <input
              id="cliente_email"
              name="email"
              type="email"
              autoComplete="email"
              className={`${campo} mt-1`}
              value={datos.cliente_email}
              onChange={(e) => cambiar('cliente_email', e.target.value)}
              aria-invalid={errores.cliente_email ? true : undefined}
              aria-describedby={errores.cliente_email ? 'error-cliente_email' : undefined}
            />
            {errores.cliente_email && (
              <p id="error-cliente_email" className="mt-1 text-sm text-rosa">
                {errores.cliente_email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cliente_telefono" className={etiqueta}>
              Teléfono / WhatsApp
            </label>
            <input
              id="cliente_telefono"
              name="telefono"
              type="tel"
              autoComplete="tel"
              className={`${campo} mt-1`}
              value={datos.cliente_telefono}
              onChange={(e) => cambiar('cliente_telefono', e.target.value)}
              aria-invalid={errores.cliente_telefono ? true : undefined}
              aria-describedby={errores.cliente_telefono ? 'error-cliente_telefono' : undefined}
            />
            {errores.cliente_telefono && (
              <p id="error-cliente_telefono" className="mt-1 text-sm text-rosa">
                {errores.cliente_telefono}
              </p>
            )}
          </div>
        </div>

        <fieldset>
          <legend className={etiqueta}>¿Cómo lo querés recibir?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {[
              { valor: 'cochabamba', titulo: 'Retiro en tienda', nota: 'Cochabamba, sin costo de envío.' },
              { valor: 'nacional', titulo: 'Envío nacional', nota: 'Te lo enviamos a todo el país.' },
            ].map((opcion) => (
              <label
                key={opcion.valor}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  datos.envio_tipo === opcion.valor
                    ? 'border-marca-violeta bg-marca-violeta/6'
                    : 'border-tinta/12 hover:border-tinta/25'
                }`}
              >
                <input
                  type="radio"
                  name="envio_tipo"
                  value={opcion.valor}
                  checked={datos.envio_tipo === opcion.valor}
                  onChange={(e) => cambiar('envio_tipo', e.target.value)}
                  className="mt-1 accent-marca-violeta"
                />
                <span>
                  <span className="block font-semibold text-tinta">{opcion.titulo}</span>
                  <span className="block text-sm text-tinta/60">{opcion.nota}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {datos.envio_tipo === 'nacional' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="envio_direccion" className={etiqueta}>
                Dirección
              </label>
              <input
                id="envio_direccion"
                name="direccion"
                autoComplete="street-address"
                className={`${campo} mt-1`}
                value={datos.envio_direccion ?? ''}
                onChange={(e) => cambiar('envio_direccion', e.target.value)}
                aria-invalid={errores.envio_direccion ? true : undefined}
                aria-describedby={errores.envio_direccion ? 'error-envio_direccion' : undefined}
              />
              {errores.envio_direccion && (
                <p id="error-envio_direccion" className="mt-1 text-sm text-rosa">
                  {errores.envio_direccion}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="envio_ciudad" className={etiqueta}>
                Ciudad
              </label>
              <input
                id="envio_ciudad"
                name="ciudad"
                autoComplete="address-level2"
                className={`${campo} mt-1`}
                value={datos.envio_ciudad ?? ''}
                onChange={(e) => cambiar('envio_ciudad', e.target.value)}
                aria-invalid={errores.envio_ciudad ? true : undefined}
                aria-describedby={errores.envio_ciudad ? 'error-envio_ciudad' : undefined}
              />
              {errores.envio_ciudad && (
                <p id="error-envio_ciudad" className="mt-1 text-sm text-rosa">
                  {errores.envio_ciudad}
                </p>
              )}
            </div>
          </div>
        )}

        {errorEnvio && (
          <p role="alert" className="rounded-2xl border border-rosa/30 bg-rosa/8 px-4 py-3 text-sm text-rosa">
            {errorEnvio}
          </p>
        )}
      </div>

      <aside className="h-fit rounded-3xl border border-tinta/10 bg-white p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-tinta">Tu pedido</h2>

        <ul className="mt-4 space-y-2 text-sm">
          {state.lines.map((linea) => (
            <li key={`${linea.product_id}:${linea.variant_id ?? ''}`} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-tinta/70">
                {linea.cantidad} × {linea.nombre}
              </span>
              <span className="whitespace-nowrap font-semibold text-tinta">
                {formatBob(linea.precio_bob_cents * linea.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-tinta/10 pt-4">
          <span className="text-sm text-tinta/60">Subtotal estimado</span>
          <span className="whitespace-nowrap font-display text-2xl text-marca-violeta">{formatBob(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-tinta/50">
          El envío y el total final los recalcula el servidor al confirmar.
        </p>

        <button
          type="submit"
          disabled={enviando}
          className="mt-5 w-full rounded-full bg-[image:var(--gradiente-marca)] px-6 py-3.5 font-display text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {enviando ? 'Registrando tu pedido…' : 'Confirmar pedido'}
        </button>
        <p className="mt-2 text-center text-xs text-tinta/50">El pago se coordina después de confirmar.</p>
      </aside>
    </form>
  )
}

export default CheckoutForm
