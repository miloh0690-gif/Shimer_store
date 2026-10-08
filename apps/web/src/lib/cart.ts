/** Una línea del carrito tal como se guarda en el navegador. */
export type CartLine = {
  product_id: string;
  variant_id: string | null;
  cantidad: number;
  nombre: string;
  precio_bob_cents: number;
  imagen: string | null;
};

export type CartState = {
  lines: CartLine[];
};

export type CartAction =
  | { type: 'agregar'; line: CartLine }
  | { type: 'set-cantidad'; product_id: string; variant_id: string | null; cantidad: number }
  | { type: 'quitar'; product_id: string; variant_id: string | null }
  | { type: 'vaciar' }
  | { type: 'hidratar'; state: CartState };

export const CART_KEY = 'shimer.carrito.v1';

/** Misma línea que producto + variante. Dos variantes son dos renglones. */
function esMismaLinea(linea: CartLine, product_id: string, variant_id: string | null): boolean {
  return linea.product_id === product_id && linea.variant_id === variant_id;
}

/**
 * Reducer puro del carrito: siempre devuelve un objeto nuevo y nunca deja una
 * línea con cantidad cero o negativa — esas se borran.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'agregar': {
      const existe = state.lines.find((l) =>
        esMismaLinea(l, action.line.product_id, action.line.variant_id),
      );
      if (!existe) return { lines: [...state.lines, { ...action.line }] };
      return {
        lines: state.lines.map((l) =>
          esMismaLinea(l, action.line.product_id, action.line.variant_id)
            ? { ...l, cantidad: l.cantidad + action.line.cantidad }
            : l,
        ),
      };
    }

    case 'set-cantidad': {
      if (action.cantidad <= 0) {
        return {
          lines: state.lines.filter((l) => !esMismaLinea(l, action.product_id, action.variant_id)),
        };
      }
      return {
        lines: state.lines.map((l) =>
          esMismaLinea(l, action.product_id, action.variant_id) ? { ...l, cantidad: action.cantidad } : l,
        ),
      };
    }

    case 'quitar': {
      return {
        lines: state.lines.filter((l) => !esMismaLinea(l, action.product_id, action.variant_id)),
      };
    }

    case 'vaciar': {
      return { lines: [] };
    }

    case 'hidratar': {
      return { lines: action.state.lines.map((l) => ({ ...l })) };
    }

    default: {
      return state;
    }
  }
}

/** Cuántas unidades hay en total. */
export function cartCount(state: CartState): number {
  return state.lines.reduce((total, l) => total + l.cantidad, 0);
}

/**
 * Subtotal estimado con los precios del catálogo. Solo informativo: el checkout
 * recalcula el total en el servidor y nunca confía en este número.
 */
export function cartSubtotalEstimado(state: CartState): number {
  return state.lines.reduce((total, l) => total + l.precio_bob_cents * l.cantidad, 0);
}

function lineaValida(a: unknown): a is CartLine {
  if (typeof a !== 'object' || a === null) return false;
  const l = a as Record<string, unknown>;
  if (typeof l.product_id !== 'string' || l.product_id === '') return false;
  if (typeof l.cantidad !== 'number' || !Number.isFinite(l.cantidad) || l.cantidad <= 0) return false;
  if (typeof l.nombre !== 'string') return false;
  if (typeof l.precio_bob_cents !== 'number') return false;
  return true;
}

/** Lee el carrito del almacenamiento. JSON roto o línea inválida → carrito vacío. */
export function leerCarrito(storage: Storage): CartState {
  let crudo: string | null;
  try {
    crudo = storage.getItem(CART_KEY);
  } catch {
    return { lines: [] };
  }
  if (!crudo) return { lines: [] };

  try {
    const parsed: unknown = JSON.parse(crudo);
    const lines = (parsed as { lines?: unknown })?.lines;
    if (!Array.isArray(lines)) return { lines: [] };
    return { lines: lines.filter(lineaValida) };
  } catch {
    return { lines: [] };
  }
}

/** Guarda el carrito. Si el almacenamiento falla (modo privado), no rompe la app. */
export function guardarCarrito(storage: Storage, state: CartState): void {
  try {
    storage.setItem(CART_KEY, JSON.stringify(state));
  } catch {
    /* sin persistencia: el carrito vive solo en memoria */
  }
}