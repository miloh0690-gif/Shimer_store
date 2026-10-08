const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const CLAVE_IDEMPOTENCIA = 'shimer.checkout.idempotencia.v1'

/**
 * Devuelve la `idempotency-key` del checkout, creandola si todavia no existe.
 *
 * Va en `sessionStorage` y no en el estado del componente a proposito: si el
 * POST llega a la API pero la respuesta se pierde (se cierra la pestana, se
 * duerme la notebook, falla el `router.push`), al volver a /checkout tiene que
 * seguir mandando la MISMA key. Con la key en `useState` cada montaje generaba
 * una nueva y el mismo carrito terminaba en dos pedidos.
 *
 * Se borra recien cuando la API confirma que creo el pedido.
 */
export function leerIdempotencia(storage: Storage): string {
  let guardada: string | null = null
  try {
    guardada = storage.getItem(CLAVE_IDEMPOTENCIA)
  } catch {
    guardada = null
  }

  if (guardada && UUID.test(guardada)) return guardada

  const nueva = crypto.randomUUID()
  try {
    storage.setItem(CLAVE_IDEMPOTENCIA, nueva)
  } catch {
    // Sin storage (modo privado, cuota llena): el envio funciona igual, solo que
    // un recarga generaria otra key.
  }
  return nueva
}

/** Se llama solo cuando la API responde que el pedido quedo registrado. */
export function borrarIdempotencia(storage: Storage): void {
  try {
    storage.removeItem(CLAVE_IDEMPOTENCIA)
  } catch {
    // nada que hacer: si no se pudo guardar, tampoco se puede borrar
  }
}
