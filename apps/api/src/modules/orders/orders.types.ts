export type EnvioTipo = 'cochabamba' | 'nacional'

export type LineRequest = {
  product_id: string
  variant_id?: string
  cantidad: number
}

export type CreateOrderInput = {
  idempotencyKey: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  envio_tipo: EnvioTipo
  envio_direccion?: string
  envio_ciudad?: string
  items: LineRequest[]
}

/**
 * Línea ya resuelta por el servidor: el precio y el nombre salen del catálogo,
 * nunca del cliente. `variant_id` queda en `null` cuando la línea no pidió variante.
 */
export type ResolvedLine = {
  product_id: string
  variant_id: string | null
  nombre_snapshot: string
  precio_unitario_bob_cents: number
  cantidad: number
  subtotal_bob_cents: number
}

export type OrderItemView = {
  id: string
  nombre_snapshot: string
  cantidad: number
  precio_unitario_bob_cents: number
  subtotal_bob_cents: number
}

export type OrderWithItems = {
  id: string
  folio: string
  estado: string
  total_bob_cents: number
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  envio_tipo: string
  envio_direccion: string | null
  envio_ciudad: string | null
  created_at: string
  items: OrderItemView[]
}

/** Fila de `orders` tal como la devuelve PostgREST. */
export type OrderRow = {
  id: string
  folio: string
  idempotency_key: string
  estado: string
  total_bob_cents: number
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  envio_tipo: string
  envio_direccion: string | null
  envio_ciudad: string | null
  created_at: string
}

/** Fila de `order_items` tal como la devuelve PostgREST. */
export type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  nombre_snapshot: string
  precio_unitario_bob_cents: number
  cantidad: number
  subtotal_bob_cents: number
}

export type CreateOrderRecord = {
  folio: string
  idempotency_key: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  envio_tipo: string
  envio_direccion: string | null
  envio_ciudad: string | null
  total_bob_cents: number
  items: ResolvedLine[]
}

export type OrdersDataSource = {
  findByIdempotencyKey(key: string): Promise<OrderWithItems | null>
  nextFolio(): Promise<string>
  createOrder(input: CreateOrderRecord): Promise<OrderWithItems>
  listOrdersByEmail(email: string): Promise<OrderWithItems[]>
  /** Todas las órdenes, para el panel de administración. */
  listAll(): Promise<OrderWithItems[]>
  updateEstado(id: string, estado: string): Promise<OrderWithItems>
}

export const ESTADOS: string[] = [
  'nuevo',
  'confirmado',
  'preparando',
  'enviado',
  'entregado',
  'cancelado',
]