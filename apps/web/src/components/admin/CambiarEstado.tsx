'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'
import type { ApiErrorBody } from '@/lib/types'

const ESTADOS = [
  { valor: 'nuevo', etiqueta: 'Nuevo' },
  { valor: 'confirmado', etiqueta: 'Confirmado' },
  { valor: 'preparando', etiqueta: 'Preparando' },
  { valor: 'enviado', etiqueta: 'Enviado' },
  { valor: 'entregado', etiqueta: 'Entregado' },
  { valor: 'cancelado', etiqueta: 'Cancelado' },
] as const

export function CambiarEstado({
  pedidoId,
  estadoInicial,
  token,
}: {
  pedidoId: string
  estadoInicial: string
  token: string
}) {
  const router = useRouter()
  const [estado, setEstado] = useState(estadoInicial)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function cambiar(nuevo: string) {
    const anterior = estado
    setEstado(nuevo)
    setGuardando(true)
    setError(null)

    try {
      const respuesta = await fetch(apiUrl(`/api/orders/${pedidoId}/estado`), {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevo }),
      })

      if (!respuesta.ok) {
        let mensaje = 'No pudimos actualizar el estado.'
        try {
          const cuerpo = (await respuesta.json()) as ApiErrorBody
          if (cuerpo?.error?.message) mensaje = cuerpo.error.message
        } catch {
          // respuesta sin JSON
        }
        setEstado(anterior)
        setError(mensaje)
        return
      }

      router.refresh()
    } catch {
      setEstado(anterior)
      setError('No pudimos conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <select
        aria-label={`Estado del pedido ${pedidoId}`}
        value={estado}
        disabled={guardando}
        onChange={(e) => cambiar(e.target.value)}
        className="rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm text-tinta outline-none transition focus:border-marca-violeta disabled:opacity-50"
      >
        {ESTADOS.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rosa">{error}</p>}
    </div>
  )
}

export default CambiarEstado
