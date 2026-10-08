import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { validacion } from '../../errors.js'
import type { Env } from '../../env.js'
import type { CatalogDataSource } from '../catalog/catalog.types.js'
import { createOrder } from './orders.service.js'
import type { OrdersDataSource } from './orders.types.js'

// El correo se guarda en minúsculas porque Supabase entrega el suyo siempre en
// minúsculas: si el cliente escribe "Juan@Gmail.com" y después entra con
// "juan@gmail.com" no encontraría sus pedidos.
const bodySchema = z.object({
  cliente_nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  cliente_email: z.string().trim().toLowerCase().email('Correo inválido'),
  cliente_telefono: z.string().trim().min(1, 'El teléfono es obligatorio'),
  envio_tipo: z.enum(['cochabamba', 'nacional']),
  envio_direccion: z.string().trim().min(1).optional(),
  envio_ciudad: z.string().trim().min(1).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        variant_id: z.string().min(1).optional(),
        cantidad: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
})

export type OrdersRoutesDeps = {
  env: Env;
  catalog: CatalogDataSource;
  orders: OrdersDataSource;
};

export function ordersRoutes(deps: OrdersRoutesDeps): Router {
  const router = Router();

  // Un pedido por minuto y cinco por cinco minutos es el límite de la tienda;
  // este límite solo protege el endpoint, el general ya está en app.ts.
  const limitePedidos = rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => !deps.env.RATE_LIMIT_ENABLED,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Demasiados pedidos seguidos. Espera un minuto e intenta de nuevo.',
          details: [],
        },
      });
    },
  });

  router.post('/orders', limitePedidos, async (req, res) => {
    const idempotencyKey = req.header('idempotency-key');
    if (!idempotencyKey) {
      throw validacion('Falta el header idempotency-key');
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw validacion('Datos del pedido inválidos', parsed.error.issues);
    }

    const { order, creado } = await createOrder(deps.catalog, deps.orders, {
      idempotencyKey,
      ...parsed.data,
    });

    res.status(creado ? 201 : 200).json({
      id: order.id,
      folio: order.folio,
      estado: order.estado,
      total_bob_cents: order.total_bob_cents,
    });
  });

  return router;
}