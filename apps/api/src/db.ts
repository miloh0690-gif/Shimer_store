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