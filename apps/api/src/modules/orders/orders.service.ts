import { z } from 'zod'
import { notFound, stockInsuficiente, validacion } from '../../errors.js'
import { precioEfectivo } from '../catalog/catalog.service.js'
import type { CatalogDataSource, ProductRow, ProductVariantRow } from '../catalog/catalog.types.js'
import type {
  CreateOrderInput,
  OrderWithItems,
  OrdersDataSource,
  ResolvedLine,
} from './orders.types.js'

const MAX_LINEAS = 50
const MAX_CANTIDAD = 99

const lineaSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1).optional(),
  cantidad: z.number().int().min(1).max(MAX_CANTIDAD),
})

const itemsSchema = z
  .array(lineaSchema)
  .min(1, 'El pedido debe tener al menos un producto')
  .max(MAX_LINEAS, `El pedido no puede tener más de ${MAX_LINEAS} líneas`)

function clave(productId: string, variantId: string | undefined): string {
  return `${productId}::${variantId ?? ''}`
}

/**
 * Resuelve las líneas del carrito contra el catálogo: precio y nombre salen de
 * la base, nunca de lo que mande el cliente. Devuelve las líneas ya consolidadas
 * por producto y variante.
 */
export async function resolveLines(
  catalog: CatalogDataSource,
  items: CreateOrderInput['items'],
): Promise<ResolvedLine[]> {
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) {
    throw validacion('Items inválidos', parsed.error.issues);
  }

  const consolidadas = new Map<string, { product_id: string; variant_id?: string; cantidad: number }>();
  for (const linea of parsed.data) {
    const k = clave(linea.product_id, linea.variant_id);
    const previa = consolidadas.get(k);
    if (previa) {
      previa.cantidad += linea.cantidad;
    } else {
      consolidadas.set(k, { product_id: linea.product_id, variant_id: linea.variant_id, cantidad: linea.cantidad });
    }
  }

  const entradas = [...consolidadas.values()];
  const ids = [...new Set(entradas.map((e) => e.product_id))];
  const [filas, variantes] = await Promise.all([
    catalog.productsPorIds(ids),
    catalog.variantsFor(ids),
  ]);
  const porId = indexar(filas);
  const variantesPorProducto = agruparVariantes(variantes);

  const resueltas: ResolvedLine[] = [];
  for (const entrada of entradas) {
    const producto = porId.get(entrada.product_id);
    if (!producto) throw notFound();

    const cantidad = entrada.cantidad;
    const precio = precioEfectivo(producto);

    let variante: ProductVariantRow | undefined;
    if (entrada.variant_id !== undefined) {
      variante = variantesPorProducto.get(entrada.product_id)?.find((v) => v.id === entrada.variant_id);
      if (!variante) {
        throw validacion('La variante no pertenece al producto', [
          { producto: producto.nombre, variante: entrada.variant_id },
        ]);
      }
    }

    const stock = variante ? variante.stock : producto.stock;
    if (cantidad > stock) throw stockInsuficiente(producto.nombre);

    resueltas.push({
      product_id: producto.id,
      variant_id: variante ? variante.id : null,
      nombre_snapshot: producto.nombre,
      precio_unitario_bob_cents: precio,
      cantidad,
      subtotal_bob_cents: precio * cantidad,
    });
  }
  return resueltas;
}

export function computeTotal(lineas: Array<{ subtotal_bob_cents: number }>): number {
  return lineas.reduce((total, linea) => total + linea.subtotal_bob_cents, 0);
}

function indexar(filas: ProductRow[]): Map<string, ProductRow> {
  return new Map(filas.map((f) => [f.id, f]));
}

function agruparVariantes(variantes: ProductVariantRow[]): Map<string, ProductVariantRow[]> {
  const mapa = new Map<string, ProductVariantRow[]>();
  for (const v of variantes) {
    const lista = mapa.get(v.product_id) ?? [];
    lista.push(v);
    mapa.set(v.product_id, lista);
  }
  return mapa;
}

function esViolacionUnica(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23505';
}

export type CreateOrderResult = { order: OrderWithItems; creado: boolean };

/**
 * Crea el pedido. Es idempotente por `idempotencyKey`: si ya existe una orden con
 * esa clave se devuelve tal cual (`creado: false`) y no se inserta otra vez.
 */
export async function createOrder(
  catalog: CatalogDataSource,
  orders: OrdersDataSource,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const previa = await orders.findByIdempotencyKey(input.idempotencyKey);
  if (previa) return { order: previa, creado: false };

  const lineas = await resolveLines(catalog, input.items);
  const total = computeTotal(lineas);

  const folio = await orders.nextFolio();

  try {
    const creada = await orders.createOrder({
      folio,
      idempotency_key: input.idempotencyKey,
      cliente_nombre: input.cliente_nombre,
      cliente_email: input.cliente_email,
      cliente_telefono: input.cliente_telefono,
      envio_tipo: input.envio_tipo,
      envio_direccion: input.envio_direccion ?? null,
      envio_ciudad: input.envio_ciudad ?? null,
      total_bob_cents: total,
      items: lineas,
    });
    return { order: creada, creado: true };
  } catch (e) {
    // Dos requests con la misma clave llegaron a insertar a la vez: gana el UNIQUE.
    if (!esViolacionUnica(e)) throw e;
    const ganadora = await orders.findByIdempotencyKey(input.idempotencyKey);
    if (!ganadora) throw e;
    return { order: ganadora, creado: false };
  }
}