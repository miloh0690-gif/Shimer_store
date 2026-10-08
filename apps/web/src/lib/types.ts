/**
 * Espejo de los tipos que devuelve la API (`apps/api/src/modules/*`). Si la API
 * cambia una forma, este archivo cambia con ella: son los mismos campos, no una
 * traducción.
 */

export type ProductVariantView = {
  id: string;
  nombre: string;
  valor: string;
  stock: number;
  sku: string | null;
};

export type ReferenciaView = {
  slug: string;
  nombre: string;
};

export type ProductView = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  precio_bob_cents: number;
  precio_oferta_bob_cents: number | null;
  precio_efectivo_bob_cents: number;
  en_oferta: boolean;
  stock: number;
  sku: string | null;
  color: string | null;
  imagenes: string[];
  destacado: boolean;
  demo: boolean;
  categoria: ReferenciaView | null;
  marca: ReferenciaView | null;
  variantes: ProductVariantView[];
};

export type CategoryView = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
};

export type BrandView = {
  id: string;
  slug: string;
  nombre: string;
  logo_url: string | null;
};

export type ProductOrden = 'destacado' | 'recientes' | 'precio_asc' | 'precio_desc' | 'nombre'

export const PRODUCT_ORDENES: ProductOrden[] = [
  'destacado',
  'recientes',
  'precio_asc',
  'precio_desc',
  'nombre',
]

export type ProductListResponse = {
  items: ProductView[];
  total: number;
  pagina: number;
  por_pagina: number;
};

export type OrderItemView = {
  id: string;
  nombre_snapshot: string;
  cantidad: number;
  precio_unitario_bob_cents: number;
  subtotal_bob_cents: number;
};

export type OrderView = {
  id: string;
  folio: string;
  estado: string;
  total_bob_cents: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  envio_tipo: string;
  envio_direccion: string | null;
  envio_ciudad: string | null;
  created_at: string;
  items: OrderItemView[];
};

export type CreateOrderResponse = {
  id: string;
  folio: string;
  estado: string;
  total_bob_cents: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
};