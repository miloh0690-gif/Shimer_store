export type ProductRow = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  brand_id: string | null
  category_id: string | null
  precio_bob_cents: number
  precio_oferta_bob_cents: number | null
  stock: number
  sku: string | null
  color: string | null
  imagenes: string[]
  destacado: boolean
  demo: boolean
  activo: boolean
  created_at: string
}

export type ProductVariantRow = {
  id: string
  product_id: string
  nombre: string
  valor: string
  stock: number
  sku: string | null
  orden: number
}

export type CategoryRow = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  orden: number
}

export type BrandRow = {
  id: string
  slug: string
  nombre: string
  logo_url: string | null
  created_at: string
}

export type ProductVariantView = {
  id: string
  nombre: string
  valor: string
  stock: number
  sku: string | null
  /**
   * El orden con el que el dueño curó la lista de colores. Sin este campo la
   * API los entregaba ordenados por UUID, que es ruido para el cliente.
   */
  orden: number
}

export type ProductView = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  precio_bob_cents: number
  precio_oferta_bob_cents: number | null
  precio_efectivo_bob_cents: number
  en_oferta: boolean
  stock: number
  sku: string | null
  color: string | null
  imagenes: string[]
  destacado: boolean
  demo: boolean
  categoria: { slug: string; nombre: string } | null
  marca: { slug: string; nombre: string } | null
  variantes: ProductVariantView[]
}

export type ProductOrder = 'destacado' | 'recientes' | 'precio_asc' | 'precio_desc' | 'nombre'

export const PRODUCT_ORDENES: ProductOrder[] = [
  'destacado',
  'recientes',
  'precio_asc',
  'precio_desc',
  'nombre',
]

export type ProductQuery = {
  categoria?: string
  marca?: string
  color?: string
  /** Búsqueda por texto sobre nombre y descripción. */
  q?: string
  precio_min?: number
  precio_max?: number
  en_oferta?: boolean
  orden: ProductOrder
  pagina: number
  por_pagina: number
}

export type ProductFilters = {
  activo: true
  /** Listas y no valores sueltos: la tienda permite marcar varias categorías. */
  categoria_slugs?: string[]
  marca_slugs?: string[]
  colores?: string[]
  q?: string
  precio_min_cents?: number
  precio_max_cents?: number
  en_oferta?: boolean
  orden: ProductOrder
  desde: number
  limite: number
}

import type { PatchProducto } from '../admin/admin.schemas.js';

export type CatalogDataSource = {
  products(f: ProductFilters): Promise<ProductRow[]>
  countProducts(f: ProductFilters): Promise<number>
  productBySlug(slug: string): Promise<ProductRow | null>
  /**
   * Trae varios productos por id en una sola consulta. Lo usa el módulo de
   * pedidos para resolver todas las líneas de un carrito de una vez.
   */
  productsPorIds(ids: string[]): Promise<ProductRow[]>
  /** Aplica un parche administrativo a un producto. Devuelve null si no existe. */
  updateProduct(id: string, parches: PatchProducto): Promise<ProductRow | null>
  variantsFor(ids: string[]): Promise<ProductVariantRow[]>
  categories(): Promise<CategoryRow[]>
  brands(): Promise<BrandRow[]>
}