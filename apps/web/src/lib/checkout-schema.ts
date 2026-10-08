import { z } from 'zod'

/**
 * Espejo del esquema que valida la API en `orders.routes.ts`. Se replica en el
 * cliente para avisar sin round-trip; la API sigue siendo la autoridad y el
 * total siempre se calcula en el servidor.
 */
export const CheckoutSchema = z
  .object({
    cliente_nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    cliente_email: z.string().trim().email('Escribí un correo válido'),
    cliente_telefono: z.string().trim().min(1, 'El teléfono es obligatorio'),
    envio_tipo: z.enum(['cochabamba', 'nacional']),
    envio_direccion: z.string().trim().optional(),
    envio_ciudad: z.string().trim().optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.envio_tipo !== 'nacional') return
    if (!datos.envio_direccion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['envio_direccion'],
        message: 'La dirección es obligatoria para envío nacional',
      })
    }
    if (!datos.envio_ciudad) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['envio_ciudad'],
        message: 'La ciudad es obligatoria para envío nacional',
      })
    }
  })

export type CheckoutDatos = z.infer<typeof CheckoutSchema>
