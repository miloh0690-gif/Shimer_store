import { z } from 'zod'

export const ESTADO_PEDIDO = [
  'nuevo',
  'confirmado',
  'preparando',
  'enviado',
  'entregado',
  'cancelado',
] as const

export const EstadoPedidoSchema = z.enum(ESTADO_PEDIDO)

export const PatchPedidoSchema = z.object({ estado: EstadoPedidoSchema }).strict()

export const PatchProductoSchema = z
  .object({
    nombre: z.string().min(3).max(200).optional(),
    precio_bob_cents: z.number().int().min(0).optional(),
    precio_oferta_bob_cents: z.number().int().min(0).nullable().optional(),
    stock: z.number().int().min(0).optional(),
    activo: z.boolean().optional(),
    destacado: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.precio_bob_cents === undefined ||
      v.precio_oferta_bob_cents === undefined ||
      v.precio_oferta_bob_cents === null ||
      v.precio_oferta_bob_cents < v.precio_bob_cents,
    {
      message: 'El precio de oferta debe ser menor que el de lista',
      path: ['precio_oferta_bob_cents'],
    },
  )

export type PatchPedido = z.infer<typeof PatchPedidoSchema>
export type PatchProducto = z.infer<typeof PatchProductoSchema>