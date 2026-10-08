/** Un precio en la tienda, tal como lo manda la API. */
export type PrecioLike = {
  precio_bob_cents: number;
  precio_oferta_bob_cents: number | null;
};

/**
 * `Bs. 549.00`. Mismo formato que la API: separador de miles coma y punto
 * decimal, como usa la librería.
 */
export function formatBob(cents: number): string {
  return `Bs. ${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** El precio que de verdad se cobra: la oferta si existe, si no el de lista. */
export function precioEfectivo(p: PrecioLike): number {
  return p.precio_oferta_bob_cents ?? p.precio_bob_cents;
}