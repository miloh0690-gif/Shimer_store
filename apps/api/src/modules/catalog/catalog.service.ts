import { bobToCents } from '../../money.js';
import type {
  BrandRow,
  CatalogDataSource,
  CategoryRow,
  ProductFilters,
  ProductQuery,
  ProductRow,
  ProductVariantRow,
  ProductVariantView,
  ProductView,
} from './catalog.types.js';

export const PRECIO_MIN_BS_POR_DEFECTO = 0;
export const POR_PAGINA_POR_DEFECTO = 24;

type PrecioLike = { precio_bob_cents: number; precio_oferta_bob_cents: number | null };

export function precioEfectivo(p: PrecioLike): number {
  return p.precio_oferta_bob_cents !== null ? p.precio_oferta_bob_cents : p.precio_bob_cents;
}

function buildFilters(q: ProductQuery): ProductFilters {
  const f: ProductFilters = {
    activo: true,
    orden: q.orden,
    desde: (q.pagina - 1) * q.por_pagina,
    limite: q.por_pagina,
  };
  if (q.categoria !== undefined) f.categoria_slug = q.categoria;
  if (q.marca !== undefined) f.marca_slug = q.marca;
  if (q.color !== undefined) f.color = q.color;
  if (q.precio_min !== undefined) f.precio_min_cents = bobToCents(q.precio_min);
  if (q.precio_max !== undefined) f.precio_max_cents = bobToCents(q.precio_max);
  if (q.en_oferta !== undefined) f.en_oferta = q.en_oferta;
  return f;
}

function variantesPorProducto(rows: ProductVariantRow[]): Map<string, ProductVariantView[]> {
  const map = new Map<string, ProductVariantView[]>();
  for (const v of rows) {
    const lista = map.get(v.product_id) ?? [];
    lista.push({ id: v.id, nombre: v.nombre, valor: v.valor, stock: v.stock, sku: v.sku });
    map.set(v.product_id, lista);
  }
  for (const lista of map.values()) lista.sort((a, b) => a.id.localeCompare(b.id));
  return map;
}

type Ref = { slug: string; nombre: string };

function indexar(rows: Array<{ id: string; slug: string; nombre: string }>): Map<string, Ref> {
  return new Map(rows.map((r) => [r.id, { slug: r.slug, nombre: r.nombre }]));
}

async function referencias(
  src: CatalogDataSource,
): Promise<{ categorias: Map<string, Ref>; marcas: Map<string, Ref> }> {
  const [categories, brands] = await Promise.all([src.categories(), src.brands()]);
  return { categorias: indexar(categories), marcas: indexar(brands) };
}

export function mapProduct(
  row: ProductRow,
  categorias: Map<string, Ref>,
  marcas: Map<string, Ref>,
  variantes: ProductVariantView[],
): ProductView {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio_bob_cents: row.precio_bob_cents,
    precio_oferta_bob_cents: row.precio_oferta_bob_cents,
    precio_efectivo_bob_cents: precioEfectivo(row),
    en_oferta: row.precio_oferta_bob_cents !== null,
    stock: row.stock,
    sku: row.sku,
    color: row.color,
    imagenes: row.imagenes,
    destacado: row.destacado,
    demo: row.demo,
    categoria: row.category_id === null ? null : (categorias.get(row.category_id) ?? null),
    marca: row.brand_id === null ? null : (marcas.get(row.brand_id) ?? null),
    variantes,
  };
}

async function montarVistas(
  src: CatalogDataSource,
  filas: ProductRow[],
): Promise<ProductView[]> {
  const ids = filas.map((f) => f.id);
  const [{ categorias, marcas }, variantes] = await Promise.all([
    referencias(src),
    src.variantsFor(ids),
  ]);
  const porProducto = variantesPorProducto(variantes);
  return filas.map((f) =>
    mapProduct(f, categorias, marcas, porProducto.get(f.id) ?? []),
  );
}

export async function listProducts(
  src: CatalogDataSource,
  q: ProductQuery,
): Promise<{ items: ProductView[]; total: number; pagina: number; por_pagina: number }> {
  const filtros = buildFilters(q);
  const [filas, total] = await Promise.all([src.products(filtros), src.countProducts(filtros)]);
  const activas = filas.filter((f) => f.activo);
  return {
    items: await montarVistas(src, activas),
    total,
    pagina: q.pagina,
    por_pagina: q.por_pagina,
  };
}

export async function getProductBySlug(
  src: CatalogDataSource,
  slug: string,
): Promise<ProductView | null> {
  const fila = await src.productBySlug(slug);
  if (fila === null || !fila.activo) return null;
  const [vista] = await montarVistas(src, [fila]);
  return vista ?? null;
}

export function toCategoryRef(c: CategoryRow): Ref {
  return { slug: c.slug, nombre: c.nombre };
}

export function toBrandRef(b: BrandRow): Ref {
  return { slug: b.slug, nombre: b.nombre };
}