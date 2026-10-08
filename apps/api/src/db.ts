import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BrandRow,
  CatalogDataSource,
  CategoryRow,
  ProductFilters,
  ProductOrder,
  ProductRow,
  ProductVariantRow,
} from './modules/catalog/catalog.types.js';
import type {
  CreateOrderRecord,
  OrderItemRow,
  OrderRow,
  OrderWithItems,
  OrdersDataSource,
} from './modules/orders/orders.types.js';
import type { PatchProducto } from './modules/admin/admin.schemas.js';
import type { Perfil, ProfilesDataSource } from './auth.js';

const SELECT_CATEGORIA = 'categories(slug,nombre)';
const SELECT_MARCA = 'brands(slug,nombre)';
const SELECT_BASE = `*, ${SELECT_CATEGORIA}, ${SELECT_MARCA}`;

/**
 * PostgREST solo restringe por una columna embebida si ese embed es un inner join:
 * con el embed normal el `.eq()` no filtra nada y la tienda mostraría productos de
 * todas las categorías. Por eso el `!inner` se aplica solo cuando se filtra por esa
 * relación, para no descartar productos que no tienen categoría o marca.
 */
function selectPara(f: ProductFilters): string {
  const categorias = f.categoria_slug === undefined ? SELECT_CATEGORIA : 'categories!inner(slug,nombre)';
  const marcas = f.marca_slug === undefined ? SELECT_MARCA : 'brands!inner(slug,nombre)';
  if (f.categoria_slug === undefined && f.marca_slug === undefined) return SELECT_BASE;
  return `*, ${categorias}, ${marcas}`;
}

// `head: true` no transfiere filas, así que pedir los embeds en el conteo no cuesta ancho de banda.
const COUNT_SELECT = 'id, categories(slug), brands(slug)';

function countSelectPara(f: ProductFilters): string {
  const categorias =
    f.categoria_slug === undefined ? 'categories(slug)' : 'categories!inner(slug)';
  const marcas = f.marca_slug === undefined ? 'brands(slug)' : 'brands!inner(slug)';
  return `id, ${categorias}, ${marcas}`;
}

const ORDENES: Record<ProductOrder, Array<[string, boolean]>> = {
  destacado: [
    ['destacado', false],
    ['created_at', false],
  ],
  recientes: [['created_at', false]],
  precio_asc: [['precio_bob_cents', true]],
  precio_desc: [['precio_bob_cents', false]],
  nombre: [['nombre', true]],
};

function unwrap<T>(data: unknown, error: { message: string } | null, contexto: string): T {
  if (error) throw new Error(`${contexto}: ${error.message}`);
  if (data === null || data === undefined) throw new Error(`${contexto}: respuesta nula`);
  return data as T;
}

export function supabaseCatalogDataSource(client: SupabaseClient): CatalogDataSource {
  return {
    async products(f: ProductFilters): Promise<ProductRow[]> {
      let q = client.from('products').select(selectPara(f)).eq('activo', f.activo);
      if (f.categoria_slug !== undefined) q = q.eq('categories.slug', f.categoria_slug);
      if (f.marca_slug !== undefined) q = q.eq('brands.slug', f.marca_slug);
      if (f.color !== undefined) q = q.eq('color', f.color);
      if (f.precio_min_cents !== undefined) q = q.gte('precio_bob_cents', f.precio_min_cents);
      if (f.precio_max_cents !== undefined) q = q.lte('precio_bob_cents', f.precio_max_cents);
      if (f.en_oferta === true) q = q.not('precio_oferta_bob_cents', 'is', null);
      if (f.en_oferta === false) q = q.is('precio_oferta_bob_cents', null);
      for (const [columna, ascendente] of ORDENES[f.orden]) {
        q = q.order(columna, { ascending: ascendente });
      }
      q = q.range(f.desde, f.desde + f.limite - 1);
      const res = await q;
      return unwrap<ProductRow[]>(res.data, res.error, 'products');
    },

    async countProducts(f: ProductFilters): Promise<number> {
      let q = client
        .from('products')
        .select(countSelectPara(f), { count: 'exact', head: true })
        .eq('activo', f.activo);
      if (f.categoria_slug !== undefined) q = q.eq('categories.slug', f.categoria_slug);
      if (f.marca_slug !== undefined) q = q.eq('brands.slug', f.marca_slug);
      if (f.color !== undefined) q = q.eq('color', f.color);
      if (f.precio_min_cents !== undefined) q = q.gte('precio_bob_cents', f.precio_min_cents);
      if (f.precio_max_cents !== undefined) q = q.lte('precio_bob_cents', f.precio_max_cents);
      if (f.en_oferta === true) q = q.not('precio_oferta_bob_cents', 'is', null);
      if (f.en_oferta === false) q = q.is('precio_oferta_bob_cents', null);
      const res = await q;
      if (res.error) throw new Error(`countProducts: ${res.error.message}`);
      return res.count ?? 0;
    },

    async productBySlug(slug: string): Promise<ProductRow | null> {
      const res = await client.from('products').select(SELECT_BASE).eq('slug', slug).maybeSingle();
      if (res.error) throw new Error(`productBySlug: ${res.error.message}`);
      return res.data as ProductRow | null;
    },

    async updateProduct(id: string, parches: PatchProducto): Promise<ProductRow | null> {
      const res = await client
        .from('products')
        .update({ ...parches, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (res.error) throw new Error(`updateProduct: ${res.error.message}`);
      return res.data as ProductRow | null;
    },

    async productsPorIds(ids: string[]): Promise<ProductRow[]> {
      if (ids.length === 0) return [];
      const res = await client.from('products').select(SELECT_BASE).in('id', ids);
      return unwrap<ProductRow[]>(res.data, res.error, 'productsPorIds');
    },

    async variantsFor(ids: string[]): Promise<ProductVariantRow[]> {
      if (ids.length === 0) return [];
      const res = await client
        .from('product_variants')
        .select('*')
        .in('product_id', ids)
        .order('orden', { ascending: true });
      return unwrap<ProductVariantRow[]>(res.data, res.error, 'variantsFor');
    },

    async categories(): Promise<CategoryRow[]> {
      const res = await client.from('categories').select('*').order('orden', { ascending: true });
      return unwrap<CategoryRow[]>(res.data, res.error, 'categories');
    },

    async brands(): Promise<BrandRow[]> {
      const res = await client.from('brands').select('*').order('nombre', { ascending: true });
      return unwrap<BrandRow[]>(res.data, res.error, 'brands');
    },
  };
}
function toOrderWithItems(order: OrderRow, items: OrderItemRow[]): OrderWithItems {
  return {
    id: order.id,
    folio: order.folio,
    estado: order.estado,
    total_bob_cents: order.total_bob_cents,
    cliente_nombre: order.cliente_nombre,
    cliente_email: order.cliente_email,
    cliente_telefono: order.cliente_telefono,
    envio_tipo: order.envio_tipo,
    envio_direccion: order.envio_direccion,
    envio_ciudad: order.envio_ciudad,
    created_at: order.created_at,
    items: items.map((i) => ({
      id: i.id,
      nombre_snapshot: i.nombre_snapshot,
      cantidad: i.cantidad,
      precio_unitario_bob_cents: i.precio_unitario_bob_cents,
      subtotal_bob_cents: i.subtotal_bob_cents,
    })),
  };
}

export function supabaseOrdersDataSource(client: SupabaseClient): OrdersDataSource {
  async function itemsDe(orderId: string): Promise<OrderItemRow[]> {
    const res = await client
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('id', { ascending: true });
    return unwrap<OrderItemRow[]>(res.data, res.error, 'order_items');
  }

  async function conItems(row: OrderRow): Promise<OrderWithItems> {
    return toOrderWithItems(row, await itemsDe(row.id));
  }

  return {
    async findByIdempotencyKey(key: string): Promise<OrderWithItems | null> {
      const res = await client
        .from('orders')
        .select('*')
        .eq('idempotency_key', key)
        .maybeSingle();
      if (res.error) throw new Error(`findByIdempotencyKey: ${res.error.message}`);
      if (!res.data) return null;
      return conItems(res.data as OrderRow);
    },

    async nextFolio(): Promise<string> {
      const res = await client.rpc('next_folio');
      if (res.error) throw new Error(`next_folio: ${res.error.message}`);
      return String(res.data);
    },

    async createOrder(input: CreateOrderRecord): Promise<OrderWithItems> {
      const insOrden = await client
        .from('orders')
        .insert({
          folio: input.folio,
          idempotency_key: input.idempotency_key,
          cliente_nombre: input.cliente_nombre,
          cliente_email: input.cliente_email,
          cliente_telefono: input.cliente_telefono,
          envio_tipo: input.envio_tipo,
          envio_direccion: input.envio_direccion,
          envio_ciudad: input.envio_ciudad,
          total_bob_cents: input.total_bob_cents,
        })
        .select('*')
        .single();
      if (insOrden.error) {
        // Se propaga el error crudo: createOrder necesita ver code === '23505'.
        throw Object.assign(new Error(`orders: ${insOrden.error.message}`), {
          code: insOrden.error.code,
        });
      }
      const orden = insOrden.data as OrderRow;

      const insItems = await client.from('order_items').insert(
        input.items.map((linea) => ({
          order_id: orden.id,
          product_id: linea.product_id,
          variant_id: linea.variant_id,
          nombre_snapshot: linea.nombre_snapshot,
          precio_unitario_bob_cents: linea.precio_unitario_bob_cents,
          cantidad: linea.cantidad,
          subtotal_bob_cents: linea.subtotal_bob_cents,
        })),
      );
      if (insItems.error) {
        // Orden sin renglones es basura: se borra antes de propagar.
        await client.from('orders').delete().eq('id', orden.id);
        throw new Error(`order_items: ${insItems.error.message}`);
      }

      return conItems(orden);
    },

    async listOrdersByEmail(email: string): Promise<OrderWithItems[]> {
      const res = await client
        .from('orders')
        .select('*')
        .eq('cliente_email', email)
        .order('created_at', { ascending: false });
      const filas = unwrap<OrderRow[]>(res.data, res.error, 'listOrdersByEmail');
      const items = await Promise.all(filas.map((f) => itemsDe(f.id)));
      return filas.map((f, i) => toOrderWithItems(f, items[i] ?? []));
    },

    async listAll(): Promise<OrderWithItems[]> {
      const res = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      const filas = unwrap<OrderRow[]>(res.data, res.error, 'listAll');
      const items = await Promise.all(filas.map((f) => itemsDe(f.id)));
      return filas.map((f, i) => toOrderWithItems(f, items[i] ?? []));
    },

    async updateEstado(id: string, estado: string): Promise<OrderWithItems> {
      const res = await client
        .from('orders')
        .update({ estado })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (res.error) throw new Error(`updateEstado: ${res.error.message}`);
      if (!res.data) throw new Error(`updateEstado: la orden ${id} no existe`);
      return conItems(res.data as OrderRow);
    },
  };
}


export function supabaseProfilesDataSource(client: SupabaseClient): ProfilesDataSource {
  return {
    async findById(id: string): Promise<Perfil | null> {
      const res = await client
        .from('profiles')
        .select('id,email,nombre,rol')
        .eq('id', id)
        .maybeSingle();
      if (res.error) throw new Error(`findById: ${res.error.message}`);
      return res.data as Perfil | null;
    },

    /**
     * Crea el perfil como admin solo si no existe. Si ya existe se deja como
     * está: promover por email no debe degradar a nadie ni quitarle el rol.
     */
    async ensureAdmin(id: string, email: string, nombre: string | null): Promise<void> {
      const existente = await client
        .from('profiles')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      if (existente.error) throw new Error(`ensureAdmin: ${existente.error.message}`);
      if (existente.data) return;
      const ins = await client.from('profiles').insert({ id, email, nombre, rol: 'admin' });
      if (ins.error) throw new Error(`ensureAdmin: ${ins.error.message}`);
    },
  };
}
