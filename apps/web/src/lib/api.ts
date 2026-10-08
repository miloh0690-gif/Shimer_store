import type { ApiErrorBody } from './types'

const BASE_POR_DEFECTO = 'http://localhost:4000'

/** Base de la API. En producción llega por `NEXT_PUBLIC_API_URL`. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? BASE_POR_DEFECTO

export const apiUrl = (path: string): string => `${API_BASE}${path}`

/**
 * Serializa parámetros de consulta omitiendo los vacíos, para que la URL de la
 * página no arrastre `?categoria=&marca=` al navegar.
 */
export function qs(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === null || valor === undefined || valor === '') continue;
    sp.set(clave, String(valor));
  }
  const s = sp.toString();
  return s === '' ? '' : `?${s}`;
}

/** Error de la API con su código y su detalle, ya normalizados. */
export class FetchApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'FetchApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiGetOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * GET a la API con revalidación de 60 s. La API siempre responde
 * `{ error: { code, message, details } }`, así que un error no-ok se traduce a
 * `FetchApiError` en lugar de propagar el Response crudo.
 */
export async function apiGet<T>(path: string, init?: ApiGetOptions): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    next: { revalidate: 60, ...init?.next },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new FetchApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? 'Error inesperado',
      body?.error?.details ?? [],
    );
  }

  return res.json() as Promise<T>;
}