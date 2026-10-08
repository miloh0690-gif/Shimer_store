import { describe, expect, it } from 'vitest'
import {
  CART_KEY,
  cartCount,
  cartReducer,
  cartSubtotalEstimado,
  guardarCarrito,
  leerCarrito,
  type CartLine,
  type CartState,
} from './cart'

const linea = (o: Partial<CartLine> = {}): CartLine => ({
  product_id: 'p1',
  variant_id: null,
  cantidad: 1,
  nombre: 'Crayola Super Tips 150 Colores',
  precio_bob_cents: 59500,
  imagen: null,
  ...o,
})

function storageFalso(): Storage {
  const mapa = new Map<string, string>()
  return {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: () => null,
    get length() {
      return mapa.size;
    },
  } as Storage
}

describe('cartReducer', () => {
  it('agregar suma la cantidad si la línea ya existe (mismo product_id y variant_id)', () => {
    const s1 = cartReducer({ lines: [] }, { type: 'agregar', line: linea({ cantidad: 2 }) })
    const s2 = cartReducer(s1, { type: 'agregar', line: linea({ cantidad: 3 }) })
    expect(s2.lines).toHaveLength(1)
    expect(s2.lines[0]?.cantidad).toBe(5)
  })

  it('agregar con distinta variante crea otra línea', () => {
    const s1 = cartReducer({ lines: [] }, { type: 'agregar', line: linea() })
    const s2 = cartReducer(s1, { type: 'agregar', line: linea({ variant_id: 'v2' }) })
    expect(s2.lines).toHaveLength(2)
  })

  it('nunca deja cantidad 0 ni negativa: "quitar" borra la línea', () => {
    const s1 = cartReducer(
      { lines: [linea({ cantidad: 1 })] },
      { type: 'set-cantidad', product_id: 'p1', variant_id: null, cantidad: 0 },
    )
    expect(s1.lines).toHaveLength(0)

    const s2 = cartReducer(
      { lines: [linea()] },
      { type: 'quitar', product_id: 'p1', variant_id: null },
    )
    expect(s2.lines).toHaveLength(0)

    const s3 = cartReducer(
      { lines: [linea()] },
      { type: 'set-cantidad', product_id: 'p1', variant_id: null, cantidad: -3 },
    )
    expect(s3.lines).toHaveLength(0)
  })

  it('set-cantidad no toca las líneas de otra variante', () => {
    const inicial: CartState = {
      lines: [linea({ variant_id: null }), linea({ variant_id: 'v2' })],
    }
    const s = cartReducer(inicial, {
      type: 'set-cantidad',
      product_id: 'p1',
      variant_id: 'v2',
      cantidad: 4,
    })
    expect(s.lines).toHaveLength(2)
    expect(s.lines.find((l) => l.variant_id === 'v2')?.cantidad).toBe(4)
    expect(s.lines.find((l) => l.variant_id === null)?.cantidad).toBe(1)
  })

  it('vaciar deja el carrito sin líneas', () => {
    const s = cartReducer({ lines: [linea(), linea({ product_id: 'p2' })] }, { type: 'vaciar' })
    expect(s.lines).toEqual([])
  })

  it('hidratar reemplaza el estado entero', () => {
    const s = cartReducer(
      { lines: [linea()] },
      { type: 'hidratar', state: { lines: [linea({ product_id: 'p9', cantidad: 7 })] } },
    )
    expect(s.lines).toHaveLength(1)
    expect(s.lines[0]?.product_id).toBe('p9')
  })

  it('el reducer es puro: no muta el estado de entrada', () => {
    const antes = { lines: [linea()] }
    const copia = JSON.parse(JSON.stringify(antes))
    cartReducer(antes, { type: 'agregar', line: linea({ cantidad: 4 }) })
    cartReducer(antes, { type: 'vaciar' })
    expect(antes).toEqual(copia)
  })
})

describe('cartCount y cartSubtotalEstimado', () => {
  it('cartCount suma las cantidades', () => {
    const s = cartReducer({ lines: [] }, { type: 'agregar', line: linea({ cantidad: 2 }) })
    const s2 = cartReducer(s, { type: 'agregar', line: linea({ variant_id: 'v2', cantidad: 3 }) })
    expect(cartCount(s2)).toBe(5)
    expect(cartCount({ lines: [] })).toBe(0)
  })

  it('cartSubtotalEstimado usa el precio del catálogo y el checkout lo recalcula el servidor', () => {
    const s = cartReducer({ lines: [] }, { type: 'agregar', line: linea({ cantidad: 2, precio_bob_cents: 54900 }) })
    expect(cartSubtotalEstimado(s)).toBe(109800)
  })
})

describe('leerCarrito y guardarCarrito', () => {
  // Node 26 expone un `localStorage` global experimental que pisa al de jsdom
  // y viene undefined, así que los tests usan un Storage falso explícito.

  it('leerCarrito con JSON corrupto devuelve carrito vacío sin lanzar', () => {
    expect(leerCarrito({ getItem: () => '{{{roto' } as unknown as Storage).lines).toEqual([])
  })

  it('leerCarrito sin datos devuelve carrito vacío', () => {
    expect(leerCarrito(storageFalso()).lines).toEqual([])
  })

  it('leerCarrito descarta líneas sin product_id o con cantidad no numérica', () => {
    const roto = JSON.stringify({
      lines: [
        linea(),
        { variant_id: null, cantidad: 1 },
        { product_id: 'p3', cantidad: 'dos' },
      ],
    })
    const s = leerCarrito({ getItem: () => roto } as unknown as Storage)
    expect(s.lines).toHaveLength(1)
    expect(s.lines[0]?.product_id).toBe('p1')
  })

  it('guardarCarrito escribe bajo CART_KEY y leerCarrito lo devuelve igual', () => {
    const storage = storageFalso()
    const estado: CartState = { lines: [linea({ cantidad: 3 })] }
    guardarCarrito(storage, estado)
    expect(storage.getItem(CART_KEY)).not.toBeNull()
    expect(leerCarrito(storage)).toEqual(estado)
  })

  it('guardarCarrito y leerCarrito sobreviven a un storage que lanza', () => {
    const roto = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cuota excedida');
      },
    } as unknown as Storage;
    guardarCarrito(roto, { lines: [linea()] });
    expect(leerCarrito(roto).lines).toEqual([])
  })
})