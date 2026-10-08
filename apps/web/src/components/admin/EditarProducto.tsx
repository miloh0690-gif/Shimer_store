'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import type { ApiErrorBody } from '@/lib/types'

/** Convierte lo que el dueño escribe en bolivianos a los centavos que pide la API. */
function aCentavos(bs: number): number {
  return Math.round(bs * 100)
}

/**
 * Edicion en linea de precio, stock y destacado.
 *
 * No edita `activo`: la API de catalogo solo devuelve productos activos, asi que
 * el estado real no se puede leer desde aqui y un toggle dejaria el producto
 * escondido sin forma de volver.
 *
 * Los precios se escriben en bolivianos porque asi piensa el dueño, y viajan en
 * centavos porque el dinero nunca es float en este proyecto.
 */
export function EditarProducto({
  productoId,
  stockInicial,
  destacadoInicial,
  precioInicial,
  precioOfertaInicial,
  token,
}: {
  productoId: string
  stockInicial: number
  destacadoInicial: boolean
  precioInicial: number
  precioOfertaInicial: number | null
  token: string
}) {
  const router = useRouter()
  const [stock, setStock] = useState(String(stockInicial))
  const [precio, setPrecio] = useState(String(precioInicial / 100))
  const [oferta, setOferta] = useState(precioOfertaInicial === null ? '' : String(precioOfertaInicial / 100))
  const [destacado, setDestacado] = useState(destacadoInicial)
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo')
  const [error, setError] = useState<string | null>(null)
  const guardando = estado === 'guardando'

  const cantidad = Number.parseInt(stock, 10)
  const precioBs = Number.parseFloat(precio)
  const ofertaBs = oferta.trim() === '' ? null : Number.parseFloat(oferta)

  const stockSucio = stock !== String(stockInicial)
  const destacadoSucio = destacado !== destacadoInicial
  const precioSucio = Math.abs((precioBs * 100 || 0) - precioInicial) > 0.5
  const ofertaSucia =
    (oferta === '' && precioOfertaInicial !== null) ||
    (ofertaBs !== null && Math.abs((ofertaBs * 100 || 0) - (precioOfertaInicial ?? 0)) > 0.5)
  const hayCambios = stockSucio || destacadoSucio || precioSucio || ofertaSucia

  async function guardar() {
    setEstado('guardando')
    setError(null)

    if (!Number.isInteger(cantidad) || cantidad < 0) {
      setError('El stock debe ser un numero entero de 0 o mas.')
      setEstado('error')
      return
    }

    const cuerpo: Record<string, unknown> = {}
    if (stockSucio) cuerpo.stock = cantidad
    if (destacadoSucio) cuerpo.destacado = destacado

    // Solo viajan los campos que el dueño toco: mandar el precio que no cambio
    // haria que un guardado de stock pise el precio con el valor de otra
    // pantalla.
    if (precioSucio) {
      if (!Number.isFinite(precioBs) || precioBs < 0) {
        setError('El precio debe ser un numero de 0 o mas.')
        setEstado('error')
        return
      }
    }
    if (ofertaBs !== null && (!Number.isFinite(ofertaBs) || ofertaBs < 0)) {
      setError('El precio en oferta debe ser un numero de 0 o mas.')
      setEstado('error')
      return
    }

    if (precioSucio || ofertaSucia) {
      const listaCentavos = precioSucio ? aCentavos(precioBs) : precioInicial
      const ofertaCentavos = ofertaSucia
        ? ofertaBs === null || ofertaBs === 0
          ? null
          : aCentavos(ofertaBs)
        : precioOfertaInicial

      // La misma regla de la base (oferta_menor) y del borde de la API: la
      // oferta tiene que ser menor que el precio de lista. Se revisa siempre que
      // toque cualquiera de los dos, porque bajar la lista por debajo de la
      // oferta que ya estaba es tan invalido como subir la oferta.
      if (ofertaCentavos !== null && ofertaCentavos >= listaCentavos) {
        setError('La oferta tiene que ser menor que el precio de lista.')
        setEstado('error')
        return
      }

      if (precioSucio) cuerpo.precio_bob_cents = listaCentavos
      if (ofertaSucia) cuerpo.precio_oferta_bob_cents = ofertaCentavos
    }

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
          type='checkbox'
          checked={destacado}
          onChange={(e) => setDestacado(e.target.checked)}
          className='accent-marca-violeta'
          aria-label={`Marcar ${productoId} como destacado`}
        />
        Destacado
      </label>

      <label className='flex items-center gap-2 text-sm text-tinta/70'>
        Precio de lista
        <input
          type='number'
          min={0}
          step='0.01'
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          aria-label='Precio de lista'
          className='w-24 rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm text-tinta outline-none focus:border-marca-violeta'
        />
      </label>

      <label className='flex items-center gap-2 text-sm text-tinta/70'>
        Precio en oferta
        <input
          type='number'
          min={0}
          step='0.01'
          value={oferta}
          placeholder={'sin oferta'}
          onChange={(e) => setOferta(e.target.value)}
          aria-label='Precio en oferta'
          className='w-24 rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm text-tinta outline-none focus:border-marca-violeta'
        />
      </label>

      <label className='flex items-center gap-2 text-sm text-tinta/70'>
        Stock
        <input
          type='number'
          min={0}
          step={1}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-label={`Stock del producto ${productoId}`}
          className='w-20 rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm text-tinta outline-none focus:border-marca-violeta'
        />
      </label>

      <button
        type='button'
        onClick={guardar}
        disabled={guardando || !hayCambios}
        className='rounded-full bg-[image:var(--gradiente-marca)] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100'
      >
        {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
      </button>

      {estado === 'guardado' && !error && <span className='text-xs text-menta'>Guardado</span>}
      {error && <span role='alert' className='text-xs text-rosa'>{error}</span>}
    </div>
  )
}

export default EditarProducto
