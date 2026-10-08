'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cartCount, cartReducer, cartSubtotalEstimado, guardarCarrito, leerCarrito } from '@/lib/cart'
import type { CartAction, CartState } from '@/lib/cart'

type ValorCarrito = {
  state: CartState
  dispatch: (accion: CartAction) => void
  count: number
  abierto: boolean
  setAbierto: (abierto: boolean) => void
  subtotal: number
  /** True cuando ya se leyo el localStorage: sirve para no mostrar un
   *  "carrito vacio" en el primer render antes de hidratar. */
  listo: boolean
}

const Contexto = createContext<ValorCarrito | null>(null)

/**
 * Estado del carrito. Vive en el cliente y se refleja en `localStorage` para
 * que recargar la pagina no borre lo que el visitante eligio.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] })
  const [abierto, setAbierto] = useState(false)
  const [listo, setListo] = useState(false)
  const hidratado = useRef(false)

  useEffect(() => {
    dispatch({ type: 'hidratar', state: leerCarrito(window.localStorage) })
    hidratado.current = true
    setListo(true)
  }, [])

  useEffect(() => {
    if (!hidratado.current) return
    guardarCarrito(window.localStorage, state)
  }, [state])

  const valor = useMemo<ValorCarrito>(
    () => ({
      state,
      dispatch,
      count: cartCount(state),
      abierto,
      setAbierto,
      subtotal: cartSubtotalEstimado(state),
      listo,
    }),
    [state, abierto, listo],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCarrito(): ValorCarrito {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useCarrito se uso fuera de CartProvider')
  return valor
}

export default CartProvider
