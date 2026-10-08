'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import type { ApiErrorBody } from '@/lib/types'

/**
 * Edicion en linea de stock y destacado. No edita `activo`: la API de catalogo
 * solo devuelve productos activos, asi que el estado real no se puede leer desde
 * aqui y un toggle dejaria el producto escondido sin forma de volver.
 */
export function EditarProducto({
  productoId,
  stockInicial,
  destacadoInicial,
  token,
}: {
  productoId: string
  stockInicial: number
  destacadoInicial: boolean
  token: string
}) {
  const router = useRouter()
  const [stock, setStock] = useState(String(stockInicial))
  const [destacado, setDestacado] = useState(destacadoInicial)
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo')
  const [error, setError] = useState<string | null>(null)
  const guardando = estado === 'guardando'

  const cantidad = Number.parseInt(stock, 10)
  const stockSucio = stock !== String(stockInicial)
  const destacadoSucio = destacado !== destacadoInicial

  async function guardar() {
    setEstado('guardando')
    setError(null)

    const cuerpo: Record<string, unknown> = {}
    if (stockSucio) {
      if (!Number.isInteger(cantidad) || cantidad < 0) {
        setError('El stock debe ser un numero entero de 0 o mas.')
        setEstado('error')
        return
      }
      cuerpo.stock = cantidad
    }
    if (destacadoSucio) cuerpo.destacado = destacado

    if (Object.keys(cuerpo).length === 0) {
      setEstado('inactivo')
      return
    }

    try {
      const respuesta = await fetch(apiUrl(`/api/products/${productoId}`), {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuerpo),
      })

      if (!respuesta.ok) {
        let mensaje = 'No pudimos guardar el producto.'
        try {
          const cuerpoError = (await respuesta.json()) as ApiErrorBody
          if (cuerpoError?.error?.message) mensaje = cuerpoError.error.message
        } catch {
          // respuesta sin JSON
        }
        setError(mensaje)
        setEstado('error')
        return
      }

      setEstado('guardado')
      router.refresh()
    } catch {
      setError('No pudimos conectar con el servidor.')
      setEstado('error')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <label className="flex items-center gap-2 text-sm text-tinta/70">
        <input
          type="checkbox"
          checked={destacado}
          onChange={(e) => setDestacado(e.target.checked)}
          className="accent-marca-violeta"
        />
        Destacado
      </label>

      <label className="flex items-center gap-2 text-sm text-tinta/70">
        Stock
        <input
          type="number"
          min={0}
          step={1}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-label={`Stock del producto ${productoId}`}
          className="w-20 rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm text-tinta outline-none focus:border-marca-violeta"
        />
      </label>

      <button
        type="button"
        onClick={guardar}
        disabled={guardando || (!stockSucio && !destacadoSucio)}
        className="rounded-full bg-[image:var(--gradiente-marca)] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
      </button>

      {estado === 'guardado' && !error && <span className="text-xs text-menta">Guardado</span>}
      {error && <span className="text-xs text-rosa">{error}</span>}
    </div>
  )
}

export default EditarProducto
