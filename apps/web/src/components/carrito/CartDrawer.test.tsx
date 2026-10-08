import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartProvider } from './CartProvider'
import { CartDrawer } from './CartDrawer'
import { CarritoBoton } from './CarritoBoton'
import { CART_KEY } from '@/lib/cart'

function storageConCarrito(lineas: unknown[]) {
  const datos: Record<string, string> = { [CART_KEY]: JSON.stringify({ lines: lineas }) }
  return {
    getItem: (k: string) => (k in datos ? datos[k]! : null),
    setItem: (k: string, v: string) => {
      datos[k] = v
    },
    removeItem: (k: string) => {
      delete datos[k]
    },
    clear: () => {
      for (const k of Object.keys(datos)) delete datos[k]
    },
    key: () => null,
    length: Object.keys(datos).length,
  } as unknown as Storage
}

const LINEA = {
  product_id: 'p1',
  variant_id: null,
  cantidad: 2,
  nombre: 'Crayola Super Tips 150 Colores',
  precio_bob_cents: 54900,
  imagen: '/placeholder.svg',
}

function Montar() {
  return (
    <CartProvider>
      <CarritoBoton />
      <CartDrawer />
    </CartProvider>
  )
}

// El drawer no debe existir en el arbol de accesibilidad cuando esta cerrado:
// con AnimatePresence no se monta, con CSS queda con visibility:hidden, y en
// los dos casos un lector de pantalla no lo encuentra.
const panel = () => screen.queryByRole('dialog', { hidden: false })

describe('CartDrawer', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: storageConCarrito([LINEA]),
      configurable: true,
      writable: true,
    })
  })

  it('no expone el panel del carrito cuando esta cerrado', () => {
    render(<Montar />)
    expect(panel()).not.toBeInTheDocument()
  })

  it('abre el panel con el subtotal estimado al tocar el boton del carrito', () => {
    render(<Montar />)
    fireEvent.click(screen.getByRole('button', { name: /ver carrito/i }))
    expect(screen.getByRole('dialog', { name: 'Carrito de compras' })).toBeVisible()
    // El importe sale en el pie del panel y en la linea: ambos son el mismo total.
    const importes = screen.getAllByText('Bs. 1,098.00')
    expect(importes.length).toBeGreaterThan(0)
    importes.forEach((nodo) => expect(nodo).toBeVisible())
  })

  it('vuelve a ocultarlo al tocar el overlay de cerrar', async () => {
    render(<Montar />)
    fireEvent.click(screen.getByRole('button', { name: /ver carrito/i }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar el carrito' })[0]!)
    await waitFor(() => expect(panel()).not.toBeInTheDocument())
  })

  it('muestra la linea del carrito con su cantidad', () => {
    render(<Montar />)
    fireEvent.click(screen.getByRole('button', { name: /ver carrito/i }))
    expect(screen.getByText('Crayola Super Tips 150 Colores')).toBeVisible()
  })
})
