import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CartProvider, useCarrito } from './CartProvider'
import AddToCartButton from './AddToCartButton'
import { CART_KEY } from '@/lib/cart'

type Almacen = Storage & { datos: Record<string, string> }

/**
 * Node 26 expone un `localStorage` global experimental que pisa al de jsdom y
 * viene undefined, asi que hay que inyectarlo a mano en `window`.
 */
function storageFalso(): Almacen {
  const datos: Record<string, string> = {}
  return {
    datos,
    getItem: (k: string) => (k in datos ? datos[k]! : null),
    setItem: (k: string, v: string) => {
      datos[k] = String(v)
    },
    removeItem: (k: string) => {
      delete datos[k]
    },
    clear: () => {
      for (const k of Object.keys(datos)) delete datos[k]
    },
    key: (i: number) => Object.keys(datos)[i] ?? null,
    get length() {
      return Object.keys(datos).length
    },
  }
}

function instalarStorage(s: Storage) {
  Object.defineProperty(window, 'localStorage', { value: s, configurable: true, writable: true })
}

const LINEA = {
  product_id: 'p1',
  variant_id: null,
  cantidad: 1,
  nombre: 'Crayola Super Tips 150 Colores',
  precio_bob_cents: 54900,
  imagen: null,
}

function Banco({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

function Sonda() {
  const { state, dispatch, count, subtotal, abierto, setAbierto } = useCarrito()
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <span data-testid="lineas">{state.lines.length}</span>
      <span data-testid="abierto">{abierto ? 'si' : 'no'}</span>
      <button onClick={() => dispatch({ type: 'agregar', line: LINEA })}>agregar</button>
      <button
        onClick={() => dispatch({ type: 'set-cantidad', product_id: 'p1', variant_id: null, cantidad: 9 })}
      >
        nueve
      </button>
      <button onClick={() => setAbierto(true)}>abrir</button>
    </div>
  )
}

beforeEach(() => {
  instalarStorage(storageFalso())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CartProvider', () => {
  it('avisa cuando useCarrito se usa fuera del provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Sonda />)).toThrow('useCarrito')
  })

  it('hidrata las lineas guardadas en el navegador', () => {
    const s = storageFalso()
    s.setItem(
      CART_KEY,
      JSON.stringify({
        lines: [
          { ...LINEA, product_id: 'p1' },
          { ...LINEA, product_id: 'p2', cantidad: 2 },
        ],
      }),
    )
    instalarStorage(s)
    render(
      <Banco>
        <Sonda />
      </Banco>,
    )
    expect(screen.getByTestId('lineas').textContent).toBe('2')
    expect(screen.getByTestId('count').textContent).toBe('3')
  })

  it('no pisa lo guardado con el estado vacio del primer render', () => {
    const s = storageFalso()
    s.setItem(CART_KEY, JSON.stringify({ lines: [{ ...LINEA }] }))
    instalarStorage(s)
    render(
      <Banco>
        <Sonda />
      </Banco>,
    )
    expect(s.datos[CART_KEY]).toBeDefined()
    expect(JSON.parse(s.datos[CART_KEY]!).lines).toHaveLength(1)
  })

  it('agrega una linea y la persiste', () => {
    const s = storageFalso()
    instalarStorage(s)
    render(
      <Banco>
        <Sonda />
      </Banco>,
    )
    fireEvent.click(screen.getByText('agregar'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('subtotal').textContent).toBe('54900')
    expect(JSON.parse(s.datos[CART_KEY]!).lines).toHaveLength(1)
  })

  it('el subtotal cambia al instante al cambiar la cantidad', () => {
    render(
      <Banco>
        <Sonda />
      </Banco>,
    )
    fireEvent.click(screen.getByText('agregar'))
    fireEvent.click(screen.getByText('nueve'))
    expect(screen.getByTestId('count').textContent).toBe('9')
    expect(screen.getByTestId('subtotal').textContent).toBe(String(54900 * 9))
  })

  it('abre el drawer desde setAbierto', () => {
    render(
      <Banco>
        <Sonda />
      </Banco>,
    )
    expect(screen.getByTestId('abierto').textContent).toBe('no')
    fireEvent.click(screen.getByText('abrir'))
    expect(screen.getByTestId('abierto').textContent).toBe('si')
  })
})

describe('AddToCartButton', () => {
  function Montar({ stock }: { stock: number }) {
    return (
      <Banco>
        <AddToCartButton
          product={{ id: 'p1', nombre: 'Crayola', precio_bob_cents: 54900, stock }}
        />
      </Banco>
    )
  }

  it('deshabilita el boton y avisa cuando no hay stock', () => {
    render(<Montar stock={0} />)
    const boton = screen.getByRole('button')
    expect(boton).toBeDisabled()
    expect(boton).toHaveTextContent('Sin stock')
  })

  it('agrega al carrito y confirma con un check', () => {
    render(
      <Banco>
        <Sonda />
        <AddToCartButton
          product={{ id: 'p1', nombre: 'Crayola', precio_bob_cents: 54900, stock: 5 }}
          imagen="/logo.jpg"
        />
      </Banco>,
    )
    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('subtotal').textContent).toBe('54900')
  })
})
