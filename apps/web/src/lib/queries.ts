import 'server-only'
import { apiGet, qs } from './api'
import type {
  BrandView,
  CategoryView,
  ProductListResponse,
  ProductOrden,
  ProductView,
} from './types'

/** Orden estable por id: las consultas paralelas pueden llegar en cualquier orden. */
export const ordenPorId = (a: { id: string }, b: { id: string }): number => a.id.localeCompare(b.id)

type GetProductosOpts = {
  orden?: ProductOrden;
  limite?: number;
  pagina?: number;
  categoria?: string;
  marca?: string;
  color?: string;
  precio_min?: number;
  precio_max?: number;
  en_oferta?: boolean;
  q?: string;
};

/**
 * Si la API no responde devolvemos una lista vacía en vez de propagar el error:
 * el home y el catálogo tienen que cargar aunque el backend esté caído o
 * todavía desplegándose.
 */
export async function getProductos(opts: GetProductosOpts = {}): Promise<{
  items: ProductView[];
  total: number;
}> {
  const query = qs({
    orden: opts.orden ?? 'destacado',
    pagina: opts.pagina ?? 1,
    por_pagina: opts.limite ?? 24,
    categoria: opts.categoria,
    marca: opts.marca,
    color: opts.color,
    precio_min: opts.precio_min,
    precio_max: opts.precio_max,
    en_oferta: opts.en_oferta === undefined ? undefined : String(opts.en_oferta),
    q: opts.q,
  });
  try {
    const data = await apiGet<ProductListResponse>(`/api/products${query}`);
    return { items: data.items ?? [], total: data.total ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getProductoPorSlug(slug: string): Promise<ProductView | null> {
  try {
    return await apiGet<ProductView>(`/api/products/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getCategorias(): Promise<CategoryView[]> {
  try {
    return await apiGet<CategoryView[]>('/api/categories');
  } catch {
    return [];
  }
}

export async function getMarcas(): Promise<BrandView[]> {
  try {
    return await apiGet<BrandView[]>('/api/brands');
  } catch {
    return [];
  }
}

export const getProductosDestacados = (limite = 12): Promise<{ items: ProductView[]; total: number }> =>
  getProductos({ orden: 'destacado', limite });

export const getNovedades = (limite = 12): Promise<{ items: ProductView[]; total: number }> =>
  getProductos({ orden: 'recientes', limite });

export const getOfertas = (limite = 12): Promise<{ items: ProductView[]; total: number }> =>
  getProductos({ orden: 'precio_asc', en_oferta: true, limite });

/** Todo lo que necesita la home, en una sola llamada de render. */
export async function getHomeData(): Promise<{
  categorias: CategoryView[];
  marcas: BrandView[];
  novedades: ProductView[];
  masVendidos: ProductView[];
  ofertas: ProductView[];
}> {
  const [categorias, marcas, novedades, destacados, ofertas] = await Promise.all([
    getCategorias(),
    getMarcas(),
    getNovedades(8),
    getProductosDestacados(8),
    getOfertas(8),
  ]);
  return {
    categorias,
    marcas,
novedades: novedades.items,
    masVendidos: destacados.items,
    ofertas: ofertas.items,
  };
}